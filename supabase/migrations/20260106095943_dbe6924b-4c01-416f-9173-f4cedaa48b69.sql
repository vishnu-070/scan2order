-- Create restaurant_balances table for prepaid balance system
CREATE TABLE public.restaurant_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create balance_transactions table to track all balance changes
CREATE TABLE public.balance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('recharge', 'admin_credit', 'order_deduction')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.restaurant_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_balances
CREATE POLICY "Master admins can manage all balances" 
ON public.restaurant_balances 
FOR ALL 
USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Restaurant owners can view their balance" 
ON public.restaurant_balances 
FOR SELECT 
USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view balance for ordering check" 
ON public.restaurant_balances 
FOR SELECT 
USING (restaurant_id IN (SELECT id FROM restaurants WHERE is_active = true));

-- RLS Policies for balance_transactions
CREATE POLICY "Master admins can manage all transactions" 
ON public.balance_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Restaurant owners can view their transactions" 
ON public.balance_transactions 
FOR SELECT 
USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Restaurant owners can insert recharge transactions" 
ON public.balance_transactions 
FOR INSERT 
WITH CHECK (
  restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()) 
  AND transaction_type = 'recharge'
);

-- Trigger to update balance on transaction insert
CREATE OR REPLACE FUNCTION public.update_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure restaurant has a balance record
  INSERT INTO public.restaurant_balances (restaurant_id, balance)
  VALUES (NEW.restaurant_id, 0)
  ON CONFLICT (restaurant_id) DO NOTHING;
  
  -- Update the balance
  UPDATE public.restaurant_balances
  SET balance = balance + NEW.amount, updated_at = now()
  WHERE restaurant_id = NEW.restaurant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_balance_on_transaction
AFTER INSERT ON public.balance_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_balance_on_transaction();

-- Create initial balance records for existing restaurants
INSERT INTO public.restaurant_balances (restaurant_id, balance)
SELECT id, 0 FROM public.restaurants
ON CONFLICT (restaurant_id) DO NOTHING;

-- Update orders RLS to check balance >= 500 before allowing insert
DROP POLICY IF EXISTS "Public can insert orders to active restaurants" ON public.orders;

CREATE POLICY "Public can insert orders to active restaurants with balance" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (restaurant_id IN (
    SELECT r.id FROM restaurants r
    JOIN restaurant_balances rb ON r.id = rb.restaurant_id
    WHERE r.is_active = true AND rb.balance >= 500
  )) 
  AND (total_amount > 0)
  AND ((customer_name IS NULL) OR (length(customer_name) <= 100)) 
  AND ((customer_phone IS NULL) OR (length(customer_phone) <= 20)) 
  AND ((notes IS NULL) OR (length(notes) <= 500))
);

-- Allow customers to cancel their own orders (update status to cancelled)
CREATE POLICY "Customers can cancel pending orders"
ON public.orders
FOR UPDATE
USING (
  table_id IS NOT NULL 
  AND status = 'pending'
)
WITH CHECK (
  status = 'cancelled'
);