/*
  # Corregir política de actualización de pedidos

  1. Cambios
    - Elimina la política de UPDATE existente que falta WITH CHECK
    - Crea nueva política con USING y WITH CHECK apropiados
    - Asegura que los administradores, partners y clientes puedan actualizar pedidos
  
  2. Seguridad
    - Mantiene las verificaciones de permisos existentes
    - Añade WITH CHECK para validar los cambios
*/

-- Eliminar política existente de UPDATE
DROP POLICY IF EXISTS "Partners and admins can update orders" ON orders;

-- Crear nueva política de UPDATE con USING y WITH CHECK
CREATE POLICY "Partners and admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM partners 
      WHERE partners.id = orders.partner_id 
      AND partners.user_id = auth.uid()
    ))
    OR (customer_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    ))
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM partners 
      WHERE partners.id = orders.partner_id 
      AND partners.user_id = auth.uid()
    ))
    OR (customer_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    ))
  );
