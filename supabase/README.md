# Supabase - Configuración y Migraciones

## 📋 Requisitos Previos

1. **Variables de entorno configuradas** en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

2. **Supabase CLI instalado** (✅ Ya instalado en tu sistema)

## 🚀 Ejecutar Migración Inicial

Tienes 3 opciones para ejecutar la migración:

### Opción 1: Usar el Dashboard de Supabase (Recomendado)

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido completo de `migrations/20240101_init.sql`
5. Ejecuta la query con el botón **Run**

### Opción 2: Usar el CLI vinculado a tu proyecto

```bash
# 1. Inicializar Supabase en el proyecto (solo primera vez)
supabase init

# 2. Vincular tu proyecto local con el proyecto en la nube
supabase link --project-ref TU_PROJECT_REF

# 3. Ejecutar la migración
supabase db push

# O ejecutar directamente el archivo SQL
supabase db execute --file supabase/migrations/20240101_init.sql
```

### Opción 3: Script automatizado

Ejecuta el script que hemos creado:

```bash
pnpm run migrate
```

## 📊 Esquema de Base de Datos

La migración `20240101_init.sql` crea las siguientes tablas:

### 1. **organizations**
- Organizaciones/empresas en la plataforma
- Incluye configuración de Chatwoot (base_url, account_id, api_token)

### 2. **profiles**
- Perfiles de usuarios vinculados a `auth.users`
- Relaciona usuarios con organizaciones
- Incluye roles (member, admin, owner)

### 3. **clients**
- Clientes/comercios afiliados
- Información de contacto, ubicación y bancaria

### 4. **terminals**
- Terminales POS asignadas a clientes
- Tracking de estado y última transacción

### 5. **campaigns**
- Campañas de mensajería masiva
- Soporte para SMS, WhatsApp y Email

### 6. **campaign_queue**
- Cola de envíos individuales
- Tracking detallado de cada mensaje

## 🔒 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas que garantizan:

- **Multi-tenancy**: Los usuarios solo ven datos de su organización
- **Control de acceso**: Permisos basados en roles (member, admin, owner)
- **Seguridad**: Prevención de acceso no autorizado

## ✅ Verificar Migración

Después de ejecutar la migración, verifica que las tablas se crearon:

1. En el Dashboard de Supabase, ve a **Table Editor**
2. Deberías ver las siguientes tablas:
   - organizations
   - profiles
   - clients
   - terminals
   - campaigns
   - campaign_queue

## 🔧 Problemas Comunes

### Error: "relation already exists"
- La migración ya fue ejecutada. No es necesario ejecutarla nuevamente.

### Error: "permission denied"
- Verifica que estés usando las credenciales correctas del proyecto.
- Asegúrate de tener permisos de administrador.

### Error: "syntax error"
- Verifica que copiaste el SQL completo sin modificaciones.

## 📝 Próximos Pasos

1. **Crear una organización** manualmente en la tabla `organizations`
2. **Crear un perfil** en la tabla `profiles` vinculado a tu usuario de auth
3. **Probar la integración** desde el frontend en `/settings`

## 🔗 Enlaces Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Migraciones](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
