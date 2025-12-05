"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Convierte cualquier valor de Excel a string y hace trim
// Excel puede devolver números, strings, null, undefined
function safeString(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

// =====================================================
// TIPOS
// =====================================================

interface ExcelRow {
  // Campos de Cliente
  CODIGO_AFILIADO: string
  NOMBRE_AFILIADO: string
  RIF_AFILIADO: string
  TELEFONO_AFILIADO: string
  PERSONA_CONTACTO: string
  DIRECCION_AFILIADO: string
  NOMBRE_BANCO: string
  CATEGORIA_COMERCIO: string
  // Ubicación
  REGION: string
  ESTADO: string
  CIUDAD: string
  SECTOR: string
  // Campos de Terminal
  AFIPOS: string
  NUMPOS: string
  RANGO: string
  // Datos Técnicos
  MARCA: string
  MODELO: string
  SERIAL: string
  OPERADORA: string
  ESTADO_POSV2: string
}

interface BatchResult {
  success: boolean
  clientsCreated: number
  clientsUpdated: number
  terminalsCreated: number
  terminalsUpdated: number
  errors: string[]
}

interface ImportResult {
  success: boolean
  message: string
  importId?: string
  error?: string
}

// =====================================================
// FUNCIÓN: processBatchImport
// =====================================================
// Procesa un lote de filas del Excel e inserta/actualiza
// clientes y terminales en Supabase
// =====================================================

export async function processBatchImport(
  rows: ExcelRow[],
  organizationId: string
): Promise<BatchResult> {
  try {
    const supabase = await createClient()

    let clientsCreated = 0
    let clientsUpdated = 0
    let terminalsCreated = 0
    let terminalsUpdated = 0
    const errors: string[] = []

    // Procesar cada fila
    for (const row of rows) {
      try {
        // =====================================================
        // 1. UPSERT DEL CLIENTE
        // =====================================================
        const clientData = {
          organization_id: organizationId,
          codigo_afiliado: safeString(row.CODIGO_AFILIADO) || "",
          nombre: safeString(row.NOMBRE_AFILIADO) || "",
          rif: safeString(row.RIF_AFILIADO) || "",
          telefono: safeString(row.TELEFONO_AFILIADO) || null,
          persona_contacto: safeString(row.PERSONA_CONTACTO) || null,
          direccion: safeString(row.DIRECCION_AFILIADO) || null,
          banco: safeString(row.NOMBRE_BANCO) || null,
          categoria: safeString(row.CATEGORIA_COMERCIO) || null,
          ubicacion_json: {
            region: safeString(row.REGION) || null,
            estado: safeString(row.ESTADO) || null,
            ciudad: safeString(row.CIUDAD) || null,
            sector: safeString(row.SECTOR) || null,
          },
        }

        // Validar datos mínimos
        if (!clientData.codigo_afiliado || !clientData.nombre || !clientData.rif) {
          errors.push(`Fila inválida: faltan datos del cliente (${row.CODIGO_AFILIADO})`)
          continue
        }

        // Buscar si el cliente ya existe
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("codigo_afiliado", clientData.codigo_afiliado)
          .single()

        let clientId: string

        if (existingClient) {
          // Actualizar cliente existente
          const { error: updateError } = await supabase
            .from("clients")
            .update({
              nombre: clientData.nombre,
              rif: clientData.rif,
              telefono: clientData.telefono,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingClient.id)

          if (updateError) {
            errors.push(`Error al actualizar cliente ${clientData.codigo_afiliado}: ${updateError.message}`)
            continue
          }

          clientId = existingClient.id
          clientsUpdated++
        } else {
          // Crear nuevo cliente
          const { data: newClient, error: insertError } = await supabase
            .from("clients")
            .insert(clientData)
            .select("id")
            .single()

          if (insertError || !newClient) {
            errors.push(`Error al crear cliente ${clientData.codigo_afiliado}: ${insertError?.message}`)
            continue
          }

          clientId = newClient.id
          clientsCreated++
        }

        // =====================================================
        // 2. UPSERT DE LA TERMINAL
        // =====================================================
        const terminalData = {
          afipos: safeString(row.AFIPOS) || "",
          organization_id: organizationId,
          client_id: clientId,
          numpos: safeString(row.NUMPOS) || "",
          rango: safeString(row.RANGO) || null,
          datos_tecnicos_json: {
            marca: safeString(row.MARCA) || null,
            modelo: safeString(row.MODELO) || null,
            serial: safeString(row.SERIAL) || null,
            operadora: safeString(row.OPERADORA) || null,
            estado_pos: safeString(row.ESTADO_POSV2) || null,
          },
          last_seen_in_import: new Date().toISOString(),
        }

        // Validar datos mínimos
        if (!terminalData.afipos || !terminalData.numpos) {
          errors.push(`Terminal inválida: faltan datos (${row.AFIPOS})`)
          continue
        }

        // Buscar si la terminal ya existe
        const { data: existingTerminal } = await supabase
          .from("terminals")
          .select("afipos, status")
          .eq("afipos", terminalData.afipos)
          .single()

        if (existingTerminal) {
          // Actualizar terminal existente
          const updateData: any = {
            client_id: clientId,
            numpos: terminalData.numpos,
            rango: terminalData.rango,
            datos_tecnicos_json: terminalData.datos_tecnicos_json,
            last_seen_in_import: terminalData.last_seen_in_import,
            updated_at: new Date().toISOString(),
          }


          // Si la terminal estaba marcada como recuperada y ahora aparece en rango inactivo,
          // resetear el status a inactive, EXCEPTO si es una carga de Difusión
          const isDifusion = terminalData.rango && 
            terminalData.rango.toLowerCase().includes("difus") // "difusión" o "difusion"
          
          const isInactiveRange = terminalData.rango && 
            !terminalData.rango.toLowerCase().includes("sin tx en el mes actual")
          
          // Solo si NO es difusión, permitimos cambiar el status
          if (!isDifusion && existingTerminal.status === "recovered" && isInactiveRange) {
            updateData.status = "inactive"
            updateData.recovery_source = null
          }

          const { error: updateError } = await supabase
            .from("terminals")
            .update(updateData)
            .eq("afipos", terminalData.afipos)

          if (updateError) {
            errors.push(`Error al actualizar terminal ${terminalData.afipos}: ${updateError.message}`)
            continue
          }

          terminalsUpdated++
        } else {
          // Crear nueva terminal
          // Determinar status inicial basado en el rango
          const isActive = terminalData.rango && 
            terminalData.rango.toLowerCase().includes("sin tx en el mes actual")
          
          const { error: insertError } = await supabase
            .from("terminals")
            .insert({
              ...terminalData,
              status: isActive ? "active" : "inactive",
            })

          if (insertError) {
            errors.push(`Error al crear terminal ${terminalData.afipos}: ${insertError.message}`)
            continue
          }

          terminalsCreated++
        }
      } catch (rowError) {
        errors.push(`Error procesando fila: ${rowError instanceof Error ? rowError.message : String(rowError)}`)
      }
    }

    return {
      success: errors.length === 0 || errors.length < rows.length,
      clientsCreated,
      clientsUpdated,
      terminalsCreated,
      terminalsUpdated,
      errors,
    }
  } catch (error) {
    console.error("Error en processBatchImport:", error)
    return {
      success: false,
      clientsCreated: 0,
      clientsUpdated: 0,
      terminalsCreated: 0,
      terminalsUpdated: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

// =====================================================
// FUNCIÓN: detectSystemRecoveries
// =====================================================
// Busca terminales que ya no aparecen en el archivo maestro
// y las marca como recuperadas por el sistema
// =====================================================

export async function detectSystemRecoveries(
  organizationId: string,
  importStartTime: string
): Promise<{ success: boolean; recoveredCount: number; error?: string }> {
  try {
    const supabase = await createClient()

    // Buscar terminales que:
    // 1. No han sido vistos en esta importación (last_seen_in_import < importStartTime)
    // 2. Estaban inactivos (status = 'inactive')
    // 3. Pertenecen a esta organización
    const { data: terminalsToRecover, error: selectError } = await supabase
      .from("terminals")
      .select("afipos")
      .eq("organization_id", organizationId)
      .eq("status", "inactive")
      .or(`last_seen_in_import.is.null,last_seen_in_import.lt.${importStartTime}`)

    if (selectError) {
      console.error("Error buscando terminales para recuperar:", selectError)
      return { success: false, recoveredCount: 0, error: selectError.message }
    }

    if (!terminalsToRecover || terminalsToRecover.length === 0) {
      return { success: true, recoveredCount: 0 }
    }

    // Marcar como recuperadas por sistema
    const { error: updateError } = await supabase
      .from("terminals")
      .update({
        status: "recovered",
        recovery_source: "system_import",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("status", "inactive")
      .or(`last_seen_in_import.is.null,last_seen_in_import.lt.${importStartTime}`)

    if (updateError) {
      console.error("Error marcando terminales como recuperadas:", updateError)
      return { success: false, recoveredCount: 0, error: updateError.message }
    }

    return {
      success: true,
      recoveredCount: terminalsToRecover.length,
    }
  } catch (error) {
    console.error("Error en detectSystemRecoveries:", error)
    return {
      success: false,
      recoveredCount: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// =====================================================
// FUNCIÓN: createImportRecord
// =====================================================
// Crea un registro de importación en la base de datos
// =====================================================

export async function createImportRecord(
  fileName: string,
  fileSize: number,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; importId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("imports")
      .insert({
        organization_id: organizationId,
        file_name: fileName,
        file_size: fileSize,
        imported_by: userId,
        status: "processing",
        total_rows: 0,
        processed_rows: 0,
      })
      .select("id")
      .single()

    if (error || !data) {
      console.error("Error creando registro de importación:", error)
      return { success: false, error: error?.message }
    }

    return { success: true, importId: data.id }
  } catch (error) {
    console.error("Error en createImportRecord:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// =====================================================
// FUNCIÓN: updateImportRecord
// =====================================================
// Actualiza el registro de importación con estadísticas finales
// =====================================================

export async function updateImportRecord(
  importId: string,
  stats: {
    totalRows: number
    processedRows: number
    clientsCreated: number
    clientsUpdated: number
    terminalsCreated: number
    terminalsUpdated: number
    errorsCount: number
    status: "completed" | "failed"
    errorMessage?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("imports")
      .update({
        total_rows: stats.totalRows,
        processed_rows: stats.processedRows,
        clients_created: stats.clientsCreated,
        clients_updated: stats.clientsUpdated,
        terminals_created: stats.terminalsCreated,
        terminals_updated: stats.terminalsUpdated,
        errors_count: stats.errorsCount,
        status: stats.status,
        error_message: stats.errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", importId)

    if (error) {
      console.error("Error actualizando registro de importación:", error)
      return { success: false, error: error.message }
    }

    // Revalidar las rutas que dependen de estos datos
    revalidatePath("/dashboard/import")
    revalidatePath("/dashboard/clients")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error en updateImportRecord:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// =====================================================
// FUNCIÓN: getImportHistory
// =====================================================
// Obtiene el historial de importaciones para mostrar en la UI
// =====================================================

export async function getImportHistory(organizationId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("imports")
      .select(`
        id,
        file_name,
        file_size,
        total_rows,
        processed_rows,
        clients_created,
        clients_updated,
        terminals_created,
        terminals_updated,
        errors_count,
        status,
        error_message,
        created_at,
        completed_at,
        imported_by
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error obteniendo historial de importaciones:", error)
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en getImportHistory:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
