import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;
type Order = Tables<'orders'>;
type Subscription = Tables<'subscriptions'>;

interface RestaurantBalance {
  id: string;
  restaurant_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface BalanceTransaction {
  id: string;
  restaurant_id: string;
  amount: number;
  transaction_type: 'recharge' | 'admin_credit' | 'order_deduction';
  description: string | null;
  created_at: string;
  created_by: string | null;
}

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

export const useAllBalances = () => {
  const [balances, setBalances] = useState<(RestaurantBalance & { restaurant_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    const { data: balancesData, error } = await supabase
      .from('restaurant_balances')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && balancesData) {
      const restaurantIds = balancesData.map(b => b.restaurant_id);
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, name')
        .in('id', restaurantIds);

      const restaurantMap = new Map(restaurantsData?.map(r => [r.id, r.name]) || []);
      
      const balancesWithNames = balancesData.map(balance => ({
        ...balance,
        restaurant_name: restaurantMap.get(balance.restaurant_id) || 'Unknown',
      }));

      setBalances(balancesWithNames);
    }
    setLoading(false);
  };

  const addBalance = async (restaurantId: string, amount: number, description: string) => {
    const { data, error } = await supabase
      .from('balance_transactions')
      .insert({
        restaurant_id: restaurantId,
        amount: amount,
        transaction_type: 'admin_credit',
        description: description,
      })
      .select()
      .single();

    if (!error) {
      await fetchBalances();
    }

    return { data, error };
  };

  return { balances, loading, addBalance, refetch: fetchBalances };
};

export const useRestaurantBalance = (restaurantId: string | undefined) => {
  const [balance, setBalance] = useState<RestaurantBalance | null>(null);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchBalance();
      fetchTransactions();
    }
  }, [restaurantId]);

  const fetchBalance = async () => {
    if (!restaurantId) return;
    
    const { data, error } = await supabase
      .from('restaurant_balances')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!error) {
      setBalance(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!restaurantId) return;
    
    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data as BalanceTransaction[]);
    }
  };

  const addRecharge = async (amount: number, description: string) => {
    if (!restaurantId) return { data: null, error: new Error('No restaurant ID') };
    
    const { data, error } = await supabase
      .from('balance_transactions')
      .insert({
        restaurant_id: restaurantId,
        amount: amount,
        transaction_type: 'recharge',
        description: description,
      })
      .select()
      .single();

    if (!error) {
      await fetchBalance();
      await fetchTransactions();
    }

    return { data, error };
  };

  return { balance, transactions, loading, addRecharge, refetch: fetchBalance };
};
