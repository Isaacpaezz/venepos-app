-- =====================================================
-- VenePOS Platform - Remove Recursive Policy
-- =====================================================
-- Elimina la política que todavía causa recursión infinita
-- La política "Usuarios pueden ver perfiles de su organización"
-- está causando problemas al verificar el perfil después del registro
-- =====================================================

-- Eliminar la política problemática que tiene subconsulta a profiles
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles de su organización" ON public.profiles;

-- No recrearla por ahora
-- Los usuarios solo podrán ver su propio perfil con la política:
-- "Usuarios pueden ver su propio perfil" que usa (auth.uid() = id)

-- Esto es suficiente para el registro y login
-- Más adelante, si necesitamos que vean perfiles de su org,
-- usaremos una estrategia diferente sin subconsultas

-- =====================================================
-- VERIFICAR POLÍTICAS ACTUALES DE PROFILES
-- =====================================================
-- Las políticas activas ahora son:
-- 1. "Usuarios pueden ver su propio perfil" - SELECT con auth.uid() = id
-- 2. "Usuarios pueden actualizar su propio perfil" - UPDATE con auth.uid() = id  
-- 3. "Permitir inserción de perfiles" - INSERT con true (para el trigger)

-- =====================================================
-- COMENTARIO
-- =====================================================
COMMENT ON TABLE public.profiles IS 
'Perfiles de usuarios. RLS simplificado: los usuarios solo pueden ver/editar su propio perfil. La política para ver perfiles de la organización fue removida temporalmente para evitar recursión.';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
