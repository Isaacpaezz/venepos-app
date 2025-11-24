"use server"

import { createClient } from "@/lib/supabase/server"
import { createChatwootService, ChatwootRateLimitError, ChatwootAPIError } from "@/lib/chatwoot/service"
import { revalidatePath } from "next/cache"

// =====================================================
// TIPOS
// =====================================================

export interface ProcessBatchResult {
  processed: number
  errors: number
  details: {
    sent: number
    failed: number
    skipped: number
  }
  errorMessages: string[]
}

// =====================================================
// WORKER DE EJECUCIÓN
// =====================================================

/**
 * Procesa un lote de mensajes pendientes en la cola de campañas
 * Envía mensajes a Chatwoot y actualiza el estado en la base de datos
 * 
 * @param batchSize Cantidad de mensajes a procesar (default: 5)
 * @param delayMs Delay en milisegundos entre cada mensaje (default: 1000)
 * @returns Estadísticas del procesamiento
 */
export async function processOutboundBatch(
  batchSize: number = 5,
  delayMs: number = 1000
): Promise<ProcessBatchResult> {
  const result: ProcessBatchResult = {
    processed: 0,
    errors: 0,
    details: {
      sent: 0,
      failed: 0,
      skipped: 0,
    },
    errorMessages: [],
  }

  try {
    const supabase = await createClient()

    // ==========================================
    // PASO 1: Seleccionar registros pendientes
    // ==========================================

    const { data: queueItems, error: selectError } = await supabase
      .from("campaign_queue")
      .select(`
        id,
        campaign_id,
        client_id,
        destinatario,
        mensaje_personalizado,
        status,
        intentos,
        max_intentos,
        campaigns!inner (
          nombre,
          organization_id,
          organizations!inner (
            chatwoot_base_url,
            chatwoot_account_id,
            chatwoot_api_token,
            chatwoot_inbox_id
          )
        ),
        clients (
          nombre,
          rif
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(batchSize)

    if (selectError) {
      console.error("Error seleccionando cola:", selectError)
      result.errorMessages.push(`Error de base de datos: ${selectError.message}`)
      return result
    }

    if (!queueItems || queueItems.length === 0) {
      console.log("No hay mensajes pendientes en la cola")
      return result
    }

    console.log(`Procesando ${queueItems.length} mensajes...`)

    // ==========================================
    // PASO 2: Procesar cada mensaje
    // ==========================================

    for (const item of queueItems) {
      try {
        result.processed++

        // Extraer campaigns y organizations (son arrays)
        const campaign = Array.isArray(item.campaigns) ? item.campaigns[0] : item.campaigns
        const org = campaign && Array.isArray(campaign.organizations) 
          ? campaign.organizations[0] 
          : campaign?.organizations
        if (!org || !org.chatwoot_base_url || !org.chatwoot_account_id || !org.chatwoot_api_token || !org.chatwoot_inbox_id) {
          console.error(`Organización sin configuración de Chatwoot: ${item.campaign_id}`)
          
          await supabase
            .from("campaign_queue")
            .update({
              status: "failed",
              failed_at: new Date().toISOString(),
              error_message: "Configuración de Chatwoot incompleta en la organización",
              intentos: item.intentos + 1,
            })
            .eq("id", item.id)

          result.details.failed++
          result.errors++
          result.errorMessages.push(`Queue ID ${item.id}: Sin configuración de Chatwoot`)
          continue
        }

        // Validar datos del mensaje
        if (!item.destinatario || !item.mensaje_personalizado) {
          console.error(`Mensaje sin destinatario o contenido: ${item.id}`)
          
          await supabase
            .from("campaign_queue")
            .update({
              status: "failed",
              failed_at: new Date().toISOString(),
              error_message: "Destinatario o mensaje vacío",
              intentos: item.intentos + 1,
            })
            .eq("id", item.id)

          result.details.failed++
          result.errors++
          result.errorMessages.push(`Queue ID ${item.id}: Datos inválidos`)
          continue
        }

        // Crear servicio de Chatwoot
        const chatwoot = createChatwootService({
          baseUrl: org.chatwoot_base_url,
          accountId: org.chatwoot_account_id,
          apiToken: org.chatwoot_api_token,
        })

        // Normalizar teléfono
        const phone = item.destinatario
        const client = Array.isArray(item.clients) ? item.clients[0] : item.clients
        const clientName = client?.nombre || "Cliente"
        const clientRif = client?.rif || ""

        // PASO 2.1: Buscar o crear contacto
        console.log(`Buscando contacto: ${phone}`)
        const contact = await chatwoot.getOrCreateContact(
          clientName,
          phone,
          clientRif
        )

        console.log(`Contacto encontrado/creado: ${contact.id}`)

        // PASO 2.2: Crear conversación
        console.log(`Creando conversación para contacto ${contact.id}`)
        const conversation = await chatwoot.createConversation(
          org.chatwoot_inbox_id,
          contact.id
        )

        console.log(`Conversación creada: ${conversation.id}`)

        // PASO 2.3: Enviar mensaje
        console.log(`Enviando mensaje a conversación ${conversation.id}`)
        const message = await chatwoot.sendMessage(
          conversation.id,
          item.mensaje_personalizado
        )

        console.log(`Mensaje enviado exitosamente: ${message.id}`)

        // PASO 2.4: Agregar etiquetas a la conversación
        const campaignName = campaign?.nombre || "Campaña"
        const labels = ["VenePOS", `Campaña-${campaignName}`]
        
        console.log(`Agregando etiquetas: ${labels.join(", ")}`)
        await chatwoot.addConversationLabels(conversation.id, labels)

        // PASO 2.5: Actualizar registro en la cola
        await supabase
          .from("campaign_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            provider_id: String(message.id),
            provider_status: "sent",
            chatwoot_conversation_id: conversation.id,
          })
          .eq("id", item.id)

        // Actualizar contador de enviados en la campaña
        await supabase.rpc("increment_campaign_sent", {
          campaign_id_param: item.campaign_id,
        })

        result.details.sent++

        // Delay entre mensajes
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }

      } catch (error) {
        result.errors++
        
        // Manejar diferentes tipos de errores
        if (error instanceof ChatwootRateLimitError) {
          console.error("Rate limit excedido, deteniendo procesamiento")
          
          result.errorMessages.push("Rate limit de Chatwoot excedido")
          
          // No actualizar el registro, se reintentará después
          result.details.skipped++
          
          // Detener el procesamiento del lote
          break

        } else if (error instanceof ChatwootAPIError) {
          console.error(`Error de API de Chatwoot: ${error.message}`)
          
          // Marcar como fallido si se excedieron los intentos
          const newAttempts = item.intentos + 1
          const shouldFail = newAttempts >= item.max_intentos

          await supabase
            .from("campaign_queue")
            .update({
              status: shouldFail ? "failed" : "pending",
              failed_at: shouldFail ? new Date().toISOString() : null,
              error_message: error.message,
              intentos: newAttempts,
            })
            .eq("id", item.id)

          result.details.failed++
          result.errorMessages.push(`Queue ID ${item.id}: ${error.message}`)

        } else {
          // Error desconocido
          console.error("Error inesperado procesando mensaje:", error)
          
          const errorMsg = error instanceof Error ? error.message : "Error desconocido"
          
          await supabase
            .from("campaign_queue")
            .update({
              status: "failed",
              failed_at: new Date().toISOString(),
              error_message: errorMsg,
              intentos: item.intentos + 1,
            })
            .eq("id", item.id)

          result.details.failed++
          result.errorMessages.push(`Queue ID ${item.id}: ${errorMsg}`)
        }
      }
    }

    // Revalidar página de campañas
    revalidatePath("/campaigns")

    console.log("Resultado del procesamiento:", result)
    return result

  } catch (error) {
    console.error("Error fatal en processOutboundBatch:", error)
    result.errorMessages.push(
      `Error fatal: ${error instanceof Error ? error.message : "Unknown error"}`
    )
    return result
  }
}

/**
 * Obtiene estadísticas de la cola de una campaña específica
 */
export async function getCampaignQueueStats(campaignId: string) {
  const supabase = await createClient()

  const { data: stats, error } = await supabase
    .from("campaign_queue")
    .select("status")
    .eq("campaign_id", campaignId)

  if (error || !stats) {
    return {
      total: 0,
      pending: 0,
      sent: 0,
      failed: 0,
    }
  }

  return {
    total: stats.length,
    pending: stats.filter((s) => s.status === "pending").length,
    sent: stats.filter((s) => s.status === "sent").length,
    failed: stats.filter((s) => s.status === "failed").length,
  }
}
