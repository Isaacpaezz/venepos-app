// =====================================================
// SERVICIO DE CHATWOOT
// =====================================================
// Cliente para interactuar con la API de Chatwoot
// Documentación: https://www.chatwoot.com/developers/api

// =====================================================
// TIPOS
// =====================================================

export interface ChatwootConfig {
  baseUrl: string
  accountId: string
  apiToken: string
}

export interface ChatwootContact {
  id: number
  name: string
  phone_number: string
  identifier?: string
  email?: string
}

export interface ChatwootConversation {
  id: number
  inbox_id: number
  contact_id: number
  status: string
}

export interface ChatwootMessage {
  id: number
  content: string
  message_type: string
  created_at: number
}

export class ChatwootRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ChatwootRateLimitError"
  }
}

export class ChatwootAPIError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "ChatwootAPIError"
    this.statusCode = statusCode
  }
}

// =====================================================
// CLIENTE DE CHATWOOT
// =====================================================

export class ChatwootService {
  private config: ChatwootConfig

  constructor(config: ChatwootConfig) {
    this.config = config
  }

  /**
   * Realiza una petición HTTP a la API de Chatwoot
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}${endpoint}`

    const headers = {
      "Content-Type": "application/json",
      "api_access_token": this.config.apiToken,
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Manejar rate limiting
      if (response.status === 429) {
        throw new ChatwootRateLimitError(
          "Se excedió el límite de solicitudes a Chatwoot. Intenta de nuevo más tarde."
        )
      }

      // Manejar otros errores HTTP
      if (!response.ok) {
        const errorText = await response.text()
        throw new ChatwootAPIError(
          `Error de Chatwoot: ${response.status} - ${errorText}`,
          response.status
        )
      }

      // Parsear respuesta JSON
      const data = await response.json()
      return data as T
    } catch (error) {
      // Re-lanzar errores conocidos
      if (
        error instanceof ChatwootRateLimitError ||
        error instanceof ChatwootAPIError
      ) {
        throw error
      }

      // Manejar errores de red u otros
      console.error("Error en petición a Chatwoot:", error)
      throw new ChatwootAPIError(
        `Error de conexión con Chatwoot: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      )
    }
  }

  /**
   * Busca un contacto por número de teléfono
   * @param phone Número de teléfono en formato E.164 (ej: +584121234567)
   * @returns Contact si existe, null si no existe
   */
  async findContact(phone: string): Promise<ChatwootContact | null> {
    try {
      // Normalizar teléfono al formato venezolano
      const normalizedPhone = this.normalizeVenezuelanPhone(phone)

      console.log(`🔍 Buscando contacto con teléfono: "${phone}" → "${normalizedPhone}"`)

      // Buscar contacto por teléfono
      const response = await this.request<{ payload: ChatwootContact[] }>(
        `/contacts/search?q=${encodeURIComponent(normalizedPhone)}`
      )

      console.log(`📋 Resultados de búsqueda: ${response.payload.length} contacto(s) encontrado(s)`)

      // Chatwoot devuelve un array, buscar coincidencia exacta
      const contact = response.payload.find(
        (c) => {
          const contactPhone = this.normalizeVenezuelanPhone(c.phone_number || "")
          return contactPhone === normalizedPhone
        }
      )

      if (contact) {
        console.log(`✅ Contacto encontrado: ID=${contact.id}, Nombre=${contact.name}`)
      } else {
        console.log(`❌ No se encontró contacto con teléfono ${normalizedPhone}`)
      }

      return contact || null
    } catch (error) {
      console.error("Error buscando contacto:", error)
      throw error
    }
  }

  /**
   * Normaliza un número de teléfono venezolano al formato internacional
   * @param phone Número de teléfono en cualquier formato
   * @returns Número en formato +58XXXXXXXXXX
   */
  private normalizeVenezuelanPhone(phone: string): string {
    // Remover espacios, guiones, paréntesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, "")
    
    // Si ya tiene +58, retornar tal cual
    if (cleaned.startsWith("+58")) {
      return cleaned
    }
    
    // Si tiene + pero no es +58, remover el + y agregar +58
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1)
    }
    
    // Si empieza con 58, agregar solo el +
    if (cleaned.startsWith("58")) {
      return `+${cleaned}`
    }
    
    // Si empieza con 0, removerlo (formato local 0414...)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1)
    }
    
    // Agregar +58 al inicio
    return `+58${cleaned}`
  }

  /**
   * Crea un nuevo contacto en Chatwoot
   * @param name Nombre del contacto
   * @param phone Número de teléfono
   * @param identifier Identificador único (ej: RIF, ID)
   * @returns Contact creado
   */
  async createContact(
    name: string,
    phone: string,
    identifier?: string
  ): Promise<ChatwootContact> {
    try {
      // Normalizar teléfono al formato venezolano +58XXXXXXXXXX
      const normalizedPhone = this.normalizeVenezuelanPhone(phone)
      
      console.log(`📞 Normalizando teléfono: "${phone}" → "${normalizedPhone}"`)

      const payload = {
        name,
        phone_number: normalizedPhone,
        identifier: identifier || undefined,
      }

      const response = await this.request<{ payload: ChatwootContact }>(
        "/contacts",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )

      console.log(`✅ Contacto creado exitosamente: ID=${response.payload?.id}, Nombre=${response.payload?.name}`)

      return response.payload
    } catch (error) {
      console.error("Error creando contacto:", error)
      throw error
    }
  }

  /**
   * Crea una conversación con un contacto en un inbox específico
   * @param sourceId ID del inbox (canal de WhatsApp, SMS, etc.)
   * @param contactId ID del contacto en Chatwoot
   * @returns Conversation creada
   */
  async createConversation(
    sourceId: string,
    contactId: number
  ): Promise<ChatwootConversation> {
    try {
      const payload = {
        source_id: sourceId,
        inbox_id: parseInt(sourceId), // Inbox ID es numérico
        contact_id: contactId,
        status: "open",
      }

      const response = await this.request<ChatwootConversation>(
        "/conversations",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )

      return response
    } catch (error) {
      console.error("Error creando conversación:", error)
      throw error
    }
  }

  /**
   * Envía un mensaje a una conversación existente
   * @param conversationId ID de la conversación
   * @param content Contenido del mensaje
   * @returns Message enviado
   */
  async sendMessage(
    conversationId: number,
    content: string
  ): Promise<ChatwootMessage> {
    try {
      const payload = {
        content,
        message_type: "outgoing",
        private: false,
      }

      const response = await this.request<ChatwootMessage>(
        `/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )

      return response
    } catch (error) {
      console.error("Error enviando mensaje:", error)
      throw error
    }
  }

  /**
   * Agrega etiquetas a una conversación
   * @param conversationId ID de la conversación en Chatwoot
   * @param labels Array de etiquetas a agregar (ej: ['VenePOS', 'Campaña-PromoNavidad'])
   * @returns Labels agregadas
   */
  async addConversationLabels(
    conversationId: number,
    labels: string[]
  ): Promise<{ labels: string[] }> {
    try {
      const payload = {
        labels,
      }

      const response = await this.request<{ labels: string[] }>(
        `/conversations/${conversationId}/labels`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )

      return response
    } catch (error) {
      console.error("Error agregando etiquetas:", error)
      // No lanzar error - las etiquetas son nice-to-have
      // Si fallan no queremos romper el flujo de envío
      return { labels: [] }
    }
  }

  /**
   * Obtiene o crea un contacto (helper method)
   * Busca primero, si no existe lo crea
   */
  async getOrCreateContact(
    name: string,
    phone: string,
    identifier?: string
  ): Promise<ChatwootContact> {
    // Intentar buscar primero
    const existingContact = await this.findContact(phone)

    if (existingContact) {
      return existingContact
    }

    // Si no existe, crear
    return await this.createContact(name, phone, identifier)
  }
}

/**
 * Factory function para crear una instancia del servicio
 */
export function createChatwootService(
  config: ChatwootConfig
): ChatwootService {
  return new ChatwootService(config)
}
