import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;
type Order = Tables<'orders'>;
type Subscription = Tables<'subscriptions'>;

export const useAllRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRestaurants(data);
    }
    setLoading(false);
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setRestaurants(restaurants.map(r => r.id === id ? data : r));
    }

    return { data, error };
  };

  return { restaurants, loading, updateRestaurant, refetch: fetchRestaurants };
};

export const useAllOrders = () => {
  const [orders, setOrders] = useState<(Order & { restaurant_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('all-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && ordersData) {
      // Fetch restaurant names
      const restaurantIds = [...new Set(ordersData.map(o => o.restaurant_id))];
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, name')
        .in('id', restaurantIds);

      const restaurantMap = new Map(restaurantsData?.map(r => [r.id, r.name]) || []);
      
      const ordersWithNames = ordersData.map(order => ({
        ...order,
        restaurant_name: restaurantMap.get(order.restaurant_id) || 'Unknown',
      }));

      setOrders(ordersWithNames);
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

    return { data, error };
  };

  return { orders, loading, updateOrderStatus, refetch: fetchOrders };
};

export const useAllSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<(Subscription & { restaurant_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const { data: subsData, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && subsData) {
      const restaurantIds = subsData.map(s => s.restaurant_id);
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, name')
        .in('id', restaurantIds);

      const restaurantMap = new Map(restaurantsData?.map(r => [r.id, r.name]) || []);
      
      const subsWithNames = subsData.map(sub => ({
        ...sub,
        restaurant_name: restaurantMap.get(sub.restaurant_id) || 'Unknown',
      }));

      setSubscriptions(subsWithNames);
    }
    setLoading(false);
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setSubscriptions(subs => 
        subs.map(s => s.id === id ? { ...data, restaurant_name: s.restaurant_name } : s)
      );
    }

    return { data, error };
  };

  return { subscriptions, loading, updateSubscription, refetch: fetchSubscriptions };
};
