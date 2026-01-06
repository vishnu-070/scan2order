CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'master_admin',
    'restaurant_admin'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'preparing',
    'ready',
    'served',
    'cancelled'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'trial',
    'active',
    'past_due',
    'cancelled'
);


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Assign restaurant_admin role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'restaurant_admin');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url text,
    is_available boolean DEFAULT true NOT NULL,
    is_popular boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    menu_item_id uuid,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    table_id uuid,
    customer_name text,
    customer_phone text,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    is_paid boolean DEFAULT false NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    table_number text NOT NULL,
    capacity integer DEFAULT 4 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    qr_code_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    logo_url text,
    address text,
    phone text,
    email text,
    currency text DEFAULT 'USD'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    status public.subscription_status DEFAULT 'trial'::public.subscription_status NOT NULL,
    plan_name text DEFAULT 'Basic'::text NOT NULL,
    trial_ends_at timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- Name: restaurant_tables restaurant_tables_restaurant_id_table_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_restaurant_id_table_number_key UNIQUE (restaurant_id, table_number);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_slug_key UNIQUE (slug);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_restaurant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_restaurant_id_key UNIQUE (restaurant_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: menu_categories update_menu_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: menu_items update_menu_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: restaurant_tables update_restaurant_tables_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: restaurants update_restaurants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: menu_categories menu_categories_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: orders orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: restaurant_tables restaurant_tables_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: menu_categories Master admins can manage all categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can manage all categories" ON public.menu_categories USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: menu_items Master admins can manage all menu items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can manage all menu items" ON public.menu_items USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: subscriptions Master admins can manage all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can manage all subscriptions" ON public.subscriptions USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: restaurant_tables Master admins can manage all tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can manage all tables" ON public.restaurant_tables USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: user_roles Master admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: restaurants Master admins can update all restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can update all restaurants" ON public.restaurants USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: order_items Master admins can view all order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can view all order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: orders Master admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: profiles Master admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: restaurants Master admins can view all restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can view all restaurants" ON public.restaurants FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: user_roles Master admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Master admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));


--
-- Name: order_items Public can insert order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);


--
-- Name: orders Public can insert orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK ((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.is_active = true))));


--
-- Name: restaurants Public can view active restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active restaurants" ON public.restaurants FOR SELECT USING ((is_active = true));


--
-- Name: restaurant_tables Public can view active tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active tables" ON public.restaurant_tables FOR SELECT USING (((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.is_active = true))) AND (is_active = true)));


--
-- Name: menu_items Public can view available menu items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view available menu items" ON public.menu_items FOR SELECT USING (((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.is_active = true))) AND (is_available = true)));


--
-- Name: menu_categories Public can view categories of active restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view categories of active restaurants" ON public.menu_categories FOR SELECT USING (((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.is_active = true))) AND (is_active = true)));


--
-- Name: order_items Public can view order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view order items" ON public.order_items FOR SELECT USING (true);


--
-- Name: orders Public can view their own orders by table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view their own orders by table" ON public.orders FOR SELECT USING (true);


--
-- Name: restaurants Restaurant owners can insert their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can insert their restaurants" ON public.restaurants FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: menu_categories Restaurant owners can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can manage categories" ON public.menu_categories USING ((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.owner_id = auth.uid()))));


--
-- Name: menu_items Restaurant owners can manage menu items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can manage menu items" ON public.menu_items USING ((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.owner_id = auth.uid()))));


--
-- Name: restaurant_tables Restaurant owners can manage tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can manage tables" ON public.restaurant_tables USING ((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.owner_id = auth.uid()))));


--
-- Name: orders Restaurant owners can update their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can update their orders" ON public.orders FOR UPDATE USING ((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.owner_id = auth.uid()))));


--
-- Name: restaurants Restaurant owners can update their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can update their restaurants" ON public.restaurants FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: order_items Restaurant owners can view order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can view order items" ON public.order_items FOR SELECT USING ((order_id IN ( SELECT o.id
   FROM (public.orders o
     JOIN public.restaurants r ON ((o.restaurant_id = r.id)))
  WHERE (r.owner_id = auth.uid()))));


--
-- Name: orders Restaurant owners can view their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can view their orders" ON public.orders FOR SELECT USING ((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.owner_id = auth.uid()))));


--
-- Name: restaurants Restaurant owners can view their restaurants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can view their restaurants" ON public.restaurants FOR SELECT USING ((auth.uid() = owner_id));


--
-- Name: subscriptions Restaurant owners can view their subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Restaurant owners can view their subscription" ON public.subscriptions FOR SELECT USING ((restaurant_id IN ( SELECT restaurants.id
   FROM public.restaurants
  WHERE (restaurants.owner_id = auth.uid()))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: menu_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: menu_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;