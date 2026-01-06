-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'cancelled');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');

-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create menu_categories table
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tables (restaurant tables)
CREATE TABLE public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, table_number)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE UNIQUE,
  status public.subscription_status NOT NULL DEFAULT 'trial',
  plan_name TEXT NOT NULL DEFAULT 'Basic',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Restaurant RLS policies
CREATE POLICY "Restaurant owners can view their restaurants"
  ON public.restaurants FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can update their restaurants"
  ON public.restaurants FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can insert their restaurants"
  ON public.restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Master admins can view all restaurants"
  ON public.restaurants FOR SELECT
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can update all restaurants"
  ON public.restaurants FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

-- Public read access for active restaurants (for customer menu)
CREATE POLICY "Public can view active restaurants"
  ON public.restaurants FOR SELECT
  USING (is_active = true);

-- Menu Categories RLS
CREATE POLICY "Restaurant owners can manage categories"
  ON public.menu_categories FOR ALL
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Master admins can manage all categories"
  ON public.menu_categories FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Public can view categories of active restaurants"
  ON public.menu_categories FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE is_active = true) AND is_active = true);

-- Menu Items RLS
CREATE POLICY "Restaurant owners can manage menu items"
  ON public.menu_items FOR ALL
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Master admins can manage all menu items"
  ON public.menu_items FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Public can view available menu items"
  ON public.menu_items FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE is_active = true) AND is_available = true);

-- Restaurant Tables RLS
CREATE POLICY "Restaurant owners can manage tables"
  ON public.restaurant_tables FOR ALL
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Master admins can manage all tables"
  ON public.restaurant_tables FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Public can view active tables"
  ON public.restaurant_tables FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE is_active = true) AND is_active = true);

-- Orders RLS
CREATE POLICY "Restaurant owners can view their orders"
  ON public.orders FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Restaurant owners can update their orders"
  ON public.orders FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Master admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Public can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE is_active = true));

CREATE POLICY "Public can view their own orders by table"
  ON public.orders FOR SELECT
  USING (true);

-- Order Items RLS
CREATE POLICY "Restaurant owners can view order items"
  ON public.order_items FOR SELECT
  USING (order_id IN (
    SELECT o.id FROM public.orders o 
    JOIN public.restaurants r ON o.restaurant_id = r.id 
    WHERE r.owner_id = auth.uid()
  ));

CREATE POLICY "Master admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Public can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view order items"
  ON public.order_items FOR SELECT
  USING (true);

-- Subscriptions RLS
CREATE POLICY "Restaurant owners can view their subscription"
  ON public.subscriptions FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Master admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

-- Create update triggers for all tables
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;