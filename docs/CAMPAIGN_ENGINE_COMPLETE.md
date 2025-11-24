# 🎯 Motor de Campañas VenePOS - Sistema Completo

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MOTOR DE CAMPAÑAS VENEPOS                        │
│                                                                          │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────┐│
│  │  FASE 1-3  │───▶│   FASE 4     │───▶│  CHATWOOT    │───▶│ CLIENTE ││
│  │   Wizard   │    │    Worker    │    │     API      │    │WhatsApp ││
│  │   + Cola   │    │   Execution  │    │              │    │         ││
│  └────────────┘    └──────────────┘    └──────────────┘    └─────────┘│
│        │                  │                     │                 │     │
│        ▼                  ▼                     ▼                 ▼     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   BASE DE DATOS (Supabase)                      │  │
│  │  • campaigns        • clients         • interactions            │  │
│  │  • campaign_queue   • terminals       • organizations           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│        ▲                  ▲                     ▲                       │
│        │                  │                     │                       │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  FASE 5    │◀───│  CHATWOOT    │◀───│   CLIENTE    │               │
│  │  Webhooks  │    │   Webhooks   │    │  Responde    │               │
│  └────────────┘    └──────────────┘    └──────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo Completo del Sistema

### **1️⃣ CREACIÓN DE CAMPAÑA (Fases 1-3)**

```
Usuario → Wizard → Filtros → Estimación → Revisión → Crear

┌─────────────────────────────────────────────────────────────┐
│ PASO 1: Configuración Básica                               │
├─────────────────────────────────────────────────────────────┤
│ • Nombre de campaña                                         │
│ • Canal (WhatsApp, SMS, Email)                             │
│ • Tipo (Promoción, Recuperación, etc.)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: Segmentación de Audiencia                          │
├─────────────────────────────────────────────────────────────┤
│ Filtros disponibles:                                        │
│ • Banco (Mercantil, Venezuela, Provincial, etc.)           │
│ • Días sin transaccionar (7, 15, 30, 60, 90+ días)        │
│ • Rango de transacciones (1-10, 11-30, 31-50, 51+)        │
│                                                             │
│ Estimación en tiempo real:                                  │
│ → SELECT COUNT(DISTINCT clients) WHERE filters...          │
│ → Muestra: "📊 1,234 clientes potenciales"                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: Mensaje Personalizado                              │
├─────────────────────────────────────────────────────────────┤
│ Variables disponibles:                                      │
│ • {{nombre}}         → "Juan Pérez"                         │
│ • {{rif}}            → "J-12345678-9"                       │
│ • {{telefono}}       → "+584121234567"                      │
│ • {{dias_inactivo}}  → "45"                                 │
│ • {{rango_lcsttxt}}  → "31 a 50 transacciones"             │
│ • {{afipos}}         → "TERM001"                            │
│                                                             │
│ Ejemplo:                                                    │
│ "Hola {{nombre}}! Han pasado {{dias_inactivo}} días        │
│  desde tu última transacción. ¡Te extrañamos!"             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: Revisión y Confirmación                            │
├─────────────────────────────────────────────────────────────┤
│ • Audiencia final: 1,234 clientes                          │
│ • Clientes únicos (agrupados por RIF)                      │
│ • Solo clientes con teléfono válido                        │
│ • Preview del mensaje personalizado                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULTADO: Campaña Creada                                  │
├─────────────────────────────────────────────────────────────┤
│ • 1 registro en tabla campaigns                            │
│ • 1,234 registros en campaign_queue (status: pending)     │
│ • Cada mensaje personalizado con variables reemplazadas   │
└─────────────────────────────────────────────────────────────┘
```

---

### **2️⃣ EJECUCIÓN DE CAMPAÑA (Fase 4)**

```
Usuario hace clic en botón Play ▶️

┌─────────────────────────────────────────────────────────────┐
│ WORKER: processOutboundBatch(5)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. SELECT 5 pending messages FROM campaign_queue          │
│    ORDER BY created_at ASC                                 │
│                                                             │
│ 2. Para cada mensaje:                                      │
│                                                             │
│    a) Validar configuración Chatwoot                       │
│       ✓ chatwoot_base_url                                  │
│       ✓ chatwoot_account_id                                │
│       ✓ chatwoot_api_token                                 │
│       ✓ chatwoot_inbox_id                                  │
│                                                             │
│    b) Normalizar teléfono (+58...)                         │
│                                                             │
│    c) Buscar/crear contacto en Chatwoot                    │
│       → GET /api/v1/contacts/search?phone=...              │
│       → POST /api/v1/contacts (si no existe)               │
│                                                             │
│    d) Crear conversación                                   │
│       → POST /api/v1/conversations                         │
│       → inbox_id from config                               │
│       → status: 'open'                                     │
│                                                             │
│    e) Enviar mensaje personalizado                         │
│       → POST /api/v1/conversations/{id}/messages           │
│       → message_type: 'outgoing'                           │
│       → content: mensaje personalizado                     │
│                                                             │
│    f) Agregar etiquetas [NUEVO en Fase 5]                 │
│       → POST /api/v1/conversations/{id}/labels             │
│       → labels: ['VenePOS', 'Campaña-NombreCampaña']      │
│                                                             │
│    g) Actualizar campaign_queue                            │
│       → status = 'sent'                                    │
│       → sent_at = NOW()                                    │
│       → provider_id = message.id                           │
│       → chatwoot_conversation_id = conversation.id         │
│                                                             │
│    h) Incrementar contador                                 │
│       → campaigns.enviados += 1                            │
│                                                             │
│    i) Delay 1 segundo                                      │
│       → Evitar rate limiting                               │
│                                                             │
│ 3. Retornar resultado:                                     │
│    {                                                        │
│      processed: 5,                                         │
│      errors: 0,                                            │
│      details: { sent: 5, failed: 0, skipped: 0 }         │
│    }                                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULTADO: Mensajes Enviados                               │
├─────────────────────────────────────────────────────────────┤
│ • 5 conversaciones creadas en Chatwoot                     │
│ • 5 mensajes enviados por WhatsApp                         │
│ • 5 etiquetas aplicadas                                    │
│ • campaign_queue actualizado                               │
│ • Toast de confirmación al usuario                         │
│ • Board actualizado con progreso                           │
└─────────────────────────────────────────────────────────────┘
```

---

### **3️⃣ RESPUESTA DE CLIENTE (Fase 5)**

```
Cliente recibe mensaje en WhatsApp y responde

┌─────────────────────────────────────────────────────────────┐
│ CLIENTE                                                     │
├─────────────────────────────────────────────────────────────┤
│ "Hola! Sí, me interesa reactivar mi terminal"              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ CHATWOOT                                                    │
├─────────────────────────────────────────────────────────────┤
│ • Recibe mensaje del cliente                               │
│ • Envía webhook: message_created                           │
│   POST https://tu-app.vercel.app/api/webhooks/chatwoot    │
│                                                             │
│   Payload:                                                  │
│   {                                                         │
│     "event": "message_created",                            │
│     "account": { "id": 1 },                                │
│     "conversation": { "id": 123 },                         │
│     "message": {                                            │
│       "id": 456,                                            │
│       "content": "Hola! Sí, me interesa...",              │
│       "message_type": 0,  // incoming                      │
│       "private": false                                      │
│     }                                                       │
│   }                                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ VENEPOS WEBHOOK HANDLER                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Validar account_id                                       │
│    → Buscar en organizations.chatwoot_account_id           │
│    → Si no existe → 403 Forbidden                          │
│                                                             │
│ 2. Validar tipo de mensaje                                 │
│    → message_type = 0 (incoming) ✓                         │
│    → private = false ✓                                     │
│                                                             │
│ 3. Buscar en campaign_queue                                │
│    → WHERE chatwoot_conversation_id = 123                  │
│                                                             │
│ 4. Actualizar registro                                     │
│    → has_replied = true                                    │
│    → replied_at = NOW()                                    │
│                                                             │
│ 5. Crear interacción                                       │
│    INSERT INTO interactions:                               │
│    {                                                        │
│      type: 'whatsapp_reply',                              │
│      channel: 'whatsapp',                                  │
│      content: "Hola! Sí, me interesa...",                 │
│      provider: 'chatwoot',                                 │
│      metadata: { conversation_id, message_id, sender }    │
│    }                                                        │
│                                                             │
│ 6. Log confirmación                                        │
│    ✅ Respuesta de cliente registrada                      │
└─────────────────────────────────────────────────────────────┘
```

---

### **4️⃣ RECUPERACIÓN DE TERMINAL (Fase 5)**

```
Agente en Chatwoot agrega etiqueta "RECUPERADO"

┌─────────────────────────────────────────────────────────────┐
│ AGENTE EN CHATWOOT                                          │
├─────────────────────────────────────────────────────────────┤
│ • Negocia con cliente                                       │
│ • Cliente acepta reactivar terminal                        │
│ • Agente agrega etiqueta: "RECUPERADO"                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ CHATWOOT                                                    │
├─────────────────────────────────────────────────────────────┤
│ • Detecta cambio en labels                                 │
│ • Envía webhook: conversation_updated                      │
│   POST https://tu-app.vercel.app/api/webhooks/chatwoot    │
│                                                             │
│   Payload:                                                  │
│   {                                                         │
│     "event": "conversation_updated",                       │
│     "account": { "id": 1 },                                │
│     "conversation": {                                       │
│       "id": 123,                                            │
│       "labels": [                                           │
│         "VenePOS",                                          │
│         "Campaña-ReactivaciónEnero",                       │
│         "RECUPERADO"                                        │
│       ]                                                     │
│     }                                                       │
│   }                                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ VENEPOS WEBHOOK HANDLER                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Validar account_id                                       │
│                                                             │
│ 2. Detectar etiqueta "RECUPERADO"                          │
│    → labels.includes('RECUPERADO') ✓                       │
│                                                             │
│ 3. Buscar cliente por conversation_id                      │
│    SELECT client_id FROM campaign_queue                    │
│    WHERE chatwoot_conversation_id = 123                    │
│                                                             │
│ 4. Obtener terminales del cliente                          │
│    SELECT afipos FROM terminals                            │
│    WHERE client_id = 'xxx'                                 │
│                                                             │
│ 5. Actualizar todos los terminales                         │
│    UPDATE terminals SET                                     │
│      status = 'recovered',                                 │
│      recovery_source = 'agent_manual',                     │
│      recovered_at = NOW()                                  │
│    WHERE afipos IN (...)                                   │
│                                                             │
│ 6. Crear interacción de conversión                         │
│    INSERT INTO interactions:                               │
│    {                                                        │
│      type: 'conversion',                                   │
│      content: 'Terminal marcado como RECUPERADO',         │
│      metadata: { terminal_ids, labels }                   │
│    }                                                        │
│                                                             │
│ 7. Log confirmación                                        │
│    ✅ 2 terminal(es) marcado(s) como recuperado(s)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Datos

```sql
-- CAMPAÑA
campaigns
├── id (UUID)
├── nombre (TEXT)
├── tipo (TEXT)
├── canal (TEXT)
├── filtros (JSONB)
├── mensaje_template (TEXT)
├── status (TEXT) -- draft, processing, completed
├── total_destinatarios (INT)
├── enviados (INT)
├── entregados (INT)
└── progreso (DECIMAL) -- calculado: enviados/total * 100

-- COLA DE MENSAJES
campaign_queue
├── id (UUID)
├── campaign_id (UUID) → campaigns
├── client_id (UUID) → clients
├── destinatario (TEXT) -- teléfono
├── mensaje_personalizado (TEXT)
├── status (TEXT) -- pending, sent, failed
├── chatwoot_conversation_id (INT) ← [NUEVO Fase 5]
├── has_replied (BOOLEAN) ← [NUEVO Fase 5]
├── replied_at (TIMESTAMPTZ) ← [NUEVO Fase 5]
├── sent_at (TIMESTAMPTZ)
├── provider_id (TEXT)
└── intentos (INT)

-- INTERACCIONES
interactions ← [NUEVA TABLA Fase 5]
├── id (UUID)
├── organization_id (UUID) → organizations
├── client_id (UUID) → clients
├── terminal_id (TEXT) → terminals
├── campaign_id (UUID) → campaigns
├── type (TEXT) -- whatsapp_reply, conversion, call, visit
├── channel (TEXT) -- whatsapp, email, sms
├── content (TEXT)
├── metadata (JSONB)
├── provider (TEXT)
├── provider_id (TEXT)
├── occurred_at (TIMESTAMPTZ)
└── created_at (TIMESTAMPTZ)

-- TERMINALES
terminals
├── afipos (TEXT) PK
├── client_id (UUID) → clients
├── status (TEXT) ← [NUEVO Fase 5]
│   -- active, inactive, recovered, churned
├── recovery_source (TEXT) ← [NUEVO Fase 5]
│   -- agent_manual, campaign_auto, direct_contact
├── recovered_at (TIMESTAMPTZ) ← [NUEVO Fase 5]
├── dias_sin_tx (INT)
└── rango (TEXT)

-- ORGANIZACIONES
organizations
├── id (UUID)
├── name (TEXT)
├── chatwoot_base_url (TEXT)
├── chatwoot_account_id (TEXT)
├── chatwoot_api_token (TEXT)
└── chatwoot_inbox_id (TEXT)
```

---

## 🔧 Configuración Requerida

### **1. Chatwoot (Settings → Integrations → Webhooks)**

```
URL: https://tu-app.vercel.app/api/webhooks/chatwoot

Events:
✅ message_created
✅ conversation_updated
```

### **2. Base de Datos (organizations table)**

```sql
UPDATE organizations SET
  chatwoot_base_url = 'https://tu-chatwoot.com',
  chatwoot_account_id = '1',
  chatwoot_api_token = 'tu-api-token',
  chatwoot_inbox_id = '2'
WHERE id = 'tu-org-id';
```

---

## 📈 Métricas Disponibles

### **Por Campaña:**
- Total destinatarios
- Mensajes enviados
- Mensajes entregados
- Progreso (%)
- Respuestas recibidas
- Tasa de respuesta (%)
- Conversiones (terminales recuperados)
- ROI de campaña

### **Por Cliente:**
- Fecha de último contacto
- Campañas recibidas
- Ha respondido (sí/no)
- Terminal recuperado (sí/no)
- Historial de interacciones

### **Globales:**
- Campañas activas
- Mensajes en cola
- Respuestas hoy
- Terminales recuperados este mes
- Tasa de conversión promedio

---

## 🚀 Testing Completo

### **Test 1: Creación de Campaña**
```bash
1. Ir a /campaigns
2. Click en "Nueva Campaña"
3. Completar wizard:
   - Nombre: "Test Reactivación"
   - Canal: WhatsApp
   - Filtros: Banco Mercantil, 30 días inactivos
   - Mensaje con variables
4. Ver estimación en tiempo real
5. Crear campaña
6. Verificar en BD: campaigns + campaign_queue
```

### **Test 2: Envío de Mensajes**
```bash
1. Click en botón Play ▶️
2. Ver toast de confirmación
3. Verificar en Chatwoot:
   - Contacto creado
   - Conversación abierta
   - Mensaje enviado
   - Etiquetas: ['VenePOS', 'Campaña-TestReactivación']
4. Verificar en BD:
   - campaign_queue.status = 'sent'
   - campaign_queue.chatwoot_conversation_id = ID
   - campaigns.enviados incrementado
```

### **Test 3: Respuesta de Cliente**
```bash
1. Simular respuesta en Chatwoot
2. Verificar webhook recibido:
   curl -X POST http://localhost:3000/api/webhooks/chatwoot \
     -H "Content-Type: application/json" \
     -d '{"event":"message_created", ...}'
3. Verificar en BD:
   - campaign_queue.has_replied = true
   - campaign_queue.replied_at = timestamp
   - interactions.type = 'whatsapp_reply'
```

### **Test 4: Recuperación**
```bash
1. Agregar etiqueta "RECUPERADO" en Chatwoot
2. Verificar webhook recibido
3. Verificar en BD:
   - terminals.status = 'recovered'
   - terminals.recovery_source = 'agent_manual'
   - terminals.recovered_at = timestamp
   - interactions.type = 'conversion'
```

---

## ✅ Checklist de Producción

- [ ] Migraciones aplicadas en Supabase
- [ ] Configuración de Chatwoot completa en organizations
- [ ] Webhook configurado en Chatwoot apuntando a producción
- [ ] Variables de entorno configuradas
- [ ] Tests de campaña completos
- [ ] Monitoreo configurado (Vercel Logs)
- [ ] Rate limiting configurado
- [ ] Backup de BD configurado
- [ ] Documentación interna compartida
- [ ] Capacitación de usuarios completada

---

## 🎉 Estado Final

```
✅ Fase 1: Diseño y Arquitectura
✅ Fase 2: Estimación de Audiencia  
✅ Fase 3: Población de Cola
✅ Fase 4: Worker de Ejecución
✅ Fase 5: Webhooks y Etiquetas

MOTOR DE CAMPAÑAS: 100% FUNCIONAL
```

**Sistema listo para producción con capacidad de:**
- Crear campañas segmentadas
- Enviar mensajes personalizados
- Rastrear respuestas en tiempo real
- Automatizar recuperación de terminales
- Generar analytics completos

🚀 **¡Listo para escalar!**
