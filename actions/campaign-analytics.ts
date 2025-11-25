"use server"

import { createClient } from "@/lib/supabase/server"
import type { CampaignAnalytics, CampaignDetail } from "@/types/campaign-analytics"

// Re-exportar tipos para conveniencia
export type { CampaignAnalytics, CampaignDetail } from "@/types/campaign-analytics"

// =====================================================
// SERVER ACTION: GET CAMPAIGN ANALYTICS
// =====================================================

/**
 * Obtiene los analytics completos de una campaña
 * Incluye KPIs y detalles de cada destinatario
 * 
 * @param campaignId ID de la campaña
 * @returns Estructura completa de analytics
 */
export async function getCampaignAnalytics(
  campaignId: string
): Promise<CampaignAnalytics | null> {
  try {
    const supabase = await createClient()

    // ==========================================
    // PASO 1: Obtener datos básicos de campaña
    // ==========================================

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, nombre, status, created_at, completed_at")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      console.error("Error obteniendo campaña:", campaignError)
      return null
    }

    // ==========================================
    // PASO 2: Calcular KPIs
    // ==========================================

    // Total de audiencia (registros en campaign_queue)
    const { count: audienceCount } = await supabase
      .from("campaign_queue")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)

    // Mensajes enviados exitosamente
    const { count: sentCount } = await supabase
      .from("campaign_queue")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "sent")

    // Clientes que respondieron
    const { count: repliedCount } = await supabase
      .from("campaign_queue")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("has_replied", true)

    // Terminales recuperados
    // Obtener client_ids únicos de la campaña
    const { data: queueClients } = await supabase
      .from("campaign_queue")
      .select("client_id")
      .eq("campaign_id", campaignId)

    const clientIds = [...new Set(queueClients?.map((q) => q.client_id) || [])]

    // Contar terminales recuperados para esos clientes
    let recoveredCount = 0
    if (clientIds.length > 0) {
      const { count } = await supabase
        .from("terminals")
        .select("afipos", { count: "exact", head: true })
        .in("client_id", clientIds)
        .eq("status", "recovered")
      
      recoveredCount = count || 0
    }

    // ==========================================
    // PASO 3: Obtener detalles de destinatarios
    // ==========================================

    const { data: queueDetails, error: detailsError } = await supabase
      .from("campaign_queue")
      .select(`
        id,
        destinatario,
        status,
        has_replied,
        client_id,
        clients (
          nombre,
          rif,
          terminals (
            afipos,
            status,
            numpos
          )
        )
      `)
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })

    if (detailsError) {
      console.error("Error obteniendo detalles:", detailsError)
      return null
    }

    // Transformar datos para el formato esperado
    const details: CampaignDetail[] = (queueDetails || []).map((item) => {
      const client = Array.isArray(item.clients) ? item.clients[0] : item.clients
      const terminals = client?.terminals || []
      const terminal = Array.isArray(terminals) && terminals.length > 0 ? terminals[0] : null

      // Determinar rango de deuda (placeholder - ajustar según lógica real)
      const rangoDeuda = determinarRangoDeuda(client?.rif)

      return {
        queue_id: item.id,
        client_name: client?.nombre || "Sin nombre",
        phone: item.destinatario,
        sent_status: item.status as "sent" | "pending" | "failed",
        has_replied: item.has_replied || false,
        terminal_status: terminal?.status || null,
        terminal_afipos: terminal?.afipos || null,
        rango_deuda: rangoDeuda,
      }
    })

    // ==========================================
    // PASO 4: Retornar estructura completa
    // ==========================================

    return {
      campaign: {
        id: campaign.id,
        nombre: campaign.nombre,
        status: campaign.status,
        created_at: campaign.created_at,
        completed_at: campaign.completed_at,
      },
      kpis: {
        audience: audienceCount || 0,
        sent: sentCount || 0,
        replied: repliedCount || 0,
        recovered: recoveredCount,
      },
      details,
    }

  } catch (error) {
    console.error("Error fatal en getCampaignAnalytics:", error)
    return null
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Determina el rango de deuda basado en el RIF del cliente
 * Esta es una función placeholder - ajustar según la lógica real del negocio
 * 
 * @param rif RIF del cliente
 * @returns Rango de deuda como string
 */
function determinarRangoDeuda(rif?: string | null): string {
  if (!rif) return "Desconocido"
  
  // Placeholder: lógica simplificada basada en el RIF
  // En producción, esto debería consultar una tabla de deudas real
  const lastChar = rif.charAt(rif.length - 1)
  const num = parseInt(lastChar, 10)
  
  if (isNaN(num)) return "$0 - $100"
  if (num <= 3) return "$0 - $100"
  if (num <= 6) return "$100 - $500"
  return "$500+"
}
