// =====================================================
// UTILIDADES PARA CLIENTES
// =====================================================

import { TerminalWithDetails } from "@/actions/clients"

/**
 * Determina el rango más crítico entre un array de terminales
 * Prioridad: >120 dias > >60 dias > 60 dias > 30 dias > sin tx
 */
export function getMostCriticalRango(terminals: TerminalWithDetails[]): string {
  if (!terminals || terminals.length === 0) {
    return "Sin datos"
  }

  // Orden de prioridad (más crítico primero)
  const prioridad = [
    "> 120 DIAS SIN TX",
    "> 60 DIAS SIN TX",
    "60 DIAS SIN TX",
    "30 DIAS SIN TX",
    "SIN TX EN EL MES ACTUAL",
  ]

  // Buscar el rango más crítico
  for (const rangoPrioritario of prioridad) {
    const encontrado = terminals.find((t) =>
      t.rango?.toUpperCase().includes(rangoPrioritario)
    )
    if (encontrado) {
      return encontrado.rango || "Sin datos"
    }
  }

  // Si no coincide con ninguno, retornar el primero disponible
  return terminals[0]?.rango || "Sin datos"
}
