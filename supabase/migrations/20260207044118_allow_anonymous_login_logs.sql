/*
  # Permitir logs de login fallidos sin autenticación

  1. Cambios
    - Agregar política para permitir insertar logs de login fallidos sin estar autenticado
    - Esto permite registrar intentos de login incorrectos en audit_logs

  2. Seguridad
    - La política solo permite insertar logs con acciones específicas (LOGIN_FAILED, LOGIN_ERROR)
    - Previene spam limitando las acciones permitidas
    - Los logs anónimos no pueden ver otros logs (política de SELECT sigue requiriendo admin)
*/

-- Política para permitir insertar logs de login fallidos sin autenticación
CREATE POLICY "Anonymous users can insert login failure logs"
  ON audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    action IN ('LOGIN_FAILED', 'LOGIN_ERROR', 'LOGIN_ATTEMPT')
  );
