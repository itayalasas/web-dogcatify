/*
  # Add service role INSERT policy for orders table

  1. Changes
    - Drop existing restrictive INSERT policy
    - Add new INSERT policy that allows:
      - Customers to insert their own orders
      - Partners to insert orders for their services
      - Service role (webhooks) to insert any orders
  
  2. Security
    - Maintains customer ownership checks
    - Allows partners to create orders
    - Enables webhooks to create orders automatically
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Customers can insert their own orders" ON orders;

-- Create a more flexible INSERT policy
CREATE POLICY "Allow customers, partners, and service role to insert orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Customer can insert their own orders
    customer_id = auth.uid()
    OR
    -- Partner can insert orders for their services
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = orders.partner_id
      AND partners.user_id = auth.uid()
    )
    OR
    -- Admin can insert any order
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create a permissive policy for service_role (bypasses RLS)
CREATE POLICY "Service role can insert orders"
  ON orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);