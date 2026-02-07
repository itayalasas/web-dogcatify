/*
  # Eliminar todas las políticas recursivas de profiles
  
  1. Problema
    - Las políticas de admin que consultan profiles desde policies de profiles causan recursión
    - "Admins can update all profiles" y "Admins can delete profiles" tienen el mismo problema
  
  2. Solución
    - Eliminar estas políticas problemáticas
    - La política "Enable read access for all users" ya permite SELECT a todos
    - Los usuarios pueden actualizar sus propios perfiles con las políticas existentes
*/

-- Eliminar políticas de admin que causan recursión
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
