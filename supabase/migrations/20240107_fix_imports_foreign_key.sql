-- =====================================================
-- VenePOS Platform - Fix Imports Foreign Key
-- =====================================================
-- Corrige la foreign key de imports.imported_by
-- para que apunte a profiles en lugar de auth.users
-- =====================================================

-- 1. Eliminar la constraint existente
ALTER TABLE public.imports
DROP CONSTRAINT IF EXISTS imports_imported_by_fkey;

-- 2. Agregar nueva constraint apuntando a profiles
-- Nota: profiles.id es igual a auth.users.id, se copia automáticamente
ALTER TABLE public.imports
ADD CONSTRAINT imports_imported_by_fkey
FOREIGN KEY (imported_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Comentario
COMMENT ON CONSTRAINT imports_imported_by_fkey ON public.imports IS
'Relación con profiles para obtener información del usuario que realizó la importación';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
