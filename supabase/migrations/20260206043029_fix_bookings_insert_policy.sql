/*
  # Fix bookings INSERT policy to allow partners to create bookings

  1. Changes
    - Drop existing INSERT policy that only allows customers
    - Create new INSERT policy that allows:
      - Customers to create their own bookings
      - Partners to create bookings for their services
      - Admins to create any booking
  
  2. Security
    - Customers can only create bookings where they are the customer
    - Partners can only create bookings for services they own
    - Admins can create any booking
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Customers can insert their own bookings" ON bookings;

-- Create new INSERT policy that allows customers, partners, and admins
CREATE POLICY "Customers, partners and admins can insert bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Customer creating their own booking
    (customer_id = auth.uid())
    OR
    -- Partner creating a booking for their service
    (EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = bookings.partner_id
        AND partners.user_id = auth.uid()
    ))
    OR
    -- Admin creating any booking
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    ))
  );
