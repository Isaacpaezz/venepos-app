# 📥 Feature: Importación de Archivo Maestro Excel

## 📋 Resumen

La funcionalidad de importación masiva permite cargar archivos Excel con datos de clientes y terminales POS, procesarlos en lotes, y detectar automáticamente terminales recuperadas (que ya no están inactivas).

---

## 🏗️ Arquitectura

### Base de Datos

#### Tabla: `imports`
```sql
CREATE TABLE public.imports (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  file_name TEXT,
  file_size INTEGER,
  total_rows INTEGER,
  processed_rows INTEGER,
  clients_created INTEGER,
  clients_updated INTEGER,
  terminals_created INTEGER,
  terminals_updated INTEGER,
  errors_count INTEGER,
  status TEXT, -- processing, completed, failed
  error_message TEXT,
  imported_by UUID REFERENCES auth.users,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

#### Modificación: `terminals`
```sql
ALTER TABLE public.terminals
ADD COLUMN last_seen_in_import TIMESTAMPTZ;
```

Este campo rastrea la última vez que un terminal apareció en una importación, permitiendo detectar recuperaciones automáticas.

---

## 📊 Formato del Archivo Excel

### Columnas Requeridas

| Columna Excel | Mapeo en DB | Descripción |
|---------------|-------------|-------------|
| `AFILIADO` | `clients.codigo_afiliado` | Código único del cliente |
| `NOMBRE` | `clients.nombre` | Nombre del comercio |
| `RIF` | `clients.rif` | RIF del cliente |
| `TELEFONO` | `clients.telefono` | Teléfono de contacto |
| `AFIPOS` | `terminals.afipos` | ID único del terminal (PK) |
| `NUMPOS` | `terminals.numpos` | Número del terminal |
| `DIAS` | `terminals.dias_sin_tx` | Días sin transacciones |

### Ejemplo de Archivo

```
AFILIADO  | NOMBRE           | RIF         | TELEFONO       | AFIPOS    | NUMPOS  | DIAS
12345     | Comercio ABC     | J-12345678  | +584121234567  | POS001    | 001     | 15
12346     | Tienda XYZ       | J-23456789  | +584122345678  | POS002    | 002     | 0
```

---

## 🔄 Flujo de Procesamiento

### 1. Carga del Archivo
```typescript
// Usuario arrastra/selecciona archivo Excel
const arrayBuffer = await file.arrayBuffer()
const workbook = XLSX.read(arrayBuffer, { type: "array" })
const jsonData = XLSX.utils.sheet_to_json(worksheet)
```

### 2. Creación de Registro de Importación
```typescript
const { importId } = await createImportRecord(
  fileName,
  fileSize,
  organizationId,
  userId
)
```

### 3. Procesamiento en Lotes
```typescript
const BATCH_SIZE = 100 // 100 filas por lote

for (let i = 0; i < totalBatches; i++) {
  const batch = jsonData.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
  await processBatchImport(batch, organizationId)
  
  // Actualizar progreso: 10% - 80%
  setProgress(10 + (i / totalBatches) * 70)
}
```

### 4. Upsert de Clientes
```typescript
// Buscar cliente existente por codigo_afiliado
const existingClient = await supabase
  .from("clients")
  .select("id")
  .eq("codigo_afiliado", clientData.codigo_afiliado)
  .single()

if (existingClient) {
  // Actualizar datos del cliente
  await supabase.from("clients").update(clientData)
} else {
  // Crear nuevo cliente
  await supabase.from("clients").insert(clientData)
}
```

### 5. Upsert de Terminales
```typescript
// Buscar terminal existente por afipos
const existingTerminal = await supabase
  .from("terminals")
  .select("afipos, status")
  .eq("afipos", terminalData.afipos)
  .single()

if (existingTerminal) {
  // Actualizar terminal + last_seen_in_import
  await supabase.from("terminals").update({
    ...terminalData,
    last_seen_in_import: NOW()
  })
} else {
  // Crear nueva terminal
  await supabase.from("terminals").insert(terminalData)
}
```

### 6. Detección de Recuperaciones por Sistema
```typescript
// Buscar terminales que NO aparecieron en esta importación
// y que estaban inactivos
await supabase
  .from("terminals")
  .update({
    status: "recovered",
    recovery_source: "system_import" // NO cuenta para KPI de agente
  })
  .eq("organization_id", organizationId)
  .eq("status", "inactive")
  .lt("last_seen_in_import", importStartTime)
```

**Lógica:**
- Si un terminal **estaba inactivo** (DIAS > 0 en importación anterior)
- Y **NO aparece** en la importación actual
- Entonces **se recuperó automáticamente** (el comercio volvió a transaccionar)

### 7. Actualización del Registro
```typescript
await updateImportRecord(importId, {
  totalRows: jsonData.length,
  processedRows: successfulRows,
  clientsCreated,
  clientsUpdated,
  terminalsCreated,
  terminalsUpdated,
  errorsCount: errors.length,
  status: "completed"
})
```

---

## 🎨 Componentes Frontend

### `<FileUpload />`
**Ubicación:** `components/venepos/import/file-upload.tsx`

**Props:**
- `organizationId: string` - ID de la organización actual
- `userId: string` - ID del usuario que importa
- `onUploadComplete?: (data) => void` - Callback al completar

**Estados:**
- `idle` - Esperando archivo
- `dragging` - Usuario arrastrando archivo
- `uploading` - Procesando archivo (con progreso)
- `complete` - Importación exitosa
- `error` - Error en importación

**Características:**
- Drag & Drop
- Validación de extensión (.xlsx, .xls, .csv)
- Barra de progreso real (0-100%)
- Procesamiento en lotes (evita timeouts)
- Mensajes de estado descriptivos

### `<ImportHistory />`
**Ubicación:** `components/venepos/import/import-history.tsx`

**Props:**
- `organizationId: string` - ID de la organización

**Renderiza:**
- Tabla con últimas 10 importaciones
- Columnas: Fecha, Archivo, Tamaño, Filas, Procesadas, Clientes (nuevo/actualizado), Terminales (nuevo/actualizado), Errores, Estado
- Estados: Completa (verde), Fallida (rojo), Procesando (azul)

---

## 🔐 Seguridad

### Multi-Tenancy
```typescript
// SIEMPRE usar organizationId del usuario autenticado
const { data: profile } = await supabase
  .from("profiles")
  .select("organization_id")
  .eq("id", user.id)
  .single()

// Pasar a todas las funciones
await processBatchImport(batch, profile.organization_id)
```

### RLS Policies
```sql
-- Usuarios solo ven importaciones de su organización
CREATE POLICY "Ver importaciones de organización"
  ON public.imports
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());
```

---

## 📈 Métricas Capturadas

Por cada importación se registra:
- ✅ Total de filas en el archivo
- ✅ Filas procesadas exitosamente
- ✅ Clientes creados (nuevos)
- ✅ Clientes actualizados (existentes)
- ✅ Terminales creados (nuevos)
- ✅ Terminales actualizados (existentes)
- ✅ Cantidad de errores
- ✅ Tiempo de inicio y finalización
- ✅ Usuario que realizó la importación

---

## 🧪 Testing

### Caso 1: Importación de Archivo Nuevo
1. Ir a `/dashboard/import`
2. Cargar archivo `clientes_test.xlsx`
3. Verificar:
   - Progreso de 0% a 100%
   - Toast de éxito
   - Historial actualizado
   - Datos en `clients` y `terminals`

### Caso 2: Actualización de Datos Existentes
1. Cargar el mismo archivo dos veces
2. Verificar:
   - Primera vez: X clientes creados, X terminales creados
   - Segunda vez: X clientes actualizados, X terminales actualizados
   - No hay duplicados

### Caso 3: Detección de Recuperación Automática
1. **Importación 1:** Terminal POS001 con DIAS=15 (inactivo)
2. **Importación 2:** POS001 NO aparece en el archivo
3. Verificar:
   - Terminal POS001 marcado como `status='recovered'`
   - `recovery_source='system_import'`
   - Toast: "X terminales marcadas como recuperadas"

### Caso 4: Manejo de Errores
1. Cargar archivo con filas inválidas (sin AFILIADO o RIF)
2. Verificar:
   - Filas válidas se procesan correctamente
   - `errors_count` > 0 en el registro
   - Toast de warning con cantidad de errores

---

## 🚀 Próximas Mejoras

### Validaciones Adicionales
- [ ] Validar formato de RIF (J-12345678)
- [ ] Validar formato de teléfono E.164 (+584121234567)
- [ ] Validar duplicados dentro del mismo archivo
- [ ] Límite de 10,000 filas (front y back)

### Reportes
- [ ] Exportar errores a CSV
- [ ] Resumen por email al completar importación
- [ ] Gráfico de tendencia de importaciones

### Performance
- [ ] Worker threads para procesamiento en background
- [ ] Queue system (Bull/BullMQ) para importaciones grandes
- [ ] Streaming de archivos muy grandes

### UX
- [ ] Preview de primeras 5 filas antes de procesar
- [ ] Descarga de plantilla Excel pre-formateada
- [ ] Drag & Drop de múltiples archivos (procesar en secuencia)

---

## 📚 Referencias

- **Migración:** `supabase/migrations/20240105_add_imports_table.sql`
- **Server Actions:** `actions/import.ts`
- **Componente FileUpload:** `components/venepos/import/file-upload.tsx`
- **Componente ImportHistory:** `components/venepos/import/import-history.tsx`
- **Página de Import:** `app/(dashboard)/import/page.tsx`

---

**Fecha de Implementación:** Nov 23, 2025  
**Estado:** ✅ Completo y funcional  
**Commit:** `6d76ee9`
