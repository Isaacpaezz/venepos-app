# Documentación: Sistema de Campañas y Difusión 📢

**Fecha**: 05 Diciembre 2025
**Versión**: 1.2.0

## Resumen Ejecutivo

Este documento detalla las nuevas funcionalidades implementadas en el módulo de Campañas de VenePOS, específicamente la capacidad de ejecutar campañas concurrentes, la adición del tipo de campaña "Difusión" y las mejoras en la lógica de importación masiva para soportar listas de difusión sin afectar el estado de recuperación de las terminales.

## 1. Concurrencia de Campañas (Campaign Engine)

Se ha refactorizado el motor de envío para soportar **múltiples campañas simultáneas** sin interferencia.

### Problema Anterior

El worker de envío (`actions/worker.ts`) procesaba cualquier mensaje pendiente en la cola (`campaign_queue`) sin distinguir campaña. Esto causaba que al iniciar una Campaña B, se procesaran mensajes de una Campaña A que estaba pausada, marcándola erróneamente como completada.

### Solución Implementada

- **Backend (`actions/worker.ts`)**:
  - `processOutboundBatch` ahora recibe `campaignId` como parámetro obligatorio.
  - Filtro SQL estricto: `.eq("campaign_id", campaignId)`.
  - Validación de estado: Solo procesa si la campaña está en `processing` o `draft`.
- **Frontend (`campaign-runner.tsx`)**:
  - Cada instancia del runner maneja exclusivamente su `campaignId`.

## 2. Nueva Modalidad: Campañas de Difusión

Se habilitó la creación de campañas masivas generales ("Difusión") separadas de las campañas de recuperación de cobranza.

### Cambios en UI

- **Wizard de Campaña (`campaign-wizard.tsx`)**:
  - Agregada opción **"Difusión"** en el dropdown "Rango Transaccional".
  - Valor interno: `"Difusión"`.

### Flujo de Datos

1. Usuario selecciona **"Difusión"**.
2. Sistema filtra terminales donde `rango ILIKE '%Difusión%'`.
3. Se estima la audiencia y se crea la campaña dirigida a ese segmento específico.

## 3. Lógica de Importación Inteligente (`actions/import.ts`)

Se modificó el proceso de importación de archivos Excel (`processBatchImport`) para proteger el estado de las terminales.

### Protección de Estado "Recuperado"

Anteriormente, cualquier carga con un rango distinto a "SIN TX..." (activo) se consideraba inactividad, lo que reseteaba terminales "Recuperadas" a "Inactivas".

**Nueva Lógica:**

```typescript
const isDifusion =
  terminalData.rango && terminalData.rango.toLowerCase().includes("difus");

// Si es carga de Difusión, NO se ejecuta la lógica de reset a INACTIVE
if (!isDifusion && existingTerminal.status === "recovered" && isInactiveRange) {
  updateData.status = "inactive";
  updateData.recovery_source = null;
}
```

### Comportamiento Resultante

- **Importación Difusión**: Actualiza `rango` a "Difusión" pero **MANTIENE** `status` (sea Active, Inactive o Recovered).
- **Importación Mensual (Recuperación)**: Mantiene la lógica original de detección de inactividad.

## 4. Guía de Uso Rápida

### Para lanzar una Campaña de Difusión:

1. Preparar Excel con columna **RANGO** = "Difusión".
2. Importar archivo en módulo de Importación.
3. Ir a **Campañas > Nueva Campaña**.
4. En **Rango Transaccional**, seleccionar **"Difusión"**.
5. Redactar mensaje y lanzar.

### Para lanzar una Campaña de Recuperación:

1. Usar proceso estándar con rangos "30/60/90 DÍAS SIN TX".
