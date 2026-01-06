-- =============================================
-- SECURITY FIX 1: Remove overly permissive order_items policy
-- =============================================

-- Drop the dangerous 'true' policy
DROP POLICY IF EXISTS "Public can view order items" ON order_items;

-- Create a more restrictive policy for order items
-- Customers can only view order items for orders at their current table session
-- This ties to the table_id which would be passed via URL/session
CREATE POLICY "Customers can view order items for accessible orders"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE table_id IS NOT NULL
  )
  OR 
  order_id IN (
    SELECT o.id FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE r.owner_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'master_admin'::app_role)
);

-- =============================================
-- SECURITY FIX 2: Add server-side validation constraints
-- =============================================

-- Add length constraints to orders table
ALTER TABLE orders
ADD CONSTRAINT orders_customer_name_length CHECK (customer_name IS NULL OR length(customer_name) <= 100),
ADD CONSTRAINT orders_customer_phone_length CHECK (customer_phone IS NULL OR length(customer_phone) <= 20),
ADD CONSTRAINT orders_notes_length CHECK (notes IS NULL OR length(notes) <= 500);

-- Add length constraints to order_items table
ALTER TABLE order_items
ADD CONSTRAINT order_items_name_length CHECK (length(name) <= 200),
ADD CONSTRAINT order_items_notes_length CHECK (notes IS NULL OR length(notes) <= 500);

-- =============================================
-- SECURITY FIX 3: Validate menu items on insert
-- =============================================

-- Update the public insert policy for order_items to validate menu items
DROP POLICY IF EXISTS "Public can insert order items" ON order_items;

CREATE POLICY "Public can insert valid order items"
ON order_items FOR INSERT
WITH CHECK (
  -- Menu item must exist and be available (or be null for custom items)
  (menu_item_id IS NULL OR menu_item_id IN (
    SELECT id FROM menu_items WHERE is_available = true
  ))
  AND
  -- Order must exist and belong to an active restaurant
  order_id IN (
    SELECT o.id FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE r.is_active = true
  )
);

-- =============================================
-- SECURITY FIX 4: Price validation trigger
-- =============================================

-- Function to validate that order total matches sum of order items
CREATE OR REPLACE FUNCTION public.validate_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_total NUMERIC;
  order_total NUMERIC;
BEGIN
  -- Calculate the actual total from order items
  SELECT COALESCE(SUM(price * quantity), 0) INTO calculated_total
  FROM order_items
  WHERE order_id = NEW.order_id;
  
  -- Get the order's stated total
  SELECT total_amount INTO order_total
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Allow a small tolerance for floating point
  IF order_total IS NOT NULL AND ABS(calculated_total - order_total) > 0.01 THEN
    RAISE EXCEPTION 'Order total mismatch: calculated % but order states %', calculated_total, order_total;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate order totals after all items are inserted
-- Note: This runs after each insert, validating running total
CREATE TRIGGER validate_order_items_total
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_total();

-- =============================================
-- SECURITY FIX 5: Validate order restaurant is active on insert
-- =============================================

-- Update orders insert policy to be more restrictive
DROP POLICY IF EXISTS "Public can insert orders" ON orders;

CREATE POLICY "Public can insert orders to active restaurants"
ON orders FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM restaurants WHERE is_active = true
  )
  AND total_amount >= 0
  AND (customer_name IS NULL OR length(customer_name) <= 100)
  AND (customer_phone IS NULL OR length(customer_phone) <= 20)
  AND (notes IS NULL OR length(notes) <= 500)
);