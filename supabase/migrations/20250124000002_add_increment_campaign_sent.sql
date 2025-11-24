-- =====================================================
-- FUNCIÓN: Incrementar contador de mensajes enviados
-- =====================================================
-- Esta función se llama cada vez que se envía un mensaje
-- para actualizar las estadísticas de la campaña en tiempo real

CREATE OR REPLACE FUNCTION increment_campaign_sent(campaign_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaigns
  SET 
    enviados = enviados + 1,
    updated_at = NOW()
  WHERE id = campaign_id_param;
END;
$$;

-- Comentario
COMMENT ON FUNCTION increment_campaign_sent IS 
'Incrementa el contador de mensajes enviados de una campaña';
