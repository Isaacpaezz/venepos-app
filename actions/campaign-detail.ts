"use server"

import { createClient } from "@/lib/supabase/server"

// =====================================================
// TIPOS
// =====================================================

export interface CampaignDetailMetrics {
  audienciaTotal: number
  enviados: number
  respondidos: number
  recuperados: number
  tasaExito: number
}

export interface CampaignDetailClient {
  id: string
  nombre: string
  rif: string
  telefono: string
  estadoEnvio: "pending" | "sent" | "failed"
  respondio: boolean
  estatusTerminal: "active" | "inactive" | "recovered" | "churned"
  terminalesCount: number
  sentAt: string | null
  repliedAt: string | null
}

export interface CampaignDetailData {
  id: string
  nombre: string
  descripcion: string | null
  status: string
  createdAt: string
  completedAt: string | null
  metrics: CampaignDetailMetrics
  clients: CampaignDetailClient[]
}

// =====================================================
// FUNCIÓN: getCampaignDetail
// =====================================================
// Obtiene todos los datos de una campaña específica
// =====================================================

export async function getCampaignDetail(
  campaignId: string,
  organizationId: string
): Promise<CampaignDetailData | null> {
  try {
    const supabase = await createClient()

    // Obtener datos básicos de la campaña
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, nombre, descripcion, status, created_at, completed_at")
      .eq("id", campaignId)
      .eq("organization_id", organizationId)
      .single()

    if (campaignError || !campaign) {
      console.error("Error obteniendo campaña:", campaignError)
      return null
    }

    // Obtener datos de la cola (queue) con clientes
    const { data: queueItems, error: queueError } = await supabase
      .from("campaign_queue")
      .select(`
        id,
        client_id,
        destinatario,
        status,
        sent_at,
        has_replied,
        replied_at,
        clients!inner (
          id,
          nombre,
          rif,
          phone
        )
      `)
      .eq("campaign_id", campaignId)

    if (queueError) {
      console.error("Error obteniendo queue:", queueError)
      return null
    }

    // Obtener terminales de todos los clientes en esta campaña
    const clientIds = queueItems?.map((item) => item.client_id) || []
    
    const { data: terminals, error: terminalsError } = await supabase
      .from("terminals")
      .select("client_id, status, afipos")
      .in("client_id", clientIds)

    if (terminalsError) {
      console.error("Error obteniendo terminales:", terminalsError)
    }

    // Agrupar terminales por cliente
    const terminalsByClient: Record<string, typeof terminals> = {}
    terminals?.forEach((terminal) => {
      if (!terminalsByClient[terminal.client_id]) {
        terminalsByClient[terminal.client_id] = []
      }
      terminalsByClient[terminal.client_id].push(terminal)
    })

    // Calcular métricas
    const audienciaTotal = queueItems?.length || 0
    const enviados = queueItems?.filter((item) => item.status === "sent").length || 0
    const respondidos = queueItems?.filter((item) => item.has_replied).length || 0
    
    // Contar recuperados: clientes que tienen al menos 1 terminal recovered
    const recuperados = clientIds.filter((clientId) => {
      const clientTerminals = terminalsByClient[clientId] || []
      return clientTerminals.some((t) => t.status === "recovered")
    }).length

    const tasaExito = enviados > 0 ? Math.round((recuperados / enviados) * 100) : 0

    // Mapear clientes con sus datos
    const clients: CampaignDetailClient[] = (queueItems || []).map((item) => {
      const client = Array.isArray(item.clients) ? item.clients[0] : item.clients
      const clientTerminals = terminalsByClient[item.client_id] || []
      
      // Determinar estatus terminal (priorizar recovered)
      const hasRecovered = clientTerminals.some((t) => t.status === "recovered")
      const hasActive = clientTerminals.some((t) => t.status === "active")
      const hasInactive = clientTerminals.some((t) => t.status === "inactive")
      
      let estatusTerminal: "active" | "inactive" | "recovered" | "churned" = "inactive"
      if (hasRecovered) {
        estatusTerminal = "recovered"
      } else if (hasActive) {
        estatusTerminal = "active"
      } else if (hasInactive) {
        estatusTerminal = "inactive"
      }

      return {
        id: item.client_id,
        nombre: client?.nombre || "Cliente desconocido",
        rif: client?.rif || "N/A",
        telefono: item.destinatario,
        estadoEnvio: item.status as "pending" | "sent" | "failed",
        respondio: item.has_replied || false,
        estatusTerminal,
        terminalesCount: clientTerminals.length,
        sentAt: item.sent_at,
        repliedAt: item.replied_at,
      }
    })

    return {
      id: campaign.id,
      nombre: campaign.nombre,
      descripcion: campaign.descripcion,
      status: campaign.status,
      createdAt: campaign.created_at,
      completedAt: campaign.completed_at,
      metrics: {
        audienciaTotal,
        enviados,
        respondidos,
        recuperados,
        tasaExito,
      },
      clients,
    }
  } catch (error) {
    console.error("Error obteniendo detalle de campaña:", error)
    return null
  }
}
