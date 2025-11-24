"use server"

import { createClient } from "@/lib/supabase/server"

// =====================================================
// TIPOS
// =====================================================

// Estructura de ubicacion_json en clients
export interface UbicacionJSON {
  region: string | null
  estado: string | null
  ciudad: string | null
  sector: string | null
}

// Estructura de datos_tecnicos_json en terminals
export interface DatosTecnicosJSON {
  marca: string | null
  modelo: string | null
  serial: string | null
  operadora: string | null
  estado_pos: string | null
}

// Terminal con datos completos incluyendo JSONB
export interface TerminalWithDetails {
  afipos: string
  organization_id: string
  client_id: string
  numpos: string
  rango: string | null
  status: string
  recovery_source: string | null
  datos_tecnicos_json: DatosTecnicosJSON | null
  last_seen_in_import: string | null
  created_at: string
  updated_at: string
}

// Cliente con terminales incluidos y JSONB
export interface ClientWithTerminals {
  id: string
  organization_id: string
  codigo_afiliado: string
  rif: string
  nombre: string
  persona_contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  banco: string | null
  categoria: string | null
  ubicacion_json: UbicacionJSON | null
  created_at: string
  updated_at: string
  terminals: TerminalWithDetails[]
}

// =====================================================
// FUNCIÓN: getClients
// =====================================================
// Obtiene todos los clientes con sus terminales
// =====================================================

export async function getClients(
  organizationId: string
): Promise<ClientWithTerminals[]> {
  try {
    const supabase = await createClient()

    // Consulta con JOIN a terminals
    const { data: clients, error } = await supabase
      .from("clients")
      .select(`
        id,
        organization_id,
        codigo_afiliado,
        rif,
        nombre,
        persona_contacto,
        telefono,
        email,
        direccion,
        banco,
        categoria,
        ubicacion_json,
        created_at,
        updated_at,
        terminals (
          afipos,
          organization_id,
          client_id,
          numpos,
          rango,
          status,
          recovery_source,
          datos_tecnicos_json,
          last_seen_in_import,
          created_at,
          updated_at
        )
      `)
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error obteniendo clientes:", error)
      return []
    }

    if (!clients || clients.length === 0) {
      return []
    }

    // TypeScript: asegurar que terminals es array (Supabase devuelve array o null)
    const clientsWithTerminals: ClientWithTerminals[] = clients.map((client) => ({
      ...client,
      terminals: Array.isArray(client.terminals) ? client.terminals : [],
    }))

    return clientsWithTerminals
  } catch (error) {
    console.error("Error obteniendo clientes:", error)
    return []
  }
}

// =====================================================
// FUNCIÓN: getClientById
// =====================================================
// Obtiene un cliente específico con sus terminales
// =====================================================

export async function getClientById(
  clientId: string,
  organizationId: string
): Promise<ClientWithTerminals | null> {
  try {
    const supabase = await createClient()

    const { data: client, error } = await supabase
      .from("clients")
      .select(`
        id,
        organization_id,
        codigo_afiliado,
        rif,
        nombre,
        persona_contacto,
        telefono,
        email,
        direccion,
        banco,
        categoria,
        ubicacion_json,
        created_at,
        updated_at,
        terminals (
          afipos,
          organization_id,
          client_id,
          numpos,
          rango,
          status,
          recovery_source,
          datos_tecnicos_json,
          last_seen_in_import,
          created_at,
          updated_at
        )
      `)
      .eq("id", clientId)
      .eq("organization_id", organizationId)
      .single()

    if (error) {
      console.error("Error obteniendo cliente:", error)
      return null
    }

    if (!client) {
      return null
    }

    return {
      ...client,
      terminals: Array.isArray(client.terminals) ? client.terminals : [],
    }
  } catch (error) {
    console.error("Error obteniendo cliente:", error)
    return null
  }
}

