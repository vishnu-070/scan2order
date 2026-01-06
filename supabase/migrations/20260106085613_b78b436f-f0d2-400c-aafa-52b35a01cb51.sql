-- Remove the legacy overly permissive policy that still exists
DROP POLICY IF EXISTS "Public can view their own orders by table" ON orders;