-- =====================================================
-- VenePOS Platform - Migración Inicial
-- =====================================================
-- Esta migración crea el esquema base de la plataforma
-- con soporte para multi-tenancy y Row Level Security (RLS)
-- =====================================================

-- Habilitar extensión para encriptación (opcional para uso futuro)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLA: organizations
-- =====================================================
-- Representa las organizaciones/empresas en la plataforma
-- Incluye configuración de integración con Chatwoot
-- =====================================================

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- Configuración de Chatwoot (nullable al inicio)
  chatwoot_base_url TEXT,
  chatwoot_account_id TEXT,
  chatwoot_api_token TEXT, -- Nota: Considera encriptar este campo en producción
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para organizations
CREATE INDEX idx_organizations_created_at ON public.organizations(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABLA: profiles
-- =====================================================
-- Vincula usuarios de auth.users con organizations
-- Almacena información adicional del perfil del usuario
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Información del perfil
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- member, admin, owner
  avatar_url TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABLA: clients
-- =====================================================
-- Almacena información de los clientes (comercios afiliados)
-- =====================================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Información del cliente
  codigo_afiliado TEXT NOT NULL,
  rif TEXT NOT NULL,
  nombre TEXT NOT NULL,
  persona_contacto TEXT,
  
  -- Contacto
  telefono TEXT, -- Formato E.164 recomendado: +58xxxxxxxxxx
  email TEXT,
  
  -- Ubicación
  direccion TEXT,
  region TEXT,
  estado TEXT,
  ciudad TEXT,
  sector TEXT,
  
  -- Información bancaria y clasificación
  banco TEXT,
  categoria_comercio TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, codigo_afiliado),
  UNIQUE(organization_id, rif)
);

-- Índices para clients
CREATE INDEX idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX idx_clients_codigo_afiliado ON public.clients(codigo_afiliado);
CREATE INDEX idx_clients_rif ON public.clients(rif);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_telefono ON public.clients(telefono);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABLA: terminals
-- =====================================================
-- Almacena información de las terminales POS
-- =====================================================

CREATE TABLE public.terminals (
  afipos TEXT PRIMARY KEY, -- Identificador único de la terminal
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Información de la terminal
  numpos TEXT NOT NULL,
  dias_sin_tx INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, maintenance, blocked
  recovery_source TEXT, -- whatsapp, email, phone, field_visit
  
  -- Información adicional
  modelo TEXT,
  serial TEXT,
  ultima_transaccion TIMESTAMPTZ,
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para terminals
CREATE INDEX idx_terminals_organization_id ON public.terminals(organization_id);
CREATE INDEX idx_terminals_client_id ON public.terminals(client_id);
CREATE INDEX idx_terminals_status ON public.terminals(status);
CREATE INDEX idx_terminals_dias_sin_tx ON public.terminals(dias_sin_tx);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_terminals_updated_at
  BEFORE UPDATE ON public.terminals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABLA: campaigns
-- =====================================================
-- Almacena las campañas de mensajería masiva
-- =====================================================

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Información de la campaña
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- sms, whatsapp, email
  mensaje TEXT NOT NULL,
  
  -- Segmentación
  filtros JSONB, -- Almacena los filtros aplicados (región, días sin tx, etc.)
  total_destinatarios INTEGER DEFAULT 0,
  
  -- Estado de la campaña
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, completed, failed
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Estadísticas
  enviados INTEGER DEFAULT 0,
  entregados INTEGER DEFAULT 0,
  fallidos INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para campaigns
CREATE INDEX idx_campaigns_organization_id ON public.campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_tipo ON public.campaigns(tipo);
CREATE INDEX idx_campaigns_scheduled_at ON public.campaigns(scheduled_at);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABLA: campaign_queue
-- =====================================================
-- Cola de envíos individuales de una campaña
-- Permite tracking detallado y reintento de envíos fallidos
-- =====================================================

CREATE TABLE public.campaign_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Información del envío
  destinatario TEXT NOT NULL, -- Teléfono o email según tipo de campaña
  mensaje_personalizado TEXT, -- Si el mensaje fue personalizado con variables
  
  -- Estado del envío
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sending, sent, delivered, failed
  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  
  -- Respuesta del proveedor
  provider_id TEXT, -- ID del mensaje en el proveedor (Twilio, etc.)
  provider_status TEXT,
  error_message TEXT,
  
  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para campaign_queue
CREATE INDEX idx_campaign_queue_campaign_id ON public.campaign_queue(campaign_id);
CREATE INDEX idx_campaign_queue_client_id ON public.campaign_queue(client_id);
CREATE INDEX idx_campaign_queue_status ON public.campaign_queue(status);
CREATE INDEX idx_campaign_queue_scheduled_at ON public.campaign_queue(scheduled_at);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_campaign_queue_updated_at
  BEFORE UPDATE ON public.campaign_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Implementa seguridad a nivel de fila para multi-tenancy
-- Los usuarios solo pueden ver/modificar datos de su organización
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_queue ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: profiles
-- =====================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Los usuarios pueden ver perfiles de su misma organización
CREATE POLICY "Los usuarios pueden ver perfiles de su organización"
  ON public.profiles
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: organizations
-- =====================================================

-- Los usuarios pueden ver su organización
CREATE POLICY "Los usuarios pueden ver su organización"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los admins y owners pueden actualizar su organización
CREATE POLICY "Los admins pueden actualizar su organización"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- POLÍTICAS RLS: clients
-- =====================================================

-- Los usuarios pueden ver clientes de su organización
CREATE POLICY "Los usuarios pueden ver clientes de su organización"
  ON public.clients
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden crear clientes en su organización
CREATE POLICY "Los usuarios pueden crear clientes en su organización"
  ON public.clients
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar clientes de su organización
CREATE POLICY "Los usuarios pueden actualizar clientes de su organización"
  ON public.clients
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar clientes de su organización
CREATE POLICY "Los usuarios pueden eliminar clientes de su organización"
  ON public.clients
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: terminals
-- =====================================================

-- Los usuarios pueden ver terminales de su organización
CREATE POLICY "Los usuarios pueden ver terminales de su organización"
  ON public.terminals
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden crear terminales en su organización
CREATE POLICY "Los usuarios pueden crear terminales en su organización"
  ON public.terminals
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar terminales de su organización
CREATE POLICY "Los usuarios pueden actualizar terminales de su organización"
  ON public.terminals
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar terminales de su organización
CREATE POLICY "Los usuarios pueden eliminar terminales de su organización"
  ON public.terminals
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: campaigns
-- =====================================================

-- Los usuarios pueden ver campañas de su organización
CREATE POLICY "Los usuarios pueden ver campañas de su organización"
  ON public.campaigns
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden crear campañas en su organización
CREATE POLICY "Los usuarios pueden crear campañas en su organización"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar campañas de su organización
CREATE POLICY "Los usuarios pueden actualizar campañas de su organización"
  ON public.campaigns
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar campañas de su organización
CREATE POLICY "Los usuarios pueden eliminar campañas de su organización"
  ON public.campaigns
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: campaign_queue
-- =====================================================

-- Los usuarios pueden ver items de cola de campañas de su organización
CREATE POLICY "Los usuarios pueden ver cola de campañas de su organización"
  ON public.campaign_queue
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Los usuarios pueden crear items en cola para campañas de su organización
CREATE POLICY "Los usuarios pueden crear cola para campañas de su organización"
  ON public.campaign_queue
  FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Los usuarios pueden actualizar items de cola de campañas de su organización
CREATE POLICY "Los usuarios pueden actualizar cola de campañas de su organización"
  ON public.campaign_queue
  FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Los usuarios pueden eliminar items de cola de campañas de su organización
CREATE POLICY "Los usuarios pueden eliminar cola de campañas de su organización"
  ON public.campaign_queue
  FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- FUNCIÓN AUXILIAR: get_user_organization_id
-- =====================================================
-- Función helper para obtener el organization_id del usuario actual
-- Útil para queries y validaciones
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================
-- Documentación para facilitar el mantenimiento
-- =====================================================

COMMENT ON TABLE public.organizations IS 'Organizaciones/empresas en la plataforma con configuración de Chatwoot';
COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios vinculados a auth.users y organizations';
COMMENT ON TABLE public.clients IS 'Clientes/comercios afiliados con información de contacto y ubicación';
COMMENT ON TABLE public.terminals IS 'Terminales POS asignadas a clientes';
COMMENT ON TABLE public.campaigns IS 'Campañas de mensajería masiva (SMS/WhatsApp/Email)';
COMMENT ON TABLE public.campaign_queue IS 'Cola de envíos individuales con tracking detallado';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
