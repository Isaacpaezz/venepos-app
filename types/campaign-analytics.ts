// =====================================================
// TIPOS PARA ANALYTICS DE CAMPAÑAS
// =====================================================

export interface CampaignAnalytics {
  campaign: {
    id: string
    nombre: string
    status: string
    created_at: string
    completed_at: string | null
  }
  kpis: {
    audience: number
    sent: number
    replied: number
    recovered: number
  }
  details: CampaignDetail[]
}

export interface CampaignDetail {
  queue_id: string
  client_name: string
  phone: string
  sent_status: "sent" | "pending" | "failed"
  has_replied: boolean
  terminal_status: string | null
  terminal_afipos: string | null
  rango_deuda: string | null
}

// =====================================================
// TIPOS PARA KPIs
// =====================================================

export interface CampaignKPIs {
  audience: number
  sent: number
  replied: number
  recovered: number
}

// =====================================================
// TIPOS AUXILIARES
// =====================================================

export type CampaignStatus = "draft" | "processing" | "completed" | "cancelled"
export type QueueStatus = "pending" | "sent" | "failed"
export type TerminalStatus = "active" | "inactive" | "recovered" | "churned"
