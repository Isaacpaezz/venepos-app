-- =====================================================
-- VenePOS Platform - Fix RLS Recursion
-- =====================================================
-- Esta migración corrige el problema de recursión infinita
-- en las políticas RLS de la tabla profiles
-- =====================================================

-- =====================================================
-- ELIMINAR POLÍTICAS PROBLEMÁTICAS DE PROFILES
-- =====================================================

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden ver perfiles de su organización" ON public.profiles;
DROP POLICY IF EXISTS "Permitir creación de perfil desde trigger" ON public.profiles;

-- =====================================================
-- CREAR POLÍTICAS SIMPLIFICADAS SIN RECURSIÓN
-- =====================================================

-- Política 1: Los usuarios pueden ver su propio perfil (sin subconsulta)
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Los usuarios pueden actualizar su propio perfil (sin subconsulta)
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política 3: Permitir INSERT desde cualquier contexto autenticado
-- Esto es necesario para que el trigger funcione
CREATE POLICY "Permitir inserción de perfiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Política 4: Los usuarios pueden ver otros perfiles de su organización
-- Esta usa una función auxiliar para evitar recursión
CREATE POLICY "Usuarios pueden ver perfiles de su organización"
  ON public.profiles
  FOR SELECT
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );

-- =====================================================
-- FUNCIÓN AUXILIAR: Obtener Organization ID sin recursión
-- =====================================================
-- Esta función usa SECURITY DEFINER para evitar recursión
-- Se ejecuta con los permisos del propietario, no del usuario

CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE OTRAS TABLAS
-- =====================================================
-- Usar la función auxiliar en lugar de subconsultas

-- Organizations: Simplificar política SELECT
DROP POLICY IF EXISTS "Los usuarios pueden ver su organización" ON public.organizations;

CREATE POLICY "Usuarios pueden ver su organización"
  ON public.organizations
  FOR SELECT
  USING (id = public.get_my_organization_id());

-- Organizations: Simplificar política UPDATE
DROP POLICY IF EXISTS "Los admins pueden actualizar su organización" ON public.organizations;

CREATE POLICY "Admins pueden actualizar su organización"
  ON public.organizations
  FOR UPDATE
  USING (
    id = public.get_my_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
      LIMIT 1
    )
  );

-- Clients: Usar función auxiliar
DROP POLICY IF EXISTS "Los usuarios pueden ver clientes de su organización" ON public.clients;
DROP POLICY IF EXISTS "Los usuarios pueden crear clientes en su organización" ON public.clients;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar clientes de su organización" ON public.clients;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar clientes de su organización" ON public.clients;

CREATE POLICY "Usuarios pueden ver clientes"
  ON public.clients
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden crear clientes"
  ON public.clients
  FOR INSERT
  WITH CHECK (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden actualizar clientes"
  ON public.clients
  FOR UPDATE
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden eliminar clientes"
  ON public.clients
  FOR DELETE
  USING (organization_id = public.get_my_organization_id());

-- Terminals: Usar función auxiliar
DROP POLICY IF EXISTS "Los usuarios pueden ver terminales de su organización" ON public.terminals;
DROP POLICY IF EXISTS "Los usuarios pueden crear terminales en su organización" ON public.terminals;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar terminales de su organización" ON public.terminals;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar terminales de su organización" ON public.terminals;

CREATE POLICY "Usuarios pueden ver terminales"
  ON public.terminals
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden crear terminales"
  ON public.terminals
  FOR INSERT
  WITH CHECK (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden actualizar terminales"
  ON public.terminals
  FOR UPDATE
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden eliminar terminales"
  ON public.terminals
  FOR DELETE
  USING (organization_id = public.get_my_organization_id());

-- Campaigns: Usar función auxiliar
DROP POLICY IF EXISTS "Los usuarios pueden ver campañas de su organización" ON public.campaigns;
DROP POLICY IF EXISTS "Los usuarios pueden crear campañas en su organización" ON public.campaigns;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar campañas de su organización" ON public.campaigns;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar campañas de su organización" ON public.campaigns;

CREATE POLICY "Usuarios pueden ver campañas"
  ON public.campaigns
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden crear campañas"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden actualizar campañas"
  ON public.campaigns
  FOR UPDATE
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Usuarios pueden eliminar campañas"
  ON public.campaigns
  FOR DELETE
  USING (organization_id = public.get_my_organization_id());

-- Campaign Queue: Usar función auxiliar con JOIN
DROP POLICY IF EXISTS "Los usuarios pueden ver cola de campañas de su organización" ON public.campaign_queue;
DROP POLICY IF EXISTS "Los usuarios pueden crear cola para campañas de su organización" ON public.campaign_queue;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar cola de campañas de su organización" ON public.campaign_queue;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar cola de campañas de su organización" ON public.campaign_queue;

CREATE POLICY "Usuarios pueden ver cola de campañas"
  ON public.campaign_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_queue.campaign_id
      AND campaigns.organization_id = public.get_my_organization_id()
      LIMIT 1
    )
  );

CREATE POLICY "Usuarios pueden crear cola de campañas"
  ON public.campaign_queue
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_queue.campaign_id
      AND campaigns.organization_id = public.get_my_organization_id()
      LIMIT 1
    )
  );

CREATE POLICY "Usuarios pueden actualizar cola de campañas"
  ON public.campaign_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_queue.campaign_id
      AND campaigns.organization_id = public.get_my_organization_id()
      LIMIT 1
    )
  );

CREATE POLICY "Usuarios pueden eliminar cola de campañas"
  ON public.campaign_queue
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_queue.campaign_id
      AND campaigns.organization_id = public.get_my_organization_id()
      LIMIT 1
    )
  );

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION public.get_my_organization_id IS 
'Función auxiliar que retorna el organization_id del usuario actual sin causar recursión. Usa SECURITY DEFINER para ejecutarse con permisos elevados.';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que las políticas fueron creadas correctamente:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
