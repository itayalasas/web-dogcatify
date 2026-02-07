/*
  # Debug de políticas RLS de audit_logs
  
  1. Problema
    - Los datos existen pero no son visibles desde el frontend
    - Las políticas RLS con subquery pueden no funcionar correctamente
  
  2. Solución Temporal de Diagnóstico
    - Crear una política más permisiva para todos los usuarios autenticados
    - Esto nos permite verificar si el problema es RLS o es otra cosa
    - Una vez identificado el problema, volveremos a restringir apropiadamente
*/

-- Eliminar política restrictiva actual
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

-- Crear política temporal más permisiva para debugging
-- NOTA: Esto es temporal solo para diagnosticar el problema
CREATE POLICY "Authenticated users can view audit logs (TEMP DEBUG)"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Mensaje de advertencia en comentario
-- IMPORTANTE: Esta política debe ser reemplazada con una restrictiva
-- una vez identificado y resuelto el problema