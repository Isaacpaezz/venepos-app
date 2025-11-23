-- =====================================================
-- VenePOS Platform - Auth Trigger
-- =====================================================
-- Esta migración crea un trigger que automáticamente
-- genera una organización y un perfil cuando un usuario
-- se registra en el sistema.
-- =====================================================

-- =====================================================
-- FUNCIÓN: handle_new_user
-- =====================================================
-- Esta función se ejecuta automáticamente cuando un nuevo
-- usuario se registra en auth.users
-- 
-- Proceso:
-- 1. Crea una nueva organización con el nombre proporcionado
-- 2. Crea un perfil vinculado al usuario con rol 'owner'
-- 3. Usa los metadatos del usuario (raw_user_meta_data)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  user_full_name TEXT;
BEGIN
  -- Extraer metadatos del usuario
  -- Estos se pasan desde el frontend en signUp({ options: { data: { ... } } })
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    'Mi Empresa'
  );
  
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1) -- Fallback: usar parte del email
  );

  -- =====================================================
  -- PASO 1: Crear la organización
  -- =====================================================
  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;

  -- =====================================================
  -- PASO 2: Crear el perfil del usuario
  -- =====================================================
  INSERT INTO public.profiles (
    id,
    organization_id,
    full_name,
    role,
    avatar_url
  )
  VALUES (
    NEW.id,
    new_org_id,
    user_full_name,
    'owner', -- El primer usuario siempre es owner de la organización
    NEW.raw_user_meta_data->>'avatar_url' -- Opcional
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: on_auth_user_created
-- =====================================================
-- Se ejecuta DESPUÉS de que un usuario se inserta en auth.users
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user IS 
'Función de trigger que automáticamente crea una organización y un perfil cuando un nuevo usuario se registra. Usa los metadatos del usuario (raw_user_meta_data) para personalizar los datos.';

-- =====================================================
-- VERIFICACIÓN DEL TRIGGER
-- =====================================================
-- Query para verificar que el trigger está activo:
-- 
-- SELECT 
--   trigger_name, 
--   event_manipulation, 
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
-- 
-- Resultado esperado:
-- trigger_name         | on_auth_user_created
-- event_manipulation   | INSERT
-- event_object_table   | users
-- action_statement     | EXECUTE FUNCTION public.handle_new_user()
-- =====================================================

-- =====================================================
-- POLÍTICA RLS ADICIONAL PARA PROFILES
-- =====================================================
-- Permite la inserción automática desde el trigger
-- (El trigger se ejecuta con SECURITY DEFINER, pero agregamos esto por seguridad)
-- =====================================================

-- Permitir inserts desde el contexto del sistema (para el trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Permitir creación de perfil desde trigger'
  ) THEN
    CREATE POLICY "Permitir creación de perfil desde trigger"
      ON public.profiles
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
