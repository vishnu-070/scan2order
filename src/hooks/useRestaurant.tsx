import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Restaurant = Tables<'restaurants'>;
export type MenuCategory = Tables<'menu_categories'>;
export type MenuItem = Tables<'menu_items'>;
export type RestaurantTable = Tables<'restaurant_tables'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Subscription = Tables<'subscriptions'>;

export const useRestaurant = () => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRestaurant();
    } else {
      setRestaurant(null);
      setLoading(false);
    }
  }, [user]);

  const fetchRestaurant = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRestaurant = async (data: Omit<TablesInsert<'restaurants'>, 'owner_id'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data: newRestaurant, error } = await supabase
      .from('restaurants')
      .insert({ ...data, owner_id: user.id })
      .select()
      .single();

    if (!error && newRestaurant) {
      setRestaurant(newRestaurant);
      // Create trial subscription
      await supabase.from('subscriptions').insert({
        restaurant_id: newRestaurant.id,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return { data: newRestaurant, error };
  };

  const updateRestaurant = async (data: TablesUpdate<'restaurants'>) => {
    if (!restaurant) return { error: new Error('No restaurant') };

    const { data: updated, error } = await supabase
      .from('restaurants')
      .update(data)
      .eq('id', restaurant.id)
      .select()
      .single();

    if (!error && updated) {
      setRestaurant(updated);
    }

    return { data: updated, error };
  };

  return {
    restaurant,
    loading,
    createRestaurant,
    updateRestaurant,
    refetch: fetchRestaurant,
  };
};

export const useMenuCategories = (restaurantId: string | undefined) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchCategories();
    }
  }, [restaurantId]);

  const fetchCategories = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order');

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const addCategory = async (name: string, description?: string) => {
    if (!restaurantId) return { error: new Error('No restaurant') };

    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        restaurant_id: restaurantId,
        name,
        description,
        sort_order: categories.length,
      })
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, data]);
    }

    return { data, error };
  };

  const updateCategory = async (id: string, updates: Partial<MenuCategory>) => {
    const { data, error } = await supabase
      .from('menu_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setCategories(categories.map(c => c.id === id ? data : c));
    }

    return { data, error };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (!error) {
      setCategories(categories.filter(c => c.id !== id));
    }

    return { error };
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory, refetch: fetchCategories };
};

export const useMenuItems = (restaurantId: string | undefined) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchItems();
    }
  }, [restaurantId]);

  const fetchItems = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order');

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const addItem = async (item: Omit<TablesInsert<'menu_items'>, 'restaurant_id'>) => {
    if (!restaurantId) return { error: new Error('No restaurant') };

    const { data, error } = await supabase
      .from('menu_items')
      .insert({ ...item, restaurant_id: restaurantId })
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
    }

    return { data, error };
  };

  const updateItem = async (id: string, updates: Partial<MenuItem>) => {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setItems(items.map(i => i.id === id ? data : i));
    }

    return { data, error };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (!error) {
      setItems(items.filter(i => i.id !== id));
    }

    return { error };
  };

  return { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems };
};

export const useRestaurantTables = (restaurantId: string | undefined) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchTables();
    }
  }, [restaurantId]);

  const fetchTables = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number');

    if (!error && data) {
      setTables(data);
    }
    setLoading(false);
  };

  const addTable = async (tableNumber: string, capacity: number = 4) => {
    if (!restaurantId) return { error: new Error('No restaurant') };

    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({ restaurant_id: restaurantId, table_number: tableNumber, capacity })
      .select()
      .single();

    if (!error && data) {
      setTables([...tables, data]);
    }

    return { data, error };
  };

  const updateTable = async (id: string, updates: Partial<RestaurantTable>) => {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setTables(tables.map(t => t.id === id ? data : t));
    }

    return { data, error };
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', id);

    if (!error) {
      setTables(tables.filter(t => t.id !== id));
    }

    return { error };
  };

  return { tables, loading, addTable, updateTable, deleteTable, refetch: fetchTables };
};

export const useOrders = (restaurantId: string | undefined) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (!error && data) {
      setOrders(orders.map(o => o.id === orderId ? data : o));
    }

    return { data, error };
  };

  return { orders, loading, updateOrderStatus, refetch: fetchOrders };
};

export const useOrderItems = (orderId: string | undefined) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchItems();
    }
  }, [orderId]);

  const fetchItems = async () => {
    if (!orderId) return;

    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  return { items, loading };
};
