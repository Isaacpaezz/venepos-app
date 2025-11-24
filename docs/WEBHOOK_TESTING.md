# 🔗 Testing de Webhooks de Chatwoot

## 📋 Resumen

Los webhooks de Chatwoot permiten que VenePOS reciba notificaciones en tiempo real cuando:
- Un cliente responde a un mensaje de campaña
- Se actualizan las etiquetas de una conversación

Este documento explica cómo configurar y probar webhooks en **desarrollo local** y **producción**.

---

## 🏠 Testing Local con ngrok

### **Paso 1: Instalar ngrok**

```bash
# Instalar ngrok globalmente
npm install -g ngrok

# O usar con npx (sin instalación)
npx ngrok http 3000
```

### **Paso 2: Iniciar tu servidor de desarrollo**

```bash
cd venepos-app
npm run dev
```

Tu aplicación debe estar corriendo en `http://localhost:3000`

### **Paso 3: Exponer localhost con ngrok**

En otra terminal, ejecuta:

```bash
ngrok http 3000
```

Verás una salida similar a:

```
ngrok                                                           
                                                                
Session Status                online                            
Account                       tu-cuenta@example.com             
Version                       3.x.x                             
Region                        United States (us)                
Latency                       52ms                              
Web Interface                 http://127.0.0.1:4040             
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copia la URL de Forwarding:** `https://abc123.ngrok.io`

### **Paso 4: Configurar Webhook en Chatwoot**

1. **Ir a Settings en Chatwoot:**
   - Navega a tu instancia de Chatwoot
   - Ve a `Settings` → `Integrations` → `Webhooks`

2. **Crear nuevo Webhook:**
   - Click en `Add Webhook`
   - **URL:** `https://abc123.ngrok.io/api/webhooks/chatwoot`
   - **Events a suscribir:**
     - ✅ `message_created`
     - ✅ `conversation_updated`

3. **Guardar**

### **Paso 5: Verificar conexión**

```bash
# En tu navegador o con curl
curl https://abc123.ngrok.io/api/webhooks/chatwoot

# Deberías ver:
{
  "status": "ok",
  "endpoint": "/api/webhooks/chatwoot",
  "methods": ["POST"],
  "description": "Webhook endpoint para eventos de Chatwoot"
}
```

### **Paso 6: Monitorear requests**

ngrok incluye un dashboard web para ver todos los requests:

```
http://127.0.0.1:4040
```

Aquí verás:
- Todos los webhooks que Chatwoot envía
- Payloads completos
- Respuestas de tu servidor
- Errores si los hay

### **Paso 7: Probar eventos**

#### **Test 1: Respuesta de Cliente (message_created)**

1. Envía un mensaje de campaña desde VenePOS
2. Responde desde WhatsApp como si fueras el cliente
3. Verifica en logs:

```bash
# En tu terminal de Next.js deberías ver:
📥 Webhook recibido: message_created
📨 Mensaje entrante en conversación 123
✅ Respuesta de cliente registrada exitosamente
```

4. Verifica en base de datos:

```sql
SELECT has_replied, replied_at 
FROM campaign_queue 
WHERE chatwoot_conversation_id = 123;

-- Debería mostrar:
-- has_replied: true
-- replied_at: 2025-01-25 16:30:00
```

#### **Test 2: Etiqueta RECUPERADO (conversation_updated)**

1. En Chatwoot, abre una conversación de campaña
2. Agrega la etiqueta "RECUPERADO"
3. Verifica en logs:

```bash
📥 Webhook recibido: conversation_updated
🏷️ Etiqueta RECUPERADO detectada en conversación 123
✅ 2 terminal(es) marcado(s) como recuperado(s)
```

4. Verifica en base de datos:

```sql
SELECT status, recovery_source, recovered_at 
FROM terminals 
WHERE client_id = 'xxx';

-- Debería mostrar:
-- status: recovered
-- recovery_source: agent_manual
-- recovered_at: 2025-01-25 16:35:00
```

---

## 🚀 Testing en Producción (Vercel)

### **Paso 1: Desplegar en Vercel**

```bash
# Desde tu proyecto
vercel --prod
```

O conecta tu repo de GitHub a Vercel para despliegues automáticos.

### **Paso 2: Obtener URL de producción**

Tu app estará en: `https://tu-app.vercel.app`

### **Paso 3: Configurar Webhook en Chatwoot**

1. Ve a `Settings` → `Integrations` → `Webhooks`
2. **URL:** `https://tu-app.vercel.app/api/webhooks/chatwoot`
3. **Events:**
   - ✅ `message_created`
   - ✅ `conversation_updated`
4. Guardar

### **Paso 4: Monitorear con Vercel Logs**

```bash
# Ver logs en tiempo real
vercel logs --follow

# O en el dashboard de Vercel:
# https://vercel.com/tu-cuenta/tu-proyecto/logs
```

---

## 🔍 Debugging de Webhooks

### **Problema: Webhooks no llegan**

**Checklist:**

1. ✅ **URL correcta en Chatwoot**
   - Debe terminar en `/api/webhooks/chatwoot`
   - Debe ser HTTPS (no HTTP)

2. ✅ **Eventos suscritos**
   - Verifica que `message_created` y `conversation_updated` estén activos

3. ✅ **Firewall/Network**
   - Verifica que tu ngrok/Vercel sea accesible públicamente
   - Test con curl desde otra máquina

4. ✅ **Account ID**
   - El `chatwoot_account_id` en tu tabla `organizations` debe coincidir
   - Verifica en logs si hay errores de validación

### **Problema: Error 403 (Forbidden)**

Esto significa que el `account_id` del webhook no coincide con ninguna organización en tu BD.

**Solución:**

```sql
-- Verifica qué account_id está configurado
SELECT chatwoot_account_id FROM organizations;

-- Debe coincidir con el account_id de tu Chatwoot
```

### **Problema: Eventos se reciben pero no se procesan**

**Debug:**

1. Revisa los logs del servidor:

```bash
# Logs de Next.js (local)
# Deberías ver mensajes como:
# "Payload incompleto"
# "No se encontró registro en campaign_queue"
```

2. Verifica el payload en ngrok dashboard:
   - `http://127.0.0.1:4040`
   - Inspecciona el JSON completo
   - Compara con los tipos en `route.ts`

3. Verifica que la conversación exista en `campaign_queue`:

```sql
SELECT * FROM campaign_queue 
WHERE chatwoot_conversation_id = <conversation_id>;
```

---

## 📊 Payload Examples

### **message_created (Cliente responde)**

```json
{
  "event": "message_created",
  "account": {
    "id": 1,
    "name": "VenePOS"
  },
  "conversation": {
    "id": 123,
    "inbox_id": 2,
    "status": "open"
  },
  "message": {
    "id": 456,
    "content": "Hola, me interesa reactivar mi terminal",
    "message_type": 0,
    "private": false,
    "created_at": 1706196600,
    "sender": {
      "id": 789,
      "name": "Juan Pérez",
      "type": "contact"
    }
  },
  "sender": {
    "id": 789,
    "name": "Juan Pérez",
    "phone_number": "+584121234567"
  }
}
```

### **conversation_updated (Etiqueta agregada)**

```json
{
  "event": "conversation_updated",
  "account": {
    "id": 1,
    "name": "VenePOS"
  },
  "conversation": {
    "id": 123,
    "inbox_id": 2,
    "status": "open",
    "labels": ["VenePOS", "Campaña-ReactivaciónEnero", "RECUPERADO"]
  }
}
```

---

## ⚙️ Configuración Avanzada

### **Múltiples Organizaciones**

Si tienes múltiples organizaciones en tu BD, cada una con su propio Chatwoot:

1. Cada organización debe tener su `chatwoot_account_id` único
2. El webhook validará automáticamente que el `account_id` del payload coincida
3. Puedes usar la misma URL de webhook para todas

### **Seguridad Adicional**

Para producción, considera agregar:

1. **Verificación de Signature:**
   - Chatwoot puede firmar requests con un secret
   - Valida el header `X-Chatwoot-Signature`

2. **Rate Limiting:**
   - Usa middleware de Next.js para limitar requests

3. **IP Whitelist:**
   - Si conoces las IPs de tu Chatwoot, restringe acceso

---

## 🧪 Testing Automatizado

### **Simular Webhook con curl**

```bash
# Test message_created
curl -X POST https://abc123.ngrok.io/api/webhooks/chatwoot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "account": { "id": 1 },
    "conversation": { "id": 123 },
    "message": {
      "id": 456,
      "content": "Test response",
      "message_type": 0,
      "private": false,
      "created_at": 1706196600
    }
  }'

# Test conversation_updated
curl -X POST https://abc123.ngrok.io/api/webhooks/chatwoot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "conversation_updated",
    "account": { "id": 1 },
    "conversation": {
      "id": 123,
      "labels": ["RECUPERADO"]
    }
  }'
```

---

## 📚 Recursos

- [Documentación de Webhooks de Chatwoot](https://www.chatwoot.com/docs/product/channels/api/webhook)
- [ngrok Documentation](https://ngrok.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

---

## ✅ Checklist de Testing Completo

- [ ] ngrok instalado y funcionando
- [ ] Webhook configurado en Chatwoot
- [ ] GET a `/api/webhooks/chatwoot` retorna 200
- [ ] Envío de campaña genera conversación en Chatwoot
- [ ] Respuesta de cliente actualiza `has_replied = true`
- [ ] Respuesta de cliente crea registro en `interactions`
- [ ] Etiqueta "RECUPERADO" marca terminal como `recovered`
- [ ] Etiqueta "RECUPERADO" crea interacción tipo `conversion`
- [ ] Logs visibles en dashboard de ngrok
- [ ] Account ID inválido retorna 403
- [ ] Payload malformado retorna 400

---

**¡Listo para recibir eventos de Chatwoot en tiempo real!** 🎉
