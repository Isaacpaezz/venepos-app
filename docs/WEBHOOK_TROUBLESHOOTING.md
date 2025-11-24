# 🔧 Troubleshooting de Webhooks Chatwoot

## 🚨 Problema: No llegan webhooks en producción

### **Síntomas**
- Envías mensaje desde VenePOS ✅
- Cliente responde en WhatsApp ✅
- **Los logs de Vercel no muestran POST a `/api/webhooks/chatwoot`** ❌

---

## ✅ Checklist de Verificación

### **1. Verificar que el Endpoint Funciona**

**Test desde terminal:**
```bash
# Reemplaza con tu URL de Vercel
curl https://venepos-ql2xard9d-isaacpaezzs-projects.vercel.app/api/webhooks/chatwoot

# Deberías ver:
# {
#   "status": "ok",
#   "endpoint": "/api/webhooks/chatwoot",
#   "methods": ["POST"],
#   "description": "Webhook endpoint para eventos de Chatwoot",
#   "timestamp": "2025-01-25T..."
# }
```

**Si no funciona:**
- ❌ El endpoint no está desplegado → Hacer redeploy en Vercel
- ❌ La URL está mal → Verificar URL exacta de producción

---

### **2. Verificar Configuración en Chatwoot**

**Ir a Chatwoot:**
1. Settings → Integrations → Webhooks
2. Buscar tu webhook

**Verificar estos campos:**

#### **A. URL del Webhook**
✅ **DEBE SER EXACTAMENTE:**
```
https://tu-dominio-vercel.app/api/webhooks/chatwoot
```

⚠️ **ERRORES COMUNES:**
- ❌ Falta `/api/webhooks/chatwoot` al final
- ❌ URL de preview en lugar de producción
- ❌ HTTP en lugar de HTTPS
- ❌ Espacios o caracteres extra

#### **B. Eventos Seleccionados**

✅ **DEBES TENER MARCADOS:**
- ☑️ `message_created` (Mensaje creado)
- ☑️ `conversation_updated` (Conversación actualizada)

⚠️ **NO CONFUNDIR CON:**
- ❌ `message_updated` (este NO lo necesitas)
- ❌ `conversation_created` (este NO lo necesitas)

#### **C. Inbox**
- Selecciona "All Inboxes" O el inbox específico de WhatsApp

---

### **3. Verificar Account ID**

El `chatwoot_account_id` en tu base de datos **DEBE COINCIDIR** con el Account ID de Chatwoot.

**Verificar en Supabase:**
```sql
SELECT id, name, chatwoot_account_id 
FROM organizations 
WHERE id = 'tu-organization-id';
```

**Verificar en Chatwoot:**
- Ve a Settings → Account Settings
- Busca el "Account ID" (usualmente es `1` para cuentas self-hosted)

Si no coinciden → Actualizar en Supabase:
```sql
UPDATE organizations 
SET chatwoot_account_id = '1'
WHERE id = 'tu-organization-id';
```

---

### **4. Probar Webhook Manualmente**

Usa el script de prueba para simular un webhook:

```bash
cd venepos-app
./scripts/test-webhook.sh https://tu-dominio-vercel.app/api/webhooks/chatwoot
```

**Deberías ver en Vercel Logs:**
```
🔔 POST /api/webhooks/chatwoot recibido
Headers: {...}
📥 Webhook recibido: message_created
📦 Payload completo: {...}
```

---

### **5. Verificar Logs Detallados**

**En Vercel:**
1. Ve a tu proyecto → Logs
2. Filtra por "Resource": `/api/webhooks/chatwoot`
3. Filtra por "Request Method": `POST`

**Deberías ver estos logs cuando cliente responde:**

```
🔔 POST /api/webhooks/chatwoot recibido
📥 Webhook recibido: message_created
📨 Mensaje entrante en conversación 123
✅ Respuesta de cliente registrada exitosamente
```

**Si NO ves el primer log (`🔔 POST...`):**
→ Chatwoot NO está enviando el webhook

---

## 🔍 Diagnóstico según Síntomas

### **Síntoma 1: No aparece ningún log de POST**

**Causa probable:** Chatwoot no está enviando el webhook

**Solución:**
1. Verificar que la URL en Chatwoot es correcta
2. Verificar que `message_created` está marcado
3. Probar con `curl` manualmente:
   ```bash
   curl -X POST https://tu-app.vercel.app/api/webhooks/chatwoot \
     -H "Content-Type: application/json" \
     -d '{"event":"message_created","account":{"id":1},"conversation":{"id":123},"message":{"id":456,"content":"Test","message_type":0,"private":false,"created_at":1732500000}}'
   ```

### **Síntoma 2: Aparece POST pero retorna 403**

**Causa:** Account ID no autorizado

**Log esperado:**
```
Account ID no autorizado: X
```

**Solución:**
```sql
-- Verificar qué account_id está configurado
SELECT chatwoot_account_id FROM organizations;

-- Actualizar si es necesario
UPDATE organizations 
SET chatwoot_account_id = 'X'
WHERE id = 'tu-org-id';
```

### **Síntoma 3: Aparece POST pero retorna 400**

**Causa:** Payload mal formado

**Log esperado:**
```
Webhook sin account_id
```

**Solución:**
- Verificar que Chatwoot está enviando el payload correcto
- Revisar versión de Chatwoot (debe ser >= 2.0)

### **Síntoma 4: Aparece POST 200 pero no actualiza BD**

**Causa:** No se encuentra el registro en `campaign_queue`

**Log esperado:**
```
No se encontró registro en campaign_queue para esta conversación
```

**Solución:**
```sql
-- Verificar que el mensaje enviado tiene conversation_id
SELECT id, campaign_id, chatwoot_conversation_id, has_replied
FROM campaign_queue
WHERE destinatario = '+584121234567';

-- Si chatwoot_conversation_id es NULL:
-- → El worker no guardó el ID correctamente
-- → Verificar logs del worker cuando envía mensajes
```

---

## 🧪 Test Completo Paso a Paso

### **Paso 1: Test Manual del Endpoint**

```bash
# Test Health Check
curl https://tu-app.vercel.app/api/webhooks/chatwoot
# Espera: {"status":"ok",...}

# Test POST (simular webhook)
curl -X POST https://tu-app.vercel.app/api/webhooks/chatwoot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "account": {"id": 1},
    "conversation": {"id": 999999},
    "message": {
      "id": 1,
      "content": "Test manual",
      "message_type": 0,
      "private": false,
      "created_at": 1732500000
    }
  }'
# Espera: {"processed":false,"reason":"no_queue_match"}
# (Porque conversation 999999 no existe, pero el endpoint funciona)
```

### **Paso 2: Test con Campaña Real**

1. **Enviar mensaje desde VenePOS:**
   - Ir a /campaigns
   - Click en Play ▶️ de una campaña
   - Esperar confirmación

2. **Verificar en BD que se guardó conversation_id:**
   ```sql
   SELECT id, destinatario, chatwoot_conversation_id, has_replied
   FROM campaign_queue
   WHERE campaign_id = 'tu-campaign-id'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Responder desde WhatsApp:**
   - Usa el número que recibió el mensaje
   - Responde cualquier cosa

4. **Verificar en Vercel Logs:**
   - Debe aparecer POST a `/api/webhooks/chatwoot`
   - Debe mostrar log: `📨 Mensaje entrante en conversación X`

5. **Verificar en BD que se actualizó:**
   ```sql
   SELECT has_replied, replied_at
   FROM campaign_queue
   WHERE chatwoot_conversation_id = X;
   
   -- Debe mostrar:
   -- has_replied: true
   -- replied_at: timestamp reciente
   ```

---

## 📋 Checklist Final

Antes de continuar, verifica que **TODOS** estos puntos están bien:

- [ ] GET a `/api/webhooks/chatwoot` retorna 200 OK
- [ ] URL en Chatwoot termina en `/api/webhooks/chatwoot`
- [ ] URL en Chatwoot usa HTTPS (no HTTP)
- [ ] Evento `message_created` está marcado en Chatwoot
- [ ] Evento `conversation_updated` está marcado en Chatwoot
- [ ] `chatwoot_account_id` en BD coincide con Account ID de Chatwoot
- [ ] Worker guarda `chatwoot_conversation_id` al enviar mensaje
- [ ] Test con curl manualmente funciona
- [ ] Logs de Vercel están en modo "Live" (no archivados)

---

## 🆘 Si Nada Funciona

### **Opción 1: Recrear el Webhook**

1. **En Chatwoot:**
   - Elimina el webhook existente
   - Crea uno nuevo
   - Copia/pega la URL exacta de Vercel
   - Marca solo `message_created` y `conversation_updated`
   - Guarda

2. **Prueba inmediata:**
   - Envía un mensaje de prueba desde Chatwoot
   - Verifica logs en Vercel

### **Opción 2: Verificar Firewall/Red**

**Si tu Chatwoot es self-hosted:**
- Verifica que puede hacer requests salientes a internet
- Verifica que no hay firewall bloqueando Vercel
- Test:
  ```bash
  # Desde el servidor de Chatwoot
  curl https://tu-app.vercel.app/api/webhooks/chatwoot
  ```

### **Opción 3: Revisar Versión de Chatwoot**

- Webhooks mejorados disponibles desde Chatwoot 2.0+
- Si usas versión antigua, actualiza

---

## 📞 Soporte

Si después de todo esto aún no funciona:

1. **Captura estos datos:**
   - URL exacta del webhook en Chatwoot
   - Screenshot de eventos seleccionados
   - Output de `curl` manual
   - Logs de Vercel (últimos 20 requests)
   - Output de query: `SELECT * FROM organizations WHERE id = 'x'`

2. **Verifica:**
   - ¿El mensaje se envía desde VenePOS correctamente?
   - ¿El cliente recibe el mensaje en WhatsApp?
   - ¿La respuesta del cliente aparece en Chatwoot?
   - ¿El webhook está "Enabled" en Chatwoot?

---

**¡Con estos pasos deberías poder identificar y resolver el problema!** 🎯
