-- =====================================================
-- VERIFICAR CONFIGURACIÓN DE CHATWOOT
-- =====================================================

-- Ver todas las organizaciones y su configuración actual
SELECT 
  id,
  name,
  chatwoot_account_id,
  chatwoot_base_url,
  chatwoot_inbox_id,
  CASE 
    WHEN chatwoot_api_token IS NOT NULL THEN '✅ Configurado'
    ELSE '❌ No configurado'
  END as api_token_status
FROM organizations;

-- =====================================================
-- ACTUALIZAR chatwoot_account_id SI ESTÁ VACÍO
-- =====================================================

-- INSTRUCCIONES:
-- 1. Ejecuta el SELECT de arriba primero
-- 2. Si chatwoot_account_id es NULL, ejecuta el UPDATE de abajo
-- 3. Reemplaza 'TU-ORGANIZATION-ID' con el ID real de tu organización

/*
UPDATE organizations 
SET chatwoot_account_id = '1'
WHERE id = 'TU-ORGANIZATION-ID';
*/

-- =====================================================
-- VERIFICAR DESPUÉS DEL UPDATE
-- =====================================================

-- Verifica que ahora esté configurado
SELECT 
  id,
  name,
  chatwoot_account_id,
  chatwoot_inbox_id,
  CASE 
    WHEN chatwoot_account_id = '1' THEN '✅ Correcto'
    WHEN chatwoot_account_id IS NULL THEN '❌ NULL - Necesita UPDATE'
    ELSE '⚠️ Valor: ' || chatwoot_account_id
  END as account_id_status
FROM organizations;
