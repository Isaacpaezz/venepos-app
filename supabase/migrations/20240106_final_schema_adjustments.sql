-- =====================================================
-- VenePOS Platform - Final Schema Adjustments
-- =====================================================
-- Ajusta las tablas clients y terminals para soportar
-- el formato definitivo del Template Maestro
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPOS A TABLA clients
-- =====================================================

-- Persona de contacto
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS persona_contacto TEXT;

-- Banco (ya existe, pero asegurar que esté)
-- ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS banco TEXT; (ya existe)

-- Categoría del comercio
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Ubicación como JSON (región, estado, ciudad, sector)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS ubicacion_json JSONB;

-- Dirección (ya existe, pero asegurar que esté)
-- ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS direccion TEXT; (ya existe)

-- =====================================================
-- 2. AGREGAR CAMPOS A TABLA terminals
-- =====================================================

-- Rango textual (ej: 'SIN TX EN EL MES ACTUAL', '30 DIAS SIN TX')
ALTER TABLE public.terminals
ADD COLUMN IF NOT EXISTS rango TEXT;

-- Datos técnicos como JSON (marca, modelo, serial, operadora, estado_pos)
ALTER TABLE public.terminals
ADD COLUMN IF NOT EXISTS datos_tecnicos_json JSONB;

-- Hacer dias_sin_tx nullable (se usará principalmente rango)
ALTER TABLE public.terminals
ALTER COLUMN dias_sin_tx DROP NOT NULL,
ALTER COLUMN dias_sin_tx SET DEFAULT NULL;

-- =====================================================
-- 3. ÍNDICES PARA NUEVOS CAMPOS
-- =====================================================

-- Índice para búsquedas por banco
CREATE INDEX IF NOT EXISTS idx_clients_banco ON public.clients(banco);

-- Índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_clients_categoria ON public.clients(categoria);

-- Índice para búsquedas por rango de terminal
CREATE INDEX IF NOT EXISTS idx_terminals_rango ON public.terminals(rango);

-- Índice GIN para búsquedas en JSONB de ubicación
CREATE INDEX IF NOT EXISTS idx_clients_ubicacion_json ON public.clients USING GIN (ubicacion_json);

-- Índice GIN para búsquedas en JSONB de datos técnicos
CREATE INDEX IF NOT EXISTS idx_terminals_datos_tecnicos_json ON public.terminals USING GIN (datos_tecnicos_json);

-- =====================================================
-- 4. COMENTARIOS
-- =====================================================

COMMENT ON COLUMN public.clients.persona_contacto IS 
'Nombre de la persona de contacto en el comercio';

COMMENT ON COLUMN public.clients.categoria IS 
'Categoría del comercio (ej: Restaurante, Tienda, etc.)';

COMMENT ON COLUMN public.clients.ubicacion_json IS 
'JSON con estructura: {region, estado, ciudad, sector}';

COMMENT ON COLUMN public.terminals.rango IS 
'Rango textual de inactividad (ej: SIN TX EN EL MES ACTUAL, 30 DIAS SIN TX, > 60 DIAS SIN TX)';

COMMENT ON COLUMN public.terminals.datos_tecnicos_json IS 
'JSON con estructura: {marca, modelo, serial, operadora, estado_pos}';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
