-- =====================================================
-- CREAR TABLA DE LOGS DE AUDITORÍA
-- =====================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- para crear la tabla audit_logs necesaria para el
-- sistema de auditoría.
-- =====================================================

-- Crear la tabla audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para que administradores vean todos los logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Política para que usuarios autenticados inserten logs
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir insertar logs de login fallidos sin autenticación
CREATE POLICY "Anonymous users can insert login failure logs"
  ON audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    action IN ('LOGIN_FAILED', 'LOGIN_ERROR', 'LOGIN_ATTEMPT')
  );

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
-- 1. Copiar todo el contenido de este archivo
-- 2. Ir a Supabase Dashboard > SQL Editor
-- 3. Pegar el contenido en el editor
-- 4. Hacer clic en "Run" para ejecutar el script
-- =====================================================
