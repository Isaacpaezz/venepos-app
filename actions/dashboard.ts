"use server"

import { createClient } from "@/lib/supabase/server"

// =====================================================
// TIPOS
// =====================================================

export interface DashboardMetrics {
  terminalesInactivos: number
  terminalesRecuperados: number
  totalClientes: number
  tasaRecuperacion: number
}

export interface ChartDataPoint {
  name: string
  value: number
  color: string
}

export interface ActivityItem {
  id: string
  type: "import" | "alert" | "system"
  title: string
  description: string
  time: string
  user?: string
}

// =====================================================
// FUNCIÓN: getDashboardMetrics
// =====================================================
// Obtiene los KPIs principales del dashboard
// =====================================================

export async function getDashboardMetrics(
  organizationId: string
): Promise<DashboardMetrics> {
  try {
    const supabase = await createClient()

    // KPI 1: Terminales Inactivos (status != 'recovered' y != 'active')
    const { count: inactivos } = await supabase
      .from("terminals")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "inactive")

    // KPI 2: Terminales Recuperados (status = 'recovered')
    const { count: recuperados } = await supabase
      .from("terminals")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "recovered")

    // KPI 3: Total Clientes
    const { count: totalClientes } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)

    // KPI 4: Tasa de Recuperación
    // Total de terminales (inactivos + recuperados + activos)
    const { count: totalTerminales } = await supabase
      .from("terminals")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)

    const tasaRecuperacion =
      totalTerminales && totalTerminales > 0
        ? Math.round((recuperados || 0) / totalTerminales * 100)
        : 0

    return {
      terminalesInactivos: inactivos || 0,
      terminalesRecuperados: recuperados || 0,
      totalClientes: totalClientes || 0,
      tasaRecuperacion,
    }
  } catch (error) {
    console.error("Error obteniendo métricas del dashboard:", error)
    return {
      terminalesInactivos: 0,
      terminalesRecuperados: 0,
      totalClientes: 0,
      tasaRecuperacion: 0,
    }
  }
}

// =====================================================
// FUNCIÓN: getChartData
// =====================================================
// Obtiene distribución de terminales por rango
// para el gráfico de Riesgo de Cartera
// =====================================================

export async function getChartData(
  organizationId: string
): Promise<ChartDataPoint[]> {
  try {
    const supabase = await createClient()

    // Obtener todos los terminales con su rango
    const { data: terminals, error } = await supabase
      .from("terminals")
      .select("rango")
      .eq("organization_id", organizationId)
      .not("rango", "is", null)

    if (error) {
      console.error("Error obteniendo datos del gráfico:", error)
      return []
    }

    if (!terminals || terminals.length === 0) {
      return []
    }

    // Agrupar por rango y contar
    const rangoCounts: Record<string, number> = {}

    terminals.forEach((terminal) => {
      const rango = terminal.rango || "Sin clasificar"
      rangoCounts[rango] = (rangoCounts[rango] || 0) + 1
    })

    // Mapear colores según el rango
    const getColorForRango = (rango: string): string => {
      const rangoLower = rango.toLowerCase()
      
      if (rangoLower.includes("sin tx en el mes actual")) {
        return "#10b981" // Verde (Emerald 500)
      }
      if (rangoLower.includes("30 dias")) {
        return "#f59e0b" // Amarillo (Amber 500)
      }
      if (rangoLower.includes("60 dias") || rangoLower.includes("120 dias")) {
        return "#ef4444" // Rojo (Red 500)
      }
      return "#94a3b8" // Gris (Slate 400)
    }

    // Normalizar nombres de rangos para mejor visualización
    const getNormalizedName = (rango: string): string => {
      const rangoLower = rango.toLowerCase()
      
      if (rangoLower.includes("sin tx en el mes actual")) {
        return "Activos"
      }
      if (rangoLower.includes("30 dias")) {
        return "30 Días Sin TX"
      }
      if (rangoLower.includes("60 dias")) {
        return "60 Días Sin TX"
      }
      if (rangoLower.includes("120 dias")) {
        return "120 Días Sin TX"
      }
      return rango
    }

    // Convertir a array para el gráfico
    const chartData: ChartDataPoint[] = Object.entries(rangoCounts)
      .map(([rango, count]) => ({
        name: getNormalizedName(rango),
        value: count,
        color: getColorForRango(rango),
      }))
      .sort((a, b) => b.value - a.value) // Ordenar por cantidad (mayor a menor)

    return chartData
  } catch (error) {
    console.error("Error obteniendo datos del gráfico:", error)
    return []
  }
}

// =====================================================
// FUNCIÓN: getRecentActivity
// =====================================================
// Obtiene las últimas 5 importaciones
// =====================================================

export async function getRecentActivity(
  organizationId: string
): Promise<ActivityItem[]> {
  try {
    const supabase = await createClient()

    // Obtener las últimas 5 importaciones con datos del usuario
    const { data: imports, error } = await supabase
      .from("imports")
      .select(`
        id,
        file_name,
        total_rows,
        processed_rows,
        status,
        created_at,
        imported_by,
        profiles!imports_imported_by_fkey (
          full_name
        )
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Error obteniendo actividad reciente:", error)
      return []
    }

    if (!imports || imports.length === 0) {
      return []
    }

    // Mapear a ActivityItem
    const activities: ActivityItem[] = imports.map((importRecord) => {
      const profile = Array.isArray(importRecord.profiles) ? importRecord.profiles[0] : importRecord.profiles
      const userName = profile?.full_name || "Usuario desconocido"
      const recordsText = `${importRecord.processed_rows || 0} de ${importRecord.total_rows || 0} registros`
      
      return {
        id: importRecord.id,
        type: "import" as const,
        title: "Importación Masiva",
        description: `${importRecord.file_name} - ${recordsText}`,
        time: formatRelativeTime(importRecord.created_at),
        user: userName,
      }
    })

    return activities
  } catch (error) {
    console.error("Error obteniendo actividad reciente:", error)
    return []
  }
}

// =====================================================
// HELPER: formatRelativeTime
// =====================================================
// Convierte timestamp a formato relativo (ej: "hace 2 horas")
// =====================================================

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Ahora mismo"
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  
  // Formato corto para fechas más antiguas
  return new Intl.DateTimeFormat("es-VE", {
    month: "short",
    day: "numeric",
  }).format(date)
}
