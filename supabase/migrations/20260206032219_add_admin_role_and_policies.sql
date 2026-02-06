/*
  # Añadir rol de administrador y políticas de seguridad

  1. Cambios en Profiles
    - Añade columna `is_admin` para identificar usuarios administradores
  
  2. Políticas de Seguridad
    - Actualiza políticas RLS en `orders`, `bookings`, `payments`, `partners`, `pets`
    - Permite a administradores (is_admin = true) gestionar todos los registros
    - Mantiene las políticas existentes para usuarios regulares
  
  3. Nota Importante
    - Los administradores podrán ver, crear, actualizar y eliminar cualquier registro
    - Esta es una actualización crítica para la funcionalidad del panel administrativo
*/

-- Añadir columna is_admin a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Actualizar políticas de ORDERS para incluir administradores

-- Eliminar políticas existentes de UPDATE en orders
DROP POLICY IF EXISTS "Partners can update orders for their business" ON orders;

-- Crear nueva política de UPDATE que incluye admins
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
  );

-- Eliminar políticas existentes de DELETE en orders
DROP POLICY IF EXISTS "Partners can delete orders for their business" ON orders;

-- Crear nueva política de DELETE que incluye admins
CREATE POLICY "Partners, customers and admins can delete orders"
  ON orders
  FOR DELETE
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
  );

-- Actualizar políticas de BOOKINGS para incluir administradores

-- Eliminar políticas existentes de UPDATE en bookings
DROP POLICY IF EXISTS "Partners and customers can update their bookings" ON bookings;

-- Crear nueva política de UPDATE que incluye admins
CREATE POLICY "Partners, customers and admins can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM partners 
      WHERE partners.id = bookings.partner_id 
      AND partners.user_id = auth.uid()
    ))
    OR (customer_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    ))
  );

-- Actualizar políticas de PARTNERS para incluir administradores

-- Crear política de UPDATE para admins en partners si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'partners' 
    AND policyname = 'Admins can update all partners'
  ) THEN
    CREATE POLICY "Admins can update all partners"
      ON partners
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Actualizar políticas de PETS para incluir administradores

-- Eliminar política existente de UPDATE en pets si existe
DROP POLICY IF EXISTS "Pet owners can update their pets" ON pets;

-- Crear nueva política de UPDATE que incluye admins
CREATE POLICY "Pet owners and admins can update pets"
  ON pets
  FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    ))
  );

-- Crear política de DELETE para admins en pets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pets' 
    AND policyname = 'Pet owners and admins can delete pets'
  ) THEN
    CREATE POLICY "Pet owners and admins can delete pets"
      ON pets
      FOR DELETE
      TO authenticated
      USING (
        (owner_id = auth.uid())
        OR (EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.is_admin = true
        ))
      );
  END IF;
END $$;

-- Actualizar políticas de PROFILES para incluir administradores

-- Crear política de UPDATE para admins en profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Crear política de DELETE para admins en profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can delete profiles'
  ) THEN
    CREATE POLICY "Admins can delete profiles"
      ON profiles
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Actualizar políticas de PAYMENTS para incluir administradores (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) THEN
    -- Crear política de SELECT para admins
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'payments' 
      AND policyname = 'Admins can view all payments'
    ) THEN
      EXECUTE 'CREATE POLICY "Admins can view all payments"
        ON payments
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
          )
        )';
    END IF;

    -- Crear política de UPDATE para admins
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'payments' 
      AND policyname = 'Admins can update all payments'
    ) THEN
      EXECUTE 'CREATE POLICY "Admins can update all payments"
        ON payments
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
          )
        )';
    END IF;
  END IF;
END $$;
