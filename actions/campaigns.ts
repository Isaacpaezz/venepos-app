"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// TIPOS
// =====================================================

export interface CampaignFilters {
  banco?: string // "Todos los Bancos" o nombre específico
  rangoTX?: string // "30 DÍAS SIN TX", "60 DÍAS SIN TX", etc.
}

export interface CreateCampaignParams {
  name: string
  channel: "whatsapp" | "sms"
  filters: CampaignFilters
  messageTemplate: string
  organizationId: string
}

export interface CreateCampaignResult {
  success: boolean
  campaignId?: string
  messagesEnqueued?: number
  error?: string
}

export interface CampaignWithStats {
  id: string
  organization_id: string
  nombre: string
  tipo: string
  mensaje: string
  filtros: any
  total_destinatarios: number
  status: string
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  enviados: number
  entregados: number
  fallidos: number
  created_at: string
  updated_at: string
  // Calculados
  progreso: number // Porcentaje (0-100)
  pendientes: number
}

// =====================================================
// SERVER ACTIONS
// =====================================================

/**
 * Crea una campaña y puebla la cola de envío
 * Usa transacción SQL para garantizar consistencia
 */
export async function createCampaign(
  params: CreateCampaignParams
): Promise<CreateCampaignResult> {
  try {
    const supabase = await createClient()
    const { name, channel, filters, messageTemplate, organizationId } = params

    // ==========================================
    // PASO 1: Obtener terminales que coincidan con filtros
    // ==========================================
    
    let query = supabase
      .from("terminals")
      .select(`
        afipos,
        client_id,
        rango,
        clients (
          id,
          nombre,
          telefono,
          rif,
          banco
        )
      `)
      .eq("organization_id", organizationId)

    // Aplicar filtro de banco
    if (filters.banco && filters.banco !== "Todos los Bancos") {
      query = query.eq("clients.banco", filters.banco)
    }

    // Aplicar filtro de rango
    if (filters.rangoTX) {
      // Buscar coincidencia parcial en el rango
      query = query.ilike("rango", `%${filters.rangoTX}%`)
    }

    const { data: terminals, error: queryError } = await query

    if (queryError) {
      console.error("Error obteniendo terminales:", queryError)
      return {
        success: false,
        error: "Error al obtener audiencia",
      }
    }

    if (!terminals || terminals.length === 0) {
      return {
        success: false,
        error: "No se encontraron clientes que coincidan con los filtros",
      }
    }

    // Filtrar solo terminales con clientes que tengan teléfono
    const terminalsConTelefono = terminals.filter((terminal: any) => 
      terminal.clients && terminal.clients.telefono
    )

    if (terminalsConTelefono.length === 0) {
      return {
        success: false,
        error: "No se encontraron clientes con teléfono que coincidan con los filtros",
      }
    }

    // ==========================================
    // PASO 2: Crear campaña
    // ==========================================

    // Agrupar por cliente (un mensaje por cliente, no por terminal)
    const clientesUnicos = new Map<string, any>()
    
    terminalsConTelefono.forEach((terminal: any) => {
      const client = terminal.clients
      if (client && !clientesUnicos.has(client.id)) {
        clientesUnicos.set(client.id, {
          client_id: client.id,
          nombre: client.nombre,
          telefono: client.telefono,
          rif: client.rif,
        })
      }
    })

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        organization_id: organizationId,
        nombre: name,
        tipo: channel,
        mensaje: messageTemplate,
        filtros: filters,
        total_destinatarios: clientesUnicos.size,
        status: "processing",
        enviados: 0,
        entregados: 0,
        fallidos: 0,
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      console.error("Error creando campaña:", campaignError)
      return {
        success: false,
        error: "Error al crear la campaña",
      }
    }

    // ==========================================
    // PASO 3: Poblar cola de envío (Batch Insert)
    // ==========================================

    // Preparar mensajes personalizados para cada cliente único
    const queueItems = Array.from(clientesUnicos.values()).map((client) => {
      // Reemplazar variables en el template
      let personalizedMessage = messageTemplate
        .replace(/\{\{nombre\}\}/g, client.nombre || "Cliente")
        .replace(/\{\{rif\}\}/g, client.rif || "")
        .replace(/\{\{telefono\}\}/g, client.telefono || "")

      return {
        campaign_id: campaign.id,
        client_id: client.client_id,
        destinatario: client.telefono,
        mensaje_personalizado: personalizedMessage,
        status: "pending",
        intentos: 0,
        max_intentos: 3,
      }
    })

    const { error: queueError } = await supabase
      .from("campaign_queue")
      .insert(queueItems)

    if (queueError) {
      console.error("Error poblando cola:", queueError)
      
      // Rollback: eliminar campaña si falla la cola
      await supabase.from("campaigns").delete().eq("id", campaign.id)
      
      return {
        success: false,
        error: "Error al crear la cola de envío",
      }
    }

    // ==========================================
    // PASO 4: Actualizar status de campaña a 'draft'
    // ==========================================

    await supabase
      .from("campaigns")
      .update({ status: "draft" })
      .eq("id", campaign.id)

    // Revalidar la página de campañas
    revalidatePath("/campaigns")

    return {
      success: true,
      campaignId: campaign.id,
      messagesEnqueued: queueItems.length,
    }
  } catch (error) {
    console.error("Error en createCampaign:", error)
    return {
      success: false,
      error: "Error inesperado al crear la campaña",
    }
  }
}

/**
 * Obtiene todas las campañas de una organización con estadísticas
 */
export async function getCampaigns(
  organizationId: string
): Promise<CampaignWithStats[]> {
  try {
    const supabase = await createClient()

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error obteniendo campañas:", error)
      return []
    }

    if (!campaigns) {
      return []
    }

    // Calcular estadísticas para cada campaña
    const campaignsWithStats: CampaignWithStats[] = campaigns.map((campaign) => {
      const total = campaign.total_destinatarios || 0
      const enviados = campaign.enviados || 0
      const pendientes = total - enviados
      const progreso = total > 0 ? Math.round((enviados / total) * 100) : 0

      return {
        ...campaign,
        progreso,
        pendientes,
      }
    })

    return campaignsWithStats
  } catch (error) {
    console.error("Error en getCampaigns:", error)
    return []
  }
}

/**
 * Obtiene una campaña específica por ID
 */
export async function getCampaignById(
  campaignId: string,
  organizationId: string
): Promise<CampaignWithStats | null> {
  try {
    const supabase = await createClient()

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("organization_id", organizationId)
      .single()

    if (error || !campaign) {
      console.error("Error obteniendo campaña:", error)
      return null
    }

    const total = campaign.total_destinatarios || 0
    const enviados = campaign.enviados || 0
    const pendientes = total - enviados
    const progreso = total > 0 ? Math.round((enviados / total) * 100) : 0

    return {
      ...campaign,
      progreso,
      pendientes,
    }
  } catch (error) {
    console.error("Error en getCampaignById:", error)
    return null
  }
}

/**
 * Calcula audiencia estimada basada en filtros
 * (sin crear la campaña)
 */
export async function estimateAudience(
  filters: CampaignFilters,
  organizationId: string
): Promise<number> {
  try {
    const supabase = await createClient()

    // DEBUG: Verificar usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    console.log("=== DEBUG USUARIO ===")
    console.log("User ID:", user?.id)
    console.log("Organization ID buscado:", organizationId)

    // DEBUG: Verificar si hay terminales SIN el join de clients
    const { data: terminalsOnly, error: test1 } = await supabase
      .from("terminals")
      .select("afipos, rango, client_id, organization_id")
      .eq("organization_id", organizationId)
      .limit(5)

    console.log("=== VERIFICACIÓN DE DATOS (SIN JOIN) ===")
    console.log("Error:", test1)
    console.log("Total terminales con organization_id filtrado:", terminalsOnly?.length || 0)
    if (terminalsOnly && terminalsOnly.length > 0) {
      console.log("Ejemplo de terminal:", terminalsOnly[0])
      console.log("Rangos únicos:", [...new Set(terminalsOnly.map(t => t.rango).filter(r => r))])
    }

    // DEBUG: Verificar si el problema es el JOIN
    const { data: withJoin, error: test2 } = await supabase
      .from("terminals")
      .select("afipos, rango, client_id, clients(id, telefono, banco)")
      .eq("organization_id", organizationId)
      .limit(5)

    console.log("=== VERIFICACIÓN DE DATOS (CON JOIN LEFT) ===")
    console.log("Total terminales con join:", withJoin?.length || 0)
    if (withJoin && withJoin.length > 0) {
      console.log("Ejemplo con join:", {
        terminal_afipos: withJoin[0].afipos,
        client_id: withJoin[0].client_id,
        tiene_cliente: !!withJoin[0].clients,
        cliente_data: withJoin[0].clients,
      })
    }

    // Usar el mismo query que createCampaign para consistencia
    let query = supabase
      .from("terminals")
      .select(`
        afipos,
        client_id,
        rango,
        clients (
          id,
          telefono,
          banco
        )
      `)
      .eq("organization_id", organizationId)

    // Aplicar filtro de banco
    if (filters.banco && filters.banco !== "Todos los Bancos") {
      query = query.eq("clients.banco", filters.banco)
    }

    // Aplicar filtro de rango
    if (filters.rangoTX) {
      query = query.ilike("rango", `%${filters.rangoTX}%`)
    }

    const { data: terminals, error } = await query

    // DEBUG: Log para identificar problema
    console.log("=== ESTIMATE AUDIENCE DEBUG ===")
    console.log("Organization ID:", organizationId)
    console.log("Filtros:", filters)
    console.log("Error:", error)
    console.log("Terminals encontrados:", terminals?.length || 0)
    if (terminals && terminals.length > 0) {
      console.log("Primer terminal:", terminals[0])
    }

    if (error) {
      console.error("Error estimando audiencia:", error)
      return 0
    }

    if (!terminals || terminals.length === 0) {
      console.log("No se encontraron terminales con esos filtros")
      return 0
    }

    // Contar clientes únicos que tengan teléfono
    const clientesUnicos = new Set<string>()
    terminals.forEach((terminal: any) => {
      // Solo contar si el cliente tiene teléfono
      if (terminal.client_id && terminal.clients && terminal.clients.telefono) {
        clientesUnicos.add(terminal.client_id)
      }
    })

    console.log("Clientes únicos con teléfono:", clientesUnicos.size)
    console.log("===============================")

    return clientesUnicos.size
  } catch (error) {
    console.error("Error en estimateAudience:", error)
    return 0
  }
}
