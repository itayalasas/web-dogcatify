/*
  # Corregir recursión infinita en políticas de profiles
  
  1. Problema
    - La política "Admins can view all profiles" causa recursión infinita
    - Al verificar is_admin consulta profiles dentro de la política de profiles
  
  2. Solución
    - Eliminar la política problemática de profiles
    - Los administradores ya pueden ver profiles a través de otras políticas
*/

-- Eliminar la política problemática que causa recursión infinita
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
