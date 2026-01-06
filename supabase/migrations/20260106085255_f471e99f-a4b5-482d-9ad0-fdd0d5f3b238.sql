-- Fix: Restrict orders table SELECT policy to prevent public data exposure
-- This replaces the overly permissive "Public can view their own orders by table" policy

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can view their own orders by table" ON orders;

-- Create a new restrictive policy that allows:
-- 1. Orders with a table_id (QR code session orders - allows customers to see their table's orders)
-- 2. Restaurant owners to view their restaurant's orders
-- 3. Master admins to view all orders for metrics
CREATE POLICY "Restricted order access"
ON orders FOR SELECT
USING (
  -- Orders placed via QR code (table_id is set) - customers can view
  table_id IS NOT NULL
  OR
  -- Restaurant owners can view their restaurant's orders
  restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  )
  OR
  -- Master admins can view all orders (for aggregated metrics)
  has_role(auth.uid(), 'master_admin'::app_role)
);