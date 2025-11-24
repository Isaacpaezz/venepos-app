-- =====================================================
-- MIGRACIÓN: Soporte para Webhooks de Chatwoot
-- =====================================================
-- Esta migración agrega los campos necesarios para recibir
-- y procesar webhooks de Chatwoot, permitiendo rastrear
-- respuestas de clientes y eventos de conversaciones.

-- =====================================================
-- 1. CAMPAIGN_QUEUE: Agregar campos para webhook tracking
-- =====================================================

-- Agregar columna para almacenar ID de conversación en Chatwoot
ALTER TABLE campaign_queue
ADD COLUMN IF NOT EXISTS chatwoot_conversation_id INTEGER;

-- Agregar columna para rastrear si el cliente respondió
ALTER TABLE campaign_queue
ADD COLUMN IF NOT EXISTS has_replied BOOLEAN DEFAULT false;

-- Agregar columna para timestamp de respuesta
ALTER TABLE campaign_queue
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Comentarios
COMMENT ON COLUMN campaign_queue.chatwoot_conversation_id IS 
'ID de la conversación en Chatwoot asociada a este mensaje';

COMMENT ON COLUMN campaign_queue.has_replied IS 
'Indica si el cliente respondió a este mensaje de campaña';

COMMENT ON COLUMN campaign_queue.replied_at IS 
'Fecha y hora en que el cliente respondió por primera vez';

-- =====================================================
-- 2. INTERACTIONS: Tabla para registrar interacciones
-- =====================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  terminal_id TEXT REFERENCES terminals(afipos) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  -- Tipo de interacción
  type TEXT NOT NULL,
  -- Tipos posibles: 'whatsapp_reply', 'email_open', 'email_click', 'sms_reply', 'call', 'visit'
  
  -- Canal de comunicación
  channel TEXT,
  -- Canales: 'whatsapp', 'email', 'sms', 'call', 'in_person'
  
  -- Contenido de la interacción
  content TEXT,
  
  -- Metadata adicional (JSON)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Proveedor externo
  provider TEXT,
  provider_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para búsquedas comunes
  CONSTRAINT valid_interaction_type CHECK (
    type IN (
      'whatsapp_reply',
      'email_open', 
      'email_click',
      'sms_reply',
      'call',
      'visit',
      'conversion',
      'purchase'
    )
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_interactions_organization 
  ON interactions(organization_id);

CREATE INDEX IF NOT EXISTS idx_interactions_client 
  ON interactions(client_id);

CREATE INDEX IF NOT EXISTS idx_interactions_terminal 
  ON interactions(terminal_id);

CREATE INDEX IF NOT EXISTS idx_interactions_campaign 
  ON interactions(campaign_id);

CREATE INDEX IF NOT EXISTS idx_interactions_type 
  ON interactions(type);

CREATE INDEX IF NOT EXISTS idx_interactions_occurred_at 
  ON interactions(occurred_at DESC);

-- Comentarios
COMMENT ON TABLE interactions IS 
'Registra todas las interacciones con clientes a través de diferentes canales';

COMMENT ON COLUMN interactions.type IS 
'Tipo de interacción: whatsapp_reply, email_open, sms_reply, call, visit, etc.';

COMMENT ON COLUMN interactions.channel IS 
'Canal de comunicación: whatsapp, email, sms, call, in_person';

COMMENT ON COLUMN interactions.metadata IS 
'Datos adicionales en formato JSON (ej: mensaje completo, datos del webhook, etc.)';

-- =====================================================
-- 3. TERMINALS: Campo para recovery tracking
-- =====================================================

-- Agregar campos para rastrear recuperación de terminales
ALTER TABLE terminals
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE terminals
ADD COLUMN IF NOT EXISTS recovery_source TEXT;

ALTER TABLE terminals
ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ;

-- Comentarios
COMMENT ON COLUMN terminals.status IS 
'Estado del terminal: active, inactive, recovered, churned';

COMMENT ON COLUMN terminals.recovery_source IS 
'Fuente de recuperación: agent_manual, campaign_auto, direct_contact';

COMMENT ON COLUMN terminals.recovered_at IS 
'Fecha en que el terminal fue marcado como recuperado';

-- Constraint para valores válidos de status
ALTER TABLE terminals
DROP CONSTRAINT IF EXISTS valid_terminal_status;

ALTER TABLE terminals
ADD CONSTRAINT valid_terminal_status CHECK (
  status IN ('active', 'inactive', 'recovered', 'churned')
);

-- =====================================================
-- 4. ÍNDICES ADICIONALES
-- =====================================================

-- Índice para buscar conversaciones por conversation_id
CREATE INDEX IF NOT EXISTS idx_campaign_queue_conversation 
  ON campaign_queue(chatwoot_conversation_id) 
  WHERE chatwoot_conversation_id IS NOT NULL;

-- Índice para buscar mensajes que han sido respondidos
CREATE INDEX IF NOT EXISTS idx_campaign_queue_replied 
  ON campaign_queue(has_replied, campaign_id) 
  WHERE has_replied = true;
