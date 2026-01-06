-- Create the function to deduct platform fee (if not exists, recreate)
CREATE OR REPLACE FUNCTION public.deduct_platform_fee_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert a platform fee transaction of -5 rupees
  INSERT INTO public.balance_transactions (
    restaurant_id,
    amount,
    transaction_type,
    description,
    created_by
  ) VALUES (
    NEW.restaurant_id,
    -5,
    'platform_fee',
    'Platform fee for order ' || NEW.id::text,
    NULL
  );
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on orders table
DROP TRIGGER IF EXISTS trigger_deduct_platform_fee ON public.orders;
CREATE TRIGGER trigger_deduct_platform_fee
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_platform_fee_on_order();

-- Update the order insert policy to check if balance - 5 >= 0 (not just balance >= 500)
DROP POLICY IF EXISTS "Public can insert orders to active restaurants with balance" ON public.orders;
CREATE POLICY "Public can insert orders to active restaurants with balance" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (restaurant_id IN ( 
    SELECT r.id
    FROM restaurants r
    JOIN restaurant_balances rb ON (r.id = rb.restaurant_id)
    WHERE (r.is_active = true) AND (rb.balance >= 5)
  )) 
  AND (total_amount > 0) 
  AND ((customer_name IS NULL) OR (length(customer_name) <= 100)) 
  AND ((customer_phone IS NULL) OR (length(customer_phone) <= 20)) 
  AND ((notes IS NULL) OR (length(notes) <= 500))
);

-- Update the can_restaurant_accept_orders function to check balance >= 5
CREATE OR REPLACE FUNCTION public.can_restaurant_accept_orders(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM restaurant_balances rb
    JOIN restaurants r ON r.id = rb.restaurant_id
    WHERE rb.restaurant_id = p_restaurant_id
      AND r.is_active = true
      AND rb.balance >= 5
  )
$function$;

-- Update the slug version as well
CREATE OR REPLACE FUNCTION public.can_restaurant_accept_orders_by_slug(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM restaurant_balances rb
    JOIN restaurants r ON r.id = rb.restaurant_id
    WHERE r.slug = p_slug
      AND r.is_active = true
      AND rb.balance >= 5
  )
$function$;