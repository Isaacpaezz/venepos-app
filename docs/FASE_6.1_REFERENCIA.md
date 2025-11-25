# Fase 6.1: Lógica de Ciclo de Vida y Analytics

## 📋 Resumen de Implementación

Esta fase preparó el backend para soportar el diseño visual de la página de detalle de campaña, implementando automatización de estados y analytics completos.

---

## 🔄 1. Automatización de Estados de Campaña

### Archivo: `actions/worker.ts`

#### Cambios Implementados:

**Al iniciar el procesamiento:**
```typescript
// Si la campaña está en 'draft', actualiza a 'processing'
if (currentCampaign?.status === "draft") {
  await supabase
    .from("campaigns")
    .update({ status: "processing" })
    .eq("id", campaignId)
}
```

**Al finalizar el lote:**
```typescript
// Verificar si quedan mensajes pendientes
const { count: pendingCount } = await supabase
  .from("campaign_queue")
  .select("id", { count: "exact", head: true })
  .eq("campaign_id", campaignId)
  .eq("status", "pending")

// Si no quedan pendientes, marcar como completada
if (pendingCount === 0) {
  await supabase
    .from("campaigns")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
}
```

### Flujo de Estados:

```
draft → processing → completed
  ↓         ↓
cancelled  cancelled
```

- **draft**: Campaña creada pero no ejecutada
- **processing**: Enviando mensajes activamente
- **completed**: Todos los mensajes enviados
- **cancelled**: Cancelada manualmente

---

## 📊 2. Nueva Acción de Analytics

### Archivo: `actions/campaign-analytics.ts`

#### Server Action Principal:

```typescript
export async function getCampaignAnalytics(
  campaignId: string
): Promise<CampaignAnalytics | null>
```

#### Estructura de Retorno:

```typescript
{
  campaign: {
    id: string
    nombre: string
    status: "draft" | "processing" | "completed" | "cancelled"
    created_at: string
    completed_at: string | null
  },
  kpis: {
    audience: number      // Total de destinatarios
    sent: number          // Mensajes enviados
    replied: number       // Respuestas recibidas
    recovered: number     // Terminales recuperados
  },
  details: [
    {
      queue_id: string
      client_name: string
      phone: string
      sent_status: "sent" | "pending" | "failed"
      has_replied: boolean
      terminal_status: "active" | "inactive" | "recovered" | "churned" | null
      terminal_afipos: string | null
      rango_deuda: string | null
    },
    // ... más destinatarios
  ]
}
```

### Ejemplo de Uso en el Frontend:

```typescript
// En un Server Component
import { getCampaignAnalytics } from "@/actions/campaign-analytics"

export default async function CampaignDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const analytics = await getCampaignAnalytics(params.id)
  
  if (!analytics) {
    return <div>Campaña no encontrada</div>
  }
  
  return (
    <div>
      <h1>{analytics.campaign.nombre}</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard 
          label="Audiencia" 
          value={analytics.kpis.audience} 
        />
        <KPICard 
          label="Enviados" 
          value={analytics.kpis.sent} 
        />
        <KPICard 
          label="Respuestas" 
          value={analytics.kpis.replied} 
        />
        <KPICard 
          label="Recuperados" 
          value={analytics.kpis.recovered} 
        />
      </div>
      
      {/* Tabla de detalles */}
      <DataTable data={analytics.details} />
    </div>
  )
}
```

---

## 📦 3. Tipos TypeScript

### Archivo: `types/campaign-analytics.ts`

Tipos centralizados exportados para uso en todo el proyecto:

```typescript
import type { 
  CampaignAnalytics, 
  CampaignDetail,
  CampaignKPIs,
  CampaignStatus,
  QueueStatus,
  TerminalStatus
} from "@/types/campaign-analytics"
```

### Ventajas:
- ✅ Type-safety en toda la aplicación
- ✅ Autocomplete en el IDE
- ✅ Refactoring seguro
- ✅ Documentación implícita

---

## 🔧 Detalles Técnicos

### Cálculo de KPIs

#### 1. Audience (Audiencia Total)
```sql
SELECT COUNT(id) FROM campaign_queue 
WHERE campaign_id = ?
```

#### 2. Sent (Mensajes Enviados)
```sql
SELECT COUNT(id) FROM campaign_queue 
WHERE campaign_id = ? AND status = 'sent'
```

#### 3. Replied (Respuestas Recibidas)
```sql
SELECT COUNT(id) FROM campaign_queue 
WHERE campaign_id = ? AND has_replied = true
```

#### 4. Recovered (Terminales Recuperados)
```typescript
// Paso 1: Obtener client_ids únicos de la campaña
const clientIds = await getUniqueClientIds(campaignId)

// Paso 2: Contar terminales recuperados
SELECT COUNT(afipos) FROM terminals
WHERE client_id IN (clientIds) AND status = 'recovered'
```

### Optimizaciones Implementadas:

1. **Uso de `{ count: "exact", head: true }`**
   - Más eficiente que `select("*")`
   - Solo retorna el count sin datos

2. **Deduplicación de client_ids**
   - Usa `Set` para evitar duplicados
   - Reduce queries innecesarias

3. **Single query para detalles**
   - Un solo SELECT con JOINs
   - Evita N+1 queries

---

## 📝 Notas Importantes

### Rango de Deuda (Placeholder)

La función `determinarRangoDeuda()` actualmente usa una lógica simplificada:

```typescript
function determinarRangoDeuda(rif?: string | null): string {
  // Lógica basada en el último dígito del RIF
  // En producción, consultar tabla de deudas real
}
```

**Para implementación futura:**
1. Crear tabla `client_debts` con montos reales
2. Actualizar la función para consultar esa tabla
3. Definir rangos de negocio precisos

### Limitaciones Actuales:

1. **Un lote = Una campaña**
   - El worker procesa mensajes de una sola campaña por lote
   - Simplifica la lógica de estados
   - Más predecible

2. **Rango de deuda es estimado**
   - Ver nota anterior
   - No afecta funcionalidad principal

---

## 🧪 Testing

### Probar Automatización de Estados:

```typescript
// 1. Crear campaña (quedará en 'draft')
const campaign = await createCampaign({...})

// 2. Ejecutar worker
await processOutboundBatch(5, 1000)

// 3. Verificar estado
// Si hay mensajes: status = 'processing'
// Si todos enviados: status = 'completed'
```

### Probar Analytics:

```typescript
const analytics = await getCampaignAnalytics(campaignId)

console.log({
  nombre: analytics.campaign.nombre,
  status: analytics.campaign.status,
  kpis: analytics.kpis,
  totalDetails: analytics.details.length
})
```

---

## 🚀 Próximos Pasos

### Fase 6.2: UI de Detalle de Campaña

Ahora que el backend está listo, crear:

1. **Página de detalle** (`app/(dashboard)/campaigns/[id]/page.tsx`)
   - Usar `getCampaignAnalytics(params.id)`
   - Mostrar KPIs en cards
   - Tabla de destinatarios

2. **Componentes reutilizables**
   - `<CampaignKPICard />`
   - `<CampaignStatusBadge />`
   - `<RecipientTable />`

3. **Gráficos y visualizaciones**
   - Timeline de la campaña
   - Gráfico de conversión
   - Funnel de recuperación

---

## 📚 Referencias

- **Worker**: `/actions/worker.ts`
- **Analytics**: `/actions/campaign-analytics.ts`
- **Tipos**: `/types/campaign-analytics.ts`
- **Supabase Schema**: Ver tablas `campaigns`, `campaign_queue`, `terminals`
