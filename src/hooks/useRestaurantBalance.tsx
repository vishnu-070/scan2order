import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type RestaurantBalance = Tables<'restaurant_balances'>;

export const useRestaurantBalance = (restaurantId: string | undefined) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchBalance();
      
      // Subscribe to realtime balance updates
      const channel = supabase
        .channel('balance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'restaurant_balances',
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          () => {
            fetchBalance();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [restaurantId]);

  const fetchBalance = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('restaurant_balances')
      .select('balance')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!error && data) {
      setBalance(data.balance);
    } else {
      setBalance(0);
    }
    setLoading(false);
  };

  const isLowBalance = balance !== null && balance < 50;
  const canAcceptOrders = balance !== null && balance >= 5;

  return { 
    balance, 
    loading, 
    isLowBalance, 
    canAcceptOrders,
    refetch: fetchBalance 
  };
};
