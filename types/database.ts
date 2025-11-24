/**
 * Tipos de TypeScript para el esquema de base de datos de VenePOS
 * 
 * Estos tipos corresponden a las tablas creadas en la migración 20240101_init.sql
 * Mantén este archivo actualizado cuando hagas cambios en el esquema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// TIPOS DE ROLES Y ESTADOS
// =====================================================

export type UserRole = "member" | "admin" | "owner"

export type TerminalStatus = "active" | "inactive" | "maintenance" | "blocked"

export type RecoverySource = "whatsapp" | "email" | "phone" | "field_visit"

export type CampaignType = "sms" | "whatsapp" | "email"

export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "failed"

export type QueueStatus = "pending" | "sending" | "sent" | "delivered" | "failed"

// =====================================================
// TABLAS DE LA BASE DE DATOS
// =====================================================

export interface Organization {
  id: string
  name: string
  
  // Configuración de Chatwoot
  chatwoot_base_url: string | null
  chatwoot_account_id: string | null
  chatwoot_api_token: string | null
  
  // Metadatos
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string // FK a auth.users
  organization_id: string // FK a organizations
  
  // Información del perfil
  full_name: string
  role: UserRole
  avatar_url: string | null
  
  // Metadatos
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  organization_id: string // FK a organizations
  
  // Información del cliente
  codigo_afiliado: string
  rif: string
  nombre: string
  persona_contacto: string | null
  
  // Contacto
  telefono: string | null // Formato E.164
  email: string | null
  
  // Ubicación
  direccion: string | null
  region: string | null
  estado: string | null
  ciudad: string | null
  sector: string | null
  
  // Información bancaria y clasificación
  banco: string | null
  categoria_comercio: string | null
  
  // Metadatos
  created_at: string
  updated_at: string
}

export interface Terminal {
  afipos: string // PK
  organization_id: string // FK a organizations
  client_id: string // FK a clients
  
  // Información de la terminal
  numpos: string
  dias_sin_tx: number
  rango: string | null // Clasificación temporal (ej: "30 DIAS SIN TX")
  status: TerminalStatus
  recovery_source: RecoverySource | null
  
  // Información adicional
  modelo: string | null
  serial: string | null
  ultima_transaccion: string | null
  
  // Metadatos
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  organization_id: string // FK a organizations
  
  // Información de la campaña
  nombre: string
  tipo: CampaignType
  mensaje: string
  
  // Segmentación
  filtros: Json | null
  total_destinatarios: number
  
  // Estado de la campaña
  status: CampaignStatus
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  
  // Estadísticas
  enviados: number
  entregados: number
  fallidos: number
  
  // Metadatos
  created_at: string
  updated_at: string
}

export interface CampaignQueue {
  id: string
  campaign_id: string // FK a campaigns
  client_id: string // FK a clients
  
  // Información del envío
  destinatario: string
  mensaje_personalizado: string | null
  
  // Estado del envío
  status: QueueStatus
  intentos: number
  max_intentos: number
  
  // Respuesta del proveedor
  provider_id: string | null
  provider_status: string | null
  error_message: string | null
  
  // Timestamps
  scheduled_at: string | null
  sent_at: string | null
  delivered_at: string | null
  failed_at: string | null
  
  // Metadatos
  created_at: string
  updated_at: string
}

// =====================================================
// TIPOS PARA INSERTS (sin campos auto-generados)
// =====================================================

export type OrganizationInsert = Omit<Organization, "id" | "created_at" | "updated_at">

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at">

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">

export type TerminalInsert = Omit<Terminal, "created_at" | "updated_at">

export type CampaignInsert = Omit<Campaign, "id" | "created_at" | "updated_at">

export type CampaignQueueInsert = Omit<CampaignQueue, "id" | "created_at" | "updated_at">

// =====================================================
// TIPOS PARA UPDATES (todos los campos opcionales)
// =====================================================

export type OrganizationUpdate = Partial<Omit<Organization, "id" | "created_at">>

export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">>

export type ClientUpdate = Partial<Omit<Client, "id" | "created_at">>

export type TerminalUpdate = Partial<Omit<Terminal, "afipos" | "created_at">>

export type CampaignUpdate = Partial<Omit<Campaign, "id" | "created_at">>

export type CampaignQueueUpdate = Partial<Omit<CampaignQueue, "id" | "created_at">>

// =====================================================
// TIPO DEL ESQUEMA COMPLETO DE SUPABASE
// =====================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: OrganizationInsert
        Update: OrganizationUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      clients: {
        Row: Client
        Insert: ClientInsert
        Update: ClientUpdate
      }
      terminals: {
        Row: Terminal
        Insert: TerminalInsert
        Update: TerminalUpdate
      }
      campaigns: {
        Row: Campaign
        Insert: CampaignInsert
        Update: CampaignUpdate
      }
      campaign_queue: {
        Row: CampaignQueue
        Insert: CampaignQueueInsert
        Update: CampaignQueueUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// =====================================================
// HELPERS PARA TYPED QUERIES
// =====================================================

/**
 * Helper para crear queries tipadas de Supabase
 * 
 * Uso:
 * ```typescript
 * import { createClient } from '@/lib/supabase/client'
 * import type { TypedSupabaseClient } from '@/types/database'
 * 
 * const supabase = createClient() as TypedSupabaseClient
 * const { data } = await supabase.from('clients').select('*')
 * // `data` estará correctamente tipado como Client[]
 * ```
 */
export type TypedSupabaseClient = ReturnType<typeof import("@/lib/supabase/client").createClient> & {
  from<T extends keyof Database["public"]["Tables"]>(
    table: T
  ): ReturnType<ReturnType<typeof import("@/lib/supabase/client").createClient>["from"]>
}
