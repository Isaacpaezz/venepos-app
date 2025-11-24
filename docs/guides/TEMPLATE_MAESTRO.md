# 📋 Template Maestro - Formato Definitivo

## 🎯 Resumen

El sistema de importación ha sido ajustado para procesar el **Template Maestro Definitivo** de VenePOS, con mapeo exacto de todas las columnas del reporte operativo.

---

## 📊 Estructura del Archivo

### Hoja Requerida: `BASE`

El sistema busca automáticamente una hoja llamada **"BASE"** (case-insensitive) en el archivo Excel. Si no la encuentra, procesa la primera hoja disponible.

---

## 🗂️ Mapeo de Columnas

### Campos de Cliente → `clients`

| Columna Excel | Campo DB | Tipo | Descripción |
|---------------|----------|------|-------------|
| `CODIGO_AFILIADO` | `codigo_afiliado` | TEXT | **Upsert Key** - Código único del cliente |
| `NOMBRE_AFILIADO` | `nombre` | TEXT | Nombre del comercio |
| `RIF_AFILIADO` | `rif` | TEXT | RIF del cliente |
| `TELEFONO_AFILIADO` | `telefono` | TEXT | Teléfono de contacto |
| `PERSONA_CONTACTO` | `persona_contacto` | TEXT | Nombre de contacto |
| `DIRECCION_AFILIADO` | `direccion` | TEXT | Dirección física |
| `NOMBRE_BANCO` | `banco` | TEXT | Banco adquirente |
| `CATEGORIA_COMERCIO` | `categoria` | TEXT | Categoría (ej: Restaurante) |

### Ubicación → `ubicacion_json` (JSONB)

| Columna Excel | Campo JSON | Tipo |
|---------------|------------|------|
| `REGION` | `region` | TEXT |
| `ESTADO` | `estado` | TEXT |
| `CIUDAD` | `ciudad` | TEXT |
| `SECTOR` | `sector` | TEXT |

**Ejemplo de JSON almacenado:**
```json
{
  "region": "CENTRO",
  "estado": "MIRANDA",
  "ciudad": "CARACAS",
  "sector": "LOS PALOS GRANDES"
}
```

### Campos de Terminal → `terminals`

| Columna Excel | Campo DB | Tipo | Descripción |
|---------------|----------|------|-------------|
| `AFIPOS` | `afipos` | TEXT | **Upsert Key (PK)** - ID único del terminal |
| `NUMPOS` | `numpos` | TEXT | Número del terminal |
| `RANGO` | `rango` | TEXT | Rango de inactividad |

### Datos Técnicos → `datos_tecnicos_json` (JSONB)

| Columna Excel | Campo JSON | Tipo |
|---------------|------------|------|
| `MARCA` | `marca` | TEXT |
| `MODELO` | `modelo` | TEXT |
| `SERIAL` | `serial` | TEXT |
| `OPERADORA` | `operadora` | TEXT |
| `ESTADO_POSV2` | `estado_pos` | TEXT |

**Ejemplo de JSON almacenado:**
```json
{
  "marca": "INGENICO",
  "modelo": "ICT250",
  "serial": "12345ABC",
  "operadora": "MOVISTAR",
  "estado_pos": "INSTALADO"
}
```

---

## 🎨 Valores de RANGO y Colores

El sistema asigna colores y status automáticamente según el valor del campo `RANGO`:

| Valor de RANGO | Status en DB | Badge Color | Significado |
|----------------|--------------|-------------|-------------|
| `SIN TX EN EL MES ACTUAL` | `active` | 🟢 Verde | Terminal transaccionando normalmente |
| `30 DIAS SIN TX` | `inactive` | 🟡 Amarillo | Inactividad media |
| `60 DIAS SIN TX` | `inactive` | 🔴 Rojo | Inactividad alta |
| `> 60 DIAS SIN TX` | `inactive` | 🔴 Rojo | Inactividad crítica |
| `> 120 DIAS SIN TX` | `inactive` | 🔴 Rojo | Inactividad muy crítica |

---

## 🔄 Lógica de Procesamiento

### 1. Upsert de Clientes
```typescript
// Buscar por CODIGO_AFILIADO
const existingClient = await supabase
  .from("clients")
  .select("id")
  .eq("codigo_afiliado", row.CODIGO_AFILIADO)
  .single()

if (existingClient) {
  // UPDATE: Actualizar datos existentes
  await supabase.from("clients").update(clientData)
} else {
  // INSERT: Crear nuevo cliente
  await supabase.from("clients").insert(clientData)
}
```

### 2. Upsert de Terminales
```typescript
// Buscar por AFIPOS (PK)
const existingTerminal = await supabase
  .from("terminals")
  .select("afipos, status")
  .eq("afipos", row.AFIPOS)
  .single()

if (existingTerminal) {
  // UPDATE: Actualizar datos + last_seen_in_import
  await supabase.from("terminals").update({
    ...terminalData,
    last_seen_in_import: NOW()
  })
} else {
  // INSERT: Crear nueva terminal
  // Status basado en RANGO
  const isActive = row.RANGO.includes("SIN TX EN EL MES ACTUAL")
  await supabase.from("terminals").insert({
    ...terminalData,
    status: isActive ? "active" : "inactive"
  })
}
```

### 3. Detección de Recuperaciones
```typescript
// Buscar terminales que NO aparecieron en esta importación
const terminalsToRecover = await supabase
  .from("terminals")
  .select("afipos")
  .eq("organization_id", organizationId)
  .eq("status", "inactive")
  .lt("last_seen_in_import", importStartTime)

// Marcar como recuperados automáticamente
await supabase.from("terminals").update({
  status: "recovered",
  recovery_source: "system_import" // NO cuenta para KPI de agente
})
```

---

## 🗄️ Cambios en Base de Datos

### Migración: `20240106_final_schema_adjustments.sql`

#### Nuevos Campos en `clients`:
- `persona_contacto` (TEXT)
- `categoria` (TEXT)
- `ubicacion_json` (JSONB) ✨

#### Nuevos Campos en `terminals`:
- `rango` (TEXT)
- `datos_tecnicos_json` (JSONB) ✨
- `dias_sin_tx` → Ahora es NULLABLE

#### Nuevos Índices:
- `idx_clients_banco` - Para filtrar por banco
- `idx_clients_categoria` - Para filtrar por categoría
- `idx_terminals_rango` - Para filtrar por rango
- `idx_clients_ubicacion_json` (GIN) - Para búsquedas en JSONB
- `idx_terminals_datos_tecnicos_json` (GIN) - Para búsquedas en JSONB

---

## 📝 Validaciones Implementadas

### Validación de Hoja
```typescript
// Buscar hoja "BASE" (ignora mayúsculas/minúsculas)
let sheetName = workbook.SheetNames.find(name => 
  name.toLowerCase() === "base"
)

// Fallback a primera hoja si no existe "BASE"
if (!sheetName) {
  sheetName = workbook.SheetNames[0]
}
```

### Validación de Headers
```typescript
// Verificar campos mínimos requeridos
const firstRow = jsonData[0]
if (!firstRow.AFIPOS || !firstRow.CODIGO_AFILIADO) {
  throw new Error("Faltan columnas requeridas")
}
```

---

## 🎯 Ejemplo de Archivo

```
CODIGO_AFILIADO | NOMBRE_AFILIADO | RIF_AFILIADO | TELEFONO_AFILIADO | AFIPOS | NUMPOS | RANGO
12345           | COMERCIO ABC    | J-12345678   | +584121234567     | POS001 | 001    | SIN TX EN EL MES ACTUAL
12346           | TIENDA XYZ      | J-23456789   | +584122345678     | POS002 | 002    | 30 DIAS SIN TX
12347           | RESTAURANT 123  | J-34567890   | +584123456789     | POS003 | 003    | > 60 DIAS SIN TX
```

---

## 🧪 Testing

### Test 1: Importación Completa
1. Cargar archivo con hoja "BASE"
2. Verificar que se procesen todas las columnas
3. Verificar ubicacion_json en clients
4. Verificar datos_tecnicos_json en terminals
5. Verificar colores de badges según RANGO

### Test 2: Actualización de Datos
1. Importar mismo archivo dos veces
2. Primera vez: Clientes y terminales creados
3. Segunda vez: Clientes y terminales actualizados
4. Verificar que last_seen_in_import se actualiza

### Test 3: Recuperación Automática
1. Primera importación: Terminal con RANGO = "30 DIAS SIN TX"
2. Segunda importación: Ese terminal NO aparece
3. Verificar que status = "recovered"
4. Verificar que recovery_source = "system_import"

---

## 🚀 Próximas Mejoras

### Validaciones Adicionales
- [ ] Validar formato de RIF (J-12345678)
- [ ] Validar formato de teléfono (+58...)
- [ ] Validar valores permitidos en RANGO
- [ ] Validar valores permitidos en ESTADO_POSV2

### Enriquecimiento de Datos
- [ ] Geocodificación de direcciones
- [ ] Normalización de nombres de bancos
- [ ] Detección de duplicados por RIF
- [ ] Sugerencias de categorías

### Reportes
- [ ] Exportar errores detallados a CSV
- [ ] Dashboard de importaciones
- [ ] Alertas por email
- [ ] Métricas de calidad de datos

---

## 📚 Referencias

- **Migración:** `supabase/migrations/20240106_final_schema_adjustments.sql`
- **Server Actions:** `actions/import.ts`
- **FileUpload:** `components/venepos/import/file-upload.tsx`
- **Columns:** `components/venepos/clients/columns.tsx`
- **Feature Doc:** `docs/guides/IMPORT_FEATURE.md`

---

**Fecha de Actualización:** Nov 23, 2025  
**Versión:** 2.0 (Template Maestro Definitivo)  
**Estado:** ✅ Implementado y funcional
