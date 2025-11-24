/**
 * =====================================================
 * WEBHOOK ENDPOINT: Chatwoot Events
 * =====================================================
 * 
 * Este endpoint recibe eventos de Chatwoot en tiempo real.
 * 
 * EVENTOS MANEJADOS:
 * - message_created: Cuando un cliente responde a un mensaje
 * - conversation_updated: Cuando se actualizan etiquetas
 * 
 * CASOS DE USO:
 * 1. Rastrear respuestas de clientes a campañas
 * 2. Marcar terminales como "recuperados" cuando se asigna etiqueta
 * 
 * TESTING LOCAL:
 * Para probar este webhook en local necesitas exponer tu localhost
 * usando ngrok o similar:
 * 
 *   npx ngrok http 3000
 * 
 * Luego configura en Chatwoot:
 *   Settings → Integrations → Webhooks
 *   URL: https://tu-dominio.ngrok.io/api/webhooks/chatwoot
 *   Events: message_created, conversation_updated
 * 
 * PRODUCCIÓN:
 * Una vez desplegado en Vercel, usa la URL de producción:
 *   https://tu-app.vercel.app/api/webhooks/chatwoot
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// =====================================================
// TIPOS DE PAYLOADS DE CHATWOOT
// =====================================================

interface ChatwootWebhookPayload {
  event: string
  account?: {
    id: number
    name: string
  }
  conversation?: {
    id: number
    inbox_id: number
    status: string
    labels?: string[]
  }
  message?: {
    id: number
    content: string
    message_type: number // 0 = incoming, 1 = outgoing
    private: boolean
    created_at: number
    sender?: {
      id: number
      name: string
      type: string
    }
  }
  sender?: {
    id: number
    name: string
    phone_number?: string
  }
}

// =====================================================
// VALIDACIÓN DE SEGURIDAD
// =====================================================

/**
 * Valida que el account_id del webhook coincida con alguna
 * organización en nuestra base de datos
 */
async function validateAccountId(accountId: number): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("chatwoot_account_id", String(accountId))
    .single()

  if (error || !data) {
    console.error("Account ID no encontrado:", accountId)
    return null
  }

  return data.id
}

// =====================================================
// HANDLER: Message Created (Respuesta de Cliente)
// =====================================================

async function handleMessageCreated(
  payload: ChatwootWebhookPayload,
  organizationId: string
) {
  const message = payload.message
  const conversation = payload.conversation

  if (!message || !conversation) {
    console.log("Payload incompleto, ignorando evento")
    return { processed: false, reason: "payload_incompleto" }
  }

  // Solo procesar mensajes entrantes (incoming) no privados
  if (message.message_type !== 0 || message.private) {
    console.log("Mensaje no es incoming o es privado, ignorando")
    return { processed: false, reason: "mensaje_no_relevante" }
  }

  console.log(`📨 Mensaje entrante en conversación ${conversation.id}`)

  const supabase = await createClient()

  // Buscar el registro en campaign_queue usando conversation_id
  const { data: queueItem, error: findError } = await supabase
    .from("campaign_queue")
    .select("id, campaign_id, client_id, has_replied")
    .eq("chatwoot_conversation_id", conversation.id)
    .single()

  if (findError || !queueItem) {
    console.log("No se encontró registro en campaign_queue para esta conversación")
    return { processed: false, reason: "no_queue_match" }
  }

  // Si ya estaba marcado como respondido, no duplicar
  if (queueItem.has_replied) {
    console.log("Cliente ya había respondido anteriormente")
    return { processed: false, reason: "ya_respondido" }
  }

  // Actualizar campaign_queue
  const { error: updateError } = await supabase
    .from("campaign_queue")
    .update({
      has_replied: true,
      replied_at: new Date().toISOString(),
    })
    .eq("id", queueItem.id)

  if (updateError) {
    console.error("Error actualizando campaign_queue:", updateError)
    return { processed: false, reason: "db_error" }
  }

  // Registrar interacción
  const { error: interactionError } = await supabase
    .from("interactions")
    .insert({
      organization_id: organizationId,
      client_id: queueItem.client_id,
      campaign_id: queueItem.campaign_id,
      type: "whatsapp_reply",
      channel: "whatsapp",
      content: message.content,
      provider: "chatwoot",
      provider_id: String(message.id),
      metadata: {
        conversation_id: conversation.id,
        message_id: message.id,
        sender: payload.sender,
      },
      occurred_at: new Date(message.created_at * 1000).toISOString(),
    })

  if (interactionError) {
    console.error("Error registrando interacción:", interactionError)
    // No fallar por esto, la actualización principal ya se hizo
  }

  console.log("✅ Respuesta de cliente registrada exitosamente")

  return { 
    processed: true, 
    queueItemId: queueItem.id,
    clientReplied: true,
  }
}

// =====================================================
// HANDLER: Conversation Updated (Etiquetas)
// =====================================================

async function handleConversationUpdated(
  payload: ChatwootWebhookPayload,
  organizationId: string
) {
  const conversation = payload.conversation

  if (!conversation || !conversation.labels) {
    console.log("No hay etiquetas en el payload, ignorando")
    return { processed: false, reason: "no_labels" }
  }

  // Buscar etiqueta "RECUPERADO" (case insensitive)
  const hasRecoveredLabel = conversation.labels.some(
    (label) => label.toLowerCase() === "recuperado"
  )

  if (!hasRecoveredLabel) {
    console.log("Etiqueta RECUPERADO no encontrada")
    return { processed: false, reason: "no_recovered_label" }
  }

  console.log(`🏷️ Etiqueta RECUPERADO detectada en conversación ${conversation.id}`)

  const supabase = await createClient()

  // Buscar el terminal asociado a esta conversación
  const { data: queueItem, error: findError } = await supabase
    .from("campaign_queue")
    .select(`
      id,
      client_id,
      clients!inner (
        terminals (
          afipos,
          status
        )
      )
    `)
    .eq("chatwoot_conversation_id", conversation.id)
    .single()

  if (findError || !queueItem) {
    console.log("No se encontró cliente/terminal para esta conversación")
    return { processed: false, reason: "no_terminal_match" }
  }

  // @ts-ignore - Supabase types pueden ser complejos
  const terminals = queueItem.clients?.terminals || []

  if (terminals.length === 0) {
    console.log("Cliente no tiene terminales asociados")
    return { processed: false, reason: "no_terminals" }
  }

  // Actualizar todos los terminales del cliente como recuperados
  const terminalIds = terminals.map((t: any) => t.afipos)

  const { error: updateError } = await supabase
    .from("terminals")
    .update({
      status: "recovered",
      recovery_source: "agent_manual",
      recovered_at: new Date().toISOString(),
    })
    .in("afipos", terminalIds)
    .eq("organization_id", organizationId)

  if (updateError) {
    console.error("Error actualizando terminales:", updateError)
    return { processed: false, reason: "db_error" }
  }

  console.log(`✅ ${terminalIds.length} terminal(es) marcado(s) como recuperado(s)`)

  // Registrar interacción de conversión
  const { error: interactionError } = await supabase
    .from("interactions")
    .insert({
      organization_id: organizationId,
      client_id: queueItem.client_id,
      type: "conversion",
      channel: "whatsapp",
      content: "Terminal marcado como RECUPERADO por agente",
      provider: "chatwoot",
      provider_id: String(conversation.id),
      metadata: {
        conversation_id: conversation.id,
        terminal_ids: terminalIds,
        labels: conversation.labels,
      },
    })

  if (interactionError) {
    console.error("Error registrando interacción:", interactionError)
  }

  return { 
    processed: true, 
    terminalsRecovered: terminalIds.length,
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Parsear payload
    const payload: ChatwootWebhookPayload = await request.json()

    console.log("📥 Webhook recibido:", payload.event)

    // Validar que tenemos un account_id
    if (!payload.account?.id) {
      console.error("Webhook sin account_id")
      return NextResponse.json(
        { error: "Account ID requerido" },
        { status: 400 }
      )
    }

    // Validar que el account_id pertenece a una organización
    const organizationId = await validateAccountId(payload.account.id)

    if (!organizationId) {
      console.error("Account ID no autorizado:", payload.account.id)
      return NextResponse.json(
        { error: "Account ID no autorizado" },
        { status: 403 }
      )
    }

    // Procesar según el tipo de evento
    let result

    switch (payload.event) {
      case "message_created":
        result = await handleMessageCreated(payload, organizationId)
        break

      case "conversation_updated":
        result = await handleConversationUpdated(payload, organizationId)
        break

      default:
        console.log(`Evento no manejado: ${payload.event}`)
        return NextResponse.json({
          received: true,
          event: payload.event,
          processed: false,
          reason: "evento_no_manejado",
        })
    }

    return NextResponse.json({
      received: true,
      event: payload.event,
      ...result,
    })

  } catch (error) {
    console.error("Error procesando webhook:", error)
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

// Responder OK a requests GET (útil para verificar que el endpoint existe)
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/chatwoot",
    methods: ["POST"],
    description: "Webhook endpoint para eventos de Chatwoot",
  })
}
