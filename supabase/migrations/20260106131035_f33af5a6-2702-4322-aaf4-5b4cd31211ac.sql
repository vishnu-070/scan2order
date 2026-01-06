-- Create function to deduct platform fee on order
CREATE OR REPLACE FUNCTION public.deduct_platform_fee_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create trigger to deduct platform fee when order is placed
DROP TRIGGER IF EXISTS trigger_deduct_platform_fee ON public.orders;
CREATE TRIGGER trigger_deduct_platform_fee
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_platform_fee_on_order();

-- Also ensure the balance update trigger exists
DROP TRIGGER IF EXISTS trigger_update_balance ON public.balance_transactions;
CREATE TRIGGER trigger_update_balance
  AFTER INSERT ON public.balance_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_balance_on_transaction();