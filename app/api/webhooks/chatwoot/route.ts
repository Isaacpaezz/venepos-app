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
import { createClient } from "@supabase/supabase-js"

// Crear cliente de administración para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// TIPOS DE PAYLOADS DE CHATWOOT
// =====================================================

interface ChatwootWebhookPayload {
  event: string
  
  // Campos de nivel superior (message_created y conversation_updated)
  id?: number
  content?: string
  message_type?: number | string // 0 o "incoming" = incoming, 1 o "outgoing" = outgoing
  private?: boolean
  created_at?: number | string // Unix timestamp o ISO 8601 string
  inbox_id?: number
  status?: string
  labels?: string[]
  
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
    created_at: number | string // Unix timestamp o ISO 8601 string
    sender?: {
      id: number
      name: string
      type: string
    }
  }
  // Array de mensajes (presente en conversation_updated)
  messages?: Array<{
    id: number
    account_id: number
    content: string
    message_type: number // 0 = incoming, 1 = outgoing
    private: boolean
    created_at: number | string // Unix timestamp o ISO 8601 string
  }>
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
  // Intentar primero como número (tipo nativo)
  let { data, error } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("chatwoot_account_id", accountId)
    .single()

  // Si no funciona, intentar como string (por compatibilidad)
  if (error || !data) {
    console.log(`Intentando buscar account_id como string: "${accountId}"`)
    const result = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("chatwoot_account_id", String(accountId))
      .single()
    
    data = result.data
    error = result.error
  }

  if (error || !data) {
    console.error("Account ID no encontrado (intentado como número y string):", accountId)
    console.error("Error de Supabase:", error)
    return null
  }

  console.log("✅ Organization encontrada:", data.id)
  return data.id
}

// =====================================================
// HANDLER: Message Created (Respuesta de Cliente)
// =====================================================

async function handleMessageCreated(
  payload: ChatwootWebhookPayload,
  organizationId: string
) {
  // Extraer datos del mensaje
  // En message_created, los datos están en el nivel superior Y en payload.message
  const message = payload.message || {
    id: payload.id,
    content: payload.content,
    message_type: payload.message_type,
    private: payload.private,
    created_at: payload.created_at,
  }
  
  const conversation = payload.conversation

  if (!conversation) {
    console.log("Payload sin conversación, ignorando evento")
    return { processed: false, reason: "payload_incompleto" }
  }

  // Detectar tipo de mensaje (puede ser número 0 o string "incoming")
  const isIncoming = message.message_type === 0 || 
                     message.message_type === "incoming" ||
                     (payload as any).message_type === "incoming"
  
  const isPrivate = message.private || (payload as any).private

  // Solo procesar mensajes entrantes (incoming) no privados
  if (!isIncoming || isPrivate) {
    console.log("Mensaje no es incoming o es privado, ignorando")
    return { processed: false, reason: "mensaje_no_relevante" }
  }

  console.log(`📨 Mensaje entrante en conversación ${conversation.id}`)
  console.log(`📝 Contenido: "${message.content || payload.content}"`)

  // Buscar el registro en campaign_queue usando conversation_id
  // Usar supabaseAdmin para bypass RLS
  const { data: queueItem, error: findError } = await supabaseAdmin
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
  const { error: updateError } = await supabaseAdmin
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
  const messageContent = message.content || (payload as any).content || ""
  const messageId = message.id || (payload as any).id
  
  // Extraer y normalizar timestamp
  // Puede venir como número (Unix timestamp) o string (ISO 8601)
  const rawTimestamp = message.created_at || (payload as any).created_at
  let occurredAt: string
  
  if (typeof rawTimestamp === 'string') {
    // Ya es ISO string, usarlo directamente
    occurredAt = rawTimestamp
  } else if (typeof rawTimestamp === 'number') {
    // Es Unix timestamp, convertir a ISO
    occurredAt = new Date(rawTimestamp * 1000).toISOString()
  } else {
    // Fallback: usar timestamp actual
    occurredAt = new Date().toISOString()
  }
  
  const { error: interactionError } = await supabaseAdmin
    .from("interactions")
    .insert({
      organization_id: organizationId,
      client_id: queueItem.client_id,
      campaign_id: queueItem.campaign_id,
      type: "whatsapp_reply",
      channel: "whatsapp",
      content: messageContent,
      provider: "chatwoot",
      provider_id: String(messageId),
      metadata: {
        conversation_id: conversation.id,
        message_id: messageId,
        sender: payload.sender,
      },
      occurred_at: occurredAt,
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
  // Extraer datos de conversación
  // En conversation_updated, los datos pueden estar en nivel superior O en payload.conversation
  const conversation = payload.conversation || {
    id: (payload as any).id,
    inbox_id: (payload as any).inbox_id,
    status: (payload as any).status,
    labels: (payload as any).labels,
  }

  if (!conversation.id) {
    console.log("Payload sin ID de conversación, ignorando evento")
    return { processed: false, reason: "payload_incompleto" }
  }

  console.log(`🔄 Procesando conversation_updated para conversación ${conversation.id}`)

  // PRIORIDAD 1: Verificar si se agregó la etiqueta "RECUPERADO"
  // Esta es la acción más importante para el negocio
  const labels = conversation.labels || []
  const hasRecuperadoLabel = labels.some(
    (label) => label.toLowerCase() === "recuperado"
  )

  if (hasRecuperadoLabel) {
    console.log(`🏷️ Etiqueta RECUPERADO detectada en conversación ${conversation.id}`)
    
    // Buscar el terminal asociado a esta conversación
    // Usar supabaseAdmin para bypass RLS
    const { data: queueItem, error: findError } = await supabaseAdmin
      .from("campaign_queue")
      .select("id, campaign_id, client_id, terminal_id")
      .eq("chatwoot_conversation_id", conversation.id)
      .single()

    if (findError || !queueItem) {
      console.log(`❌ No se encontró registro en campaign_queue para conversación ${conversation.id}`)
      console.log("Error de Supabase:", findError)
      console.log("💡 Tip: Esta conversación debe haber sido creada por una campaña para poder marcar terminal como recuperado")
      return { processed: false, reason: "queue_not_found" }
    }

    if (!queueItem.terminal_id) {
      console.log("Registro en campaign_queue sin terminal_id asociado")
      return { processed: false, reason: "no_terminal" }
    }

    // Actualizar el terminal a estado "recovered"
    const { error: updateError } = await supabaseAdmin
      .from("terminals")
      .update({
        status: "recovered",
        recovery_source: "agent_manual",
        recovered_at: new Date().toISOString(),
      })
      .eq("id", queueItem.terminal_id)

    if (updateError) {
      console.error("Error actualizando terminal:", updateError)
      return { processed: false, reason: "db_error" }
    }

    // Registrar interacción de conversión
    const { error: interactionError } = await supabaseAdmin
      .from("interactions")
      .insert({
        organization_id: organizationId,
        client_id: queueItem.client_id,
        campaign_id: queueItem.campaign_id,
        type: "conversion",
        channel: "whatsapp",
        content: "Terminal marcado como RECUPERADO",
        provider: "chatwoot",
        provider_id: String(conversation.id),
        metadata: {
          conversation_id: conversation.id,
          labels: labels,
          recovery_source: "agent_manual",
        },
        occurred_at: new Date().toISOString(),
      })

    if (interactionError) {
      console.error("Error registrando interacción:", interactionError)
      // No fallar por esto, la actualización principal ya se hizo
    }

    console.log("✅ Terminal recuperado registrado exitosamente")

    return { 
      processed: true, 
      action: "terminal_recovered",
      terminal_id: queueItem.terminal_id 
    }
  }

  // PRIORIDAD 2: Verificar si hay un mensaje incoming del cliente
  // Chatwoot a veces envía conversation_updated en lugar de message_created
  if (payload.messages && payload.messages.length > 0) {
    const lastMessage = payload.messages[payload.messages.length - 1]
    
    // Si es mensaje incoming (tipo 0) y no privado, procesarlo como respuesta
    if (lastMessage.message_type === 0 && !lastMessage.private) {
      console.log(`📨 Mensaje incoming detectado en conversation_updated (ID: ${lastMessage.id})`)
      
      // Procesar como respuesta de cliente usando la misma lógica
      const messageResult = await handleMessageCreated(
        {
          ...payload,
          message: {
            id: lastMessage.id,
            content: lastMessage.content,
            message_type: lastMessage.message_type,
            private: lastMessage.private,
            created_at: lastMessage.created_at,
          }
        },
        organizationId
      )
      
      // Si procesamos el mensaje, retornar ese resultado
      if (messageResult.processed) {
        return messageResult
      }
    }
  }

  // Ningún caso procesable
  console.log("Conversación actualizada sin mensaje incoming ni etiqueta RECUPERADO, ignorando")
  return { processed: false, reason: "no_relevante" }
}

// =====================================================
// MAIN HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 POST /api/webhooks/chatwoot recibido")
    console.log("Headers:", Object.fromEntries(request.headers))
    
    // Parsear payload
    const payload: ChatwootWebhookPayload = await request.json()

    console.log("📥 Webhook recibido:", payload.event)
    console.log("📦 Payload completo:", JSON.stringify(payload, null, 2))

    // Extraer account_id de diferentes posibles ubicaciones
    // Chatwoot puede enviar el account_id en diferentes formatos según el evento
    let accountId: number | undefined = payload.account?.id

    // Si no está en account.id, intentar extraerlo de messages
    if (!accountId && payload.messages && payload.messages.length > 0) {
      accountId = payload.messages[0].account_id
      console.log("Account ID extraído de messages:", accountId)
    }

    // Validar que tenemos un account_id
    if (!accountId) {
      console.error("Webhook sin account_id en ninguna ubicación")
      return NextResponse.json(
        { error: "Account ID requerido" },
        { status: 400 }
      )
    }

    console.log("✅ Account ID encontrado:", accountId)

    // Validar que el account_id pertenece a una organización
    const organizationId = await validateAccountId(accountId)

    if (!organizationId) {
      console.error("Account ID no autorizado:", accountId)
      return NextResponse.json(
        { error: "Account ID no autorizado" },
        { status: 403 }
      )
    }

    console.log("✅ Organization ID validado:", organizationId)

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

// =====================================================
// GET: Health Check
// =====================================================

export async function GET() {
  console.log("✅ GET /api/webhooks/chatwoot - Health check")
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/chatwoot",
    methods: ["POST"],
    description: "Webhook endpoint para eventos de Chatwoot",
    timestamp: new Date().toISOString(),
  })
}
