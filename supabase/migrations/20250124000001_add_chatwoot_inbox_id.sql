-- =====================================================
-- AGREGAR: chatwoot_inbox_id a organizations
-- =====================================================
-- Este campo almacena el ID del inbox de WhatsApp en Chatwoot
-- que se usará para crear conversaciones

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS chatwoot_inbox_id TEXT;

-- Comentario
COMMENT ON COLUMN organizations.chatwoot_inbox_id IS 
'ID del inbox de WhatsApp/SMS en Chatwoot para crear conversaciones';
