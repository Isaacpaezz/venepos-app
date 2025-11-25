# Fase 6.2: Testing de UI de Detalle de Campaña

## 🧪 Checklist de Testing

### 1. Navegación

- [ ] **Desde Campaign Card:**
  - Hacer clic en el título de una campaña
  - Debe navegar a `/campaigns/[id]`
  - El hover debe mostrar color azul

- [ ] **Botón Volver:**
  - Hacer clic en "Volver"
  - Debe regresar a `/campaigns`

### 2. Header

- [ ] **Título:**
  - Muestra el nombre correcto de la campaña
  - Tamaño grande (text-3xl)
  - Color slate-900

- [ ] **Badge de Estado:**
  - **Completed:** Verde (emerald-100/700)
  - **Processing:** Azul (blue-100/700)
  - **Draft:** Gris (slate-100/700)
  - **Cancelled:** Rojo (red-100/700)

- [ ] **Fecha:**
  - Formato: "Creada el [día] de [mes] de [año]"
  - Color gris (text-slate-500)
  - Tamaño pequeño (text-sm)

### 3. KPIs (4 Tarjetas)

#### Tarjeta 1: Audiencia
- [ ] Icono Users (slate-500)
- [ ] Número correcto de destinatarios
- [ ] Texto: "Total de destinatarios"
- [ ] Color del número: slate-900

#### Tarjeta 2: Enviados
- [ ] Icono Send (blue-500)
- [ ] Número correcto de enviados
- [ ] Texto: "Mensajes enviados exitosamente"
- [ ] Color del número: blue-600

#### Tarjeta 3: Respuestas
- [ ] Icono MessageCircle (amber-500)
- [ ] Número correcto de respuestas
- [ ] Texto: "Clientes que respondieron"
- [ ] Color del número: amber-600

#### Tarjeta 4: Recuperados
- [ ] Icono CheckCircle2 (emerald-500)
- [ ] Número correcto de recuperados
- [ ] Texto: "Terminales recuperados"
- [ ] Color del número: emerald-600

### 4. Tabla de Destinatarios

#### Columna: Cliente
- [ ] Muestra nombre del cliente
- [ ] Muestra rango de deuda como subtexto
- [ ] Nombre en negrita (font-medium)
- [ ] Subtexto en gris (text-slate-500)

#### Columna: Teléfono
- [ ] Formato legible
- [ ] Color slate-600

#### Columna: Estado Envío
- [ ] **sent:**
  - Badge verde (emerald-100/700)
  - Icono Check
  - Texto "Enviado"
- [ ] **pending:**
  - Badge amarillo (amber-100/700)
  - Icono Clock
  - Texto "Pendiente"
- [ ] **failed:**
  - Badge rojo (red-100/700)
  - Icono X
  - Texto "Fallido"

#### Columna: Respuesta
- [ ] **has_replied = true:**
  - Badge azul (blue-100/700)
  - Texto "Respondió"
- [ ] **has_replied = false:**
  - Guion gris (—)

#### Columna: Estado Terminal
- [ ] **status = 'recovered':**
  - Badge verde (emerald-100/700)
  - Texto "RECUPERADO"
- [ ] **Otro status:**
  - Badge gris (slate-100/600)
  - Texto del status
- [ ] **Sin terminal:**
  - Guion gris (—)

### 5. Casos Edge

- [ ] **Campaña sin destinatarios:**
  - Muestra mensaje "No hay destinatarios en esta campaña"
  - Centrado en la tabla

- [ ] **Campaña no encontrada:**
  - Redirect a `/campaigns`
  - No muestra error en pantalla

- [ ] **Datos nulos:**
  - `rango_deuda` null → no muestra subtexto
  - `terminal_afipos` null → muestra guion
  - `completed_at` null → no afecta el render

### 6. Responsive Design

- [ ] **Mobile (< 768px):**
  - KPIs en 1 columna
  - Tabla scrollable horizontalmente
  - Botón volver visible

- [ ] **Tablet (768px - 1024px):**
  - KPIs en 2 columnas
  - Tabla completa visible

- [ ] **Desktop (> 1024px):**
  - KPIs en 4 columnas
  - Tabla completa visible
  - max-w-6xl centrado

### 7. Performance

- [ ] **Carga inicial:**
  - Página carga en < 2 segundos
  - No hay flickering

- [ ] **Server Component:**
  - No hay hidratación de JavaScript innecesaria
  - Analytics se obtienen en el servidor

### 8. Accesibilidad

- [ ] **Navegación por teclado:**
  - Tab funciona correctamente
  - Enter en el botón volver funciona

- [ ] **Contraste:**
  - Todos los textos tienen contraste adecuado
  - Badges son legibles

- [ ] **Semántica:**
  - H1 para el título principal
  - H2 para "Detalle de Envíos"
  - Table con thead y tbody correctos

---

## 🎨 Visual Testing

### Comparación con Diseño

Verificar que coincida con las imágenes proporcionadas:

1. **Espaciado:**
   - [ ] Padding del contenedor: p-6
   - [ ] Espacio entre secciones: space-y-6
   - [ ] Gap en grid de KPIs: gap-4

2. **Colores:**
   - [ ] Background cards: bg-white
   - [ ] Sombras: shadow-sm
   - [ ] Bordes: rounded-xl

3. **Tipografía:**
   - [ ] Título: text-3xl font-bold
   - [ ] KPI números: text-3xl font-bold
   - [ ] KPI labels: text-sm font-medium
   - [ ] Tabla headers: TableHead (default)
   - [ ] Tabla cells: TableCell (default)

---

## 🔧 Testing Manual

### Escenario 1: Campaña Completada

```bash
# 1. Navegar a /campaigns
# 2. Hacer clic en una campaña con status="completed"
# 3. Verificar:
#    - Badge verde "Completada"
#    - KPIs muestran números > 0
#    - Tabla muestra todos los destinatarios
#    - Al menos un badge "RECUPERADO" si hay terminales recuperados
```

### Escenario 2: Campaña en Proceso

```bash
# 1. Navegar a /campaigns
# 2. Hacer clic en una campaña con status="processing"
# 3. Verificar:
#    - Badge azul "En Proceso"
#    - KPIs muestran progreso parcial
#    - Algunos badges "Pendiente" en la tabla
```

### Escenario 3: Campaña Draft

```bash
# 1. Navegar a /campaigns
# 2. Hacer clic en una campaña con status="draft"
# 3. Verificar:
#    - Badge gris "Borrador"
#    - KPI Enviados = 0
#    - Todos los estados en "Pendiente"
```

---

## 📊 Testing de Analytics

### Verificar Cálculos de KPIs

```sql
-- En Supabase SQL Editor

-- 1. Audience (debe coincidir con KPI)
SELECT COUNT(*) as audience
FROM campaign_queue
WHERE campaign_id = '[campaign-id]';

-- 2. Sent (debe coincidir con KPI)
SELECT COUNT(*) as sent
FROM campaign_queue
WHERE campaign_id = '[campaign-id]'
  AND status = 'sent';

-- 3. Replied (debe coincidir con KPI)
SELECT COUNT(*) as replied
FROM campaign_queue
WHERE campaign_id = '[campaign-id]'
  AND has_replied = true;

-- 4. Recovered (debe coincidir con KPI)
SELECT COUNT(DISTINCT t.afipos) as recovered
FROM campaign_queue cq
JOIN terminals t ON t.client_id = cq.client_id
WHERE cq.campaign_id = '[campaign-id]'
  AND t.status = 'recovered';
```

---

## 🐛 Bugs Conocidos a Verificar

- [ ] **Rango de deuda placeholder:**
  - Actualmente usa lógica simplificada
  - Verificar que no cause errores

- [ ] **Múltiples terminales por cliente:**
  - Si un cliente tiene 2+ terminales
  - Solo muestra el primero en la tabla
  - Verificar que no cause confusión

- [ ] **Formato de teléfono:**
  - Se muestra tal cual está en la BD
  - No hay formateo adicional

---

## ✅ Criterios de Aceptación

La implementación está completa cuando:

1. ✅ Todos los checkboxes de este documento están marcados
2. ✅ La página se ve idéntica al diseño proporcionado
3. ✅ No hay errores en la consola del navegador
4. ✅ No hay warnings de TypeScript
5. ✅ La navegación funciona correctamente
6. ✅ Los KPIs muestran datos correctos
7. ✅ La tabla muestra todos los destinatarios
8. ✅ Los badges tienen los colores correctos
9. ✅ Es responsive en todos los tamaños de pantalla
10. ✅ Pasa los tests de accesibilidad básicos

---

## 📝 Notas para QA

### Datos de Prueba Recomendados

Para testing completo, crear campañas con:

1. **Campaña vacía:** 0 destinatarios
2. **Campaña pequeña:** 5 destinatarios
3. **Campaña mediana:** 50 destinatarios
4. **Campaña grande:** 500+ destinatarios
5. **Campaña con recuperados:** Al menos 3 terminales recuperados
6. **Campaña sin respuestas:** has_replied = false para todos
7. **Campaña con respuestas:** has_replied = true para algunos

### Browsers a Probar

- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)
- [ ] Edge (última versión)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)
