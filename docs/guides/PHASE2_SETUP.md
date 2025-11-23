# 🚀 Fase 2: Backend & Integraciones - Guía de Configuración

## ✅ Archivos Creados

### 1. **Configuración de Supabase**
- ✅ `lib/supabase/client.ts` - Cliente para navegador (Client Components)
- ✅ `lib/supabase/server.ts` - Cliente para servidor (Server Components, Server Actions)

### 2. **Migración de Base de Datos**
- ✅ `supabase/migrations/20240101_init.sql` - Esquema completo con RLS
- ✅ `supabase/README.md` - Documentación de migraciones

### 3. **Server Actions**
- ✅ `actions/chatwoot.ts` - Validación y guardado de configuración de Chatwoot
  - `verifyAndSaveChatwootConfig()` - Verifica credenciales con API real
  - `getChatwootConfig()` - Obtiene configuración existente

### 4. **Componentes Actualizados**
- ✅ `components/venepos/settings/chatwoot-form.tsx` - Formulario con integración real

### 5. **Tipos TypeScript**
- ✅ `types/database.ts` - Tipos completos del esquema de base de datos

### 6. **Scripts NPM**
- ✅ `package.json` - Scripts agregados para Supabase

---

## 📋 Pasos para Completar la Configuración

### Paso 1: Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` contenga:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Paso 2: Ejecutar la Migración

**Opción A: Dashboard de Supabase (Más Fácil)**

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Crea una nueva query
5. Copia y pega el contenido de `supabase/migrations/20240101_init.sql`
6. Haz clic en **Run**
7. Verifica que las tablas se crearon en **Table Editor**

**Opción B: CLI de Supabase**

```bash
# Vincular el proyecto (solo la primera vez)
cd venepos-app
supabase link --project-ref TU_PROJECT_REF

# Ejecutar la migración
supabase db push
```

### Paso 3: Crear Datos Iniciales

Después de ejecutar la migración, necesitas crear:

1. **Una organización**:
   - Ve a la tabla `organizations` en el Dashboard
   - Crea una nueva fila con el nombre de tu empresa

2. **Un perfil vinculado a tu usuario**:
   - Primero, crea un usuario de prueba en **Authentication** > **Users**
   - Luego, en la tabla `profiles`, crea una fila con:
     - `id`: El UUID del usuario que creaste
     - `organization_id`: El UUID de la organización que creaste
     - `full_name`: Tu nombre completo
     - `role`: `owner` o `admin`

### Paso 4: Probar la Integración

1. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

2. Navega a [http://localhost:3000/settings](http://localhost:3000/settings)

3. En la pestaña **Integraciones**, prueba el formulario de Chatwoot:
   - **Chatwoot Base URL**: La URL de tu instancia de Chatwoot (ej: `https://app.chatwoot.com`)
   - **Account ID**: Tu Account ID en Chatwoot
   - **User API Access Token**: Token de API de tu usuario en Chatwoot

4. Haz clic en **Verificar y Guardar**

5. Si las credenciales son correctas:
   - Verás un mensaje de éxito ✅
   - La configuración se guardará en la base de datos
   - El badge cambiará a "Conectado"

---

## 🔧 Scripts NPM Disponibles

```bash
# Ejecutar migraciones
pnpm run db:migrate

# Generar tipos TypeScript desde el esquema
pnpm run db:types

# Resetear base de datos local (⚠️ CUIDADO: Borra todos los datos)
pnpm run db:reset

# Iniciar Supabase local
pnpm run supabase:start

# Detener Supabase local
pnpm run supabase:stop
```

---

## 📊 Esquema de Base de Datos

### Tablas Creadas

1. **organizations**
   - Información de la empresa
   - Configuración de Chatwoot
   - RLS: Los usuarios ven solo su organización

2. **profiles**
   - Perfil de usuario vinculado a `auth.users`
   - Roles: member, admin, owner
   - RLS: Los usuarios ven perfiles de su organización

3. **clients**
   - Clientes/comercios afiliados
   - Información de contacto y ubicación
   - RLS: Los usuarios gestionan clientes de su organización

4. **terminals**
   - Terminales POS
   - Estado y tracking
   - RLS: Los usuarios gestionan terminales de su organización

5. **campaigns**
   - Campañas de mensajería
   - Estadísticas de envío
   - RLS: Los usuarios gestionan campañas de su organización

6. **campaign_queue**
   - Cola de envíos individuales
   - Tracking detallado
   - RLS: Los usuarios ven cola de su organización

### Funciones Auxiliares

- `get_user_organization_id()`: Retorna el organization_id del usuario actual

---

## 🔒 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas que garantizan:

- **Multi-tenancy**: Aislamiento completo entre organizaciones
- **Control de acceso**: Permisos basados en roles
- **Prevención de fugas**: Los datos no son accesibles entre organizaciones

### Encriptación del Token de Chatwoot

⚠️ **IMPORTANTE**: El campo `chatwoot_api_token` en la tabla `organizations` actualmente se almacena en texto plano.

**Para producción, considera**:
- Usar la función `pgcrypto` de PostgreSQL para encriptar
- Usar un servicio externo de gestión de secretos (AWS Secrets Manager, Vault)
- Implementar encriptación a nivel de aplicación

---

## 🎯 Funcionalidad Implementada

### Server Action: `verifyAndSaveChatwootConfig`

**Flujo de validación**:

1. ✅ Valida formato de entrada (URL, longitud del token)
2. ✅ Hace petición GET real a `/api/v1/profile` de Chatwoot
3. ✅ Verifica respuesta HTTP 200 con datos válidos
4. ✅ Obtiene usuario autenticado de Supabase
5. ✅ Verifica permisos del usuario (admin o owner)
6. ✅ Guarda configuración en la tabla `organizations`
7. ✅ Revalida cache de Next.js
8. ✅ Retorna resultado con nombre del agente

**Manejo de errores**:
- Token inválido (HTTP 401)
- URL o Account ID incorrectos (HTTP 404)
- Timeout de conexión (10 segundos)
- Errores de red
- Permisos insuficientes
- Usuario no autenticado

### Componente: `ChatwootForm`

**Características**:

- ✅ Carga configuración existente al montar
- ✅ Usa `useTransition` para operaciones asíncronas
- ✅ Muestra feedback visual (loading, success, error)
- ✅ Toast notifications con `sonner`
- ✅ Validación de campos en frontend
- ✅ Badge de estado de conexión
- ✅ Botón toggle para mostrar/ocultar token
- ✅ Placeholder para token guardado

---

## 🧪 Pruebas Recomendadas

### 1. **Prueba de Conexión Exitosa**
- Ingresa credenciales válidas de Chatwoot
- Verifica que aparece mensaje de éxito
- Verifica que el badge cambia a "Conectado"
- Verifica en la base de datos que la config se guardó

### 2. **Prueba de Token Inválido**
- Ingresa un token incorrecto
- Verifica que aparece error "Token de API inválido"
- Verifica que el badge permanece en "Desconectado"

### 3. **Prueba de URL Incorrecta**
- Ingresa una URL que no existe
- Verifica que aparece error de conexión

### 4. **Prueba de Permisos**
- Crea un usuario con rol `member`
- Intenta guardar la configuración
- Verifica que aparece error de permisos

### 5. **Prueba de Carga de Config Existente**
- Guarda una configuración válida
- Recarga la página
- Verifica que los campos se pre-llenan con los valores guardados
- Verifica que el token aparece como `••••••••••••••••••••`

---

## 📚 Recursos y Documentación

### Supabase
- [Docs oficiales](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Server-Side Auth con Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

### Chatwoot
- [API Documentation](https://www.chatwoot.com/developers/api/)
- [Authentication](https://www.chatwoot.com/developers/api/#authentication)
- [Profile Endpoint](https://www.chatwoot.com/developers/api/#tag/Profile)

### Next.js
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [useTransition Hook](https://react.dev/reference/react/useTransition)

---

## 🐛 Troubleshooting

### Error: "No autenticado"
**Causa**: No hay usuario logueado  
**Solución**: Implementa el flujo de autenticación completo

### Error: "Perfil no encontrado"
**Causa**: No existe un perfil vinculado al usuario  
**Solución**: Crea manualmente un registro en la tabla `profiles`

### Error: "Permisos insuficientes"
**Causa**: El usuario tiene rol `member`  
**Solución**: Cambia el rol a `admin` o `owner` en la tabla `profiles`

### Error: "Tiempo de espera agotado"
**Causa**: No se puede conectar con Chatwoot  
**Solución**: Verifica la URL base y tu conexión a internet

### Las políticas RLS bloquean queries
**Causa**: No hay función `auth.uid()` en el contexto  
**Solución**: Asegúrate de usar el cliente de Supabase con autenticación

---

## ✅ Checklist de Verificación

- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Migración ejecutada en Supabase
- [ ] Tablas creadas y visibles en Dashboard
- [ ] Organización creada en la base de datos
- [ ] Perfil de usuario creado y vinculado
- [ ] Servidor de desarrollo corriendo
- [ ] Formulario de Chatwoot carga correctamente
- [ ] Configuración de Chatwoot se guarda exitosamente
- [ ] Badge muestra estado "Conectado" después de guardar
- [ ] Toast notifications funcionan correctamente

---

## 🎉 Próximos Pasos (Fase 3)

Una vez completada esta fase, estarás listo para:

1. **Autenticación completa**
   - Implementar login/registro con Supabase Auth
   - Middleware para proteger rutas
   - Manejo de sesiones

2. **Migración de datos mock**
   - Importar clientes desde `lib/data.ts` a la base de datos
   - Importar terminales desde datos mock

3. **Integración completa con Chatwoot**
   - Crear contactos automáticamente
   - Sincronizar etiquetas con estados
   - Webhooks para eventos de Chatwoot

4. **Sistema de campañas**
   - Crear campañas de WhatsApp/SMS
   - Procesador de cola de mensajes
   - Estadísticas y reportes

---

**¿Preguntas o problemas?** Revisa la sección de Troubleshooting o consulta la documentación oficial de Supabase y Chatwoot.
