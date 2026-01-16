-- Fix transaction_type check constraint to include 'platform_fee'

-- First, drop the existing constraint.
-- Note: PostgreSQL usually names check constraints as table_column_check.
ALTER TABLE public.balance_transactions
DROP CONSTRAINT IF EXISTS balance_transactions_transaction_type_check;

-- Add the updated constraint including 'platform_fee'
ALTER TABLE public.balance_transactions
ADD CONSTRAINT balance_transactions_transaction_type_check
CHECK (transaction_type IN ('recharge', 'admin_credit', 'order_deduction', 'platform_fee'));
