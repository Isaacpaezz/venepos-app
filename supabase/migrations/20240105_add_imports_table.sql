-- =====================================================
-- VenePOS Platform - Add Imports Table & Fields
-- =====================================================
-- Agrega tabla para historial de importaciones
-- y campo last_seen_in_import en terminals
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPO last_seen_in_import A TERMINALS
-- =====================================================
ALTER TABLE public.terminals
ADD COLUMN last_seen_in_import TIMESTAMPTZ;

-- Índice para búsquedas de recuperación por sistema
CREATE INDEX idx_terminals_last_seen_in_import ON public.terminals(last_seen_in_import);

-- =====================================================
-- 2. CREAR TABLA imports
-- =====================================================
-- Almacena el historial de importaciones de archivos maestros
-- =====================================================

CREATE TABLE public.imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Información del archivo
  file_name TEXT NOT NULL,
  file_size INTEGER, -- Tamaño en bytes
  
  -- Estadísticas del procesamiento
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  clients_created INTEGER NOT NULL DEFAULT 0,
  clients_updated INTEGER NOT NULL DEFAULT 0,
  terminals_created INTEGER NOT NULL DEFAULT 0,
  terminals_updated INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  
  -- Estado del proceso
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
  error_message TEXT,
  
  -- Usuario que realizó la importación
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Metadatos
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para imports
CREATE INDEX idx_imports_organization_id ON public.imports(organization_id);
CREATE INDEX idx_imports_status ON public.imports(status);
CREATE INDEX idx_imports_imported_by ON public.imports(imported_by);
CREATE INDEX idx_imports_created_at ON public.imports(created_at);

-- =====================================================
-- 3. RLS PARA TABLA imports
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver importaciones de su organización
CREATE POLICY "Usuarios pueden ver importaciones de su organización"
  ON public.imports
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

-- Policy: Usuarios pueden crear importaciones en su organización
CREATE POLICY "Usuarios pueden crear importaciones en su organización"
  ON public.imports
  FOR INSERT
  WITH CHECK (organization_id = public.get_my_organization_id());

-- Policy: Usuarios pueden actualizar sus propias importaciones
CREATE POLICY "Usuarios pueden actualizar sus importaciones"
  ON public.imports
  FOR UPDATE
  USING (organization_id = public.get_my_organization_id());

-- =====================================================
-- 4. COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.imports IS 
'Historial de importaciones de archivos maestros (Excel/CSV). Registra estadísticas y estado de cada importación.';

COMMENT ON COLUMN public.terminals.last_seen_in_import IS 
'Última fecha en que este terminal apareció en una importación. Usado para detectar recuperaciones por sistema.';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
