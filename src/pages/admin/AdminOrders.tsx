import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllOrders, useAllRestaurants } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Receipt, Clock, UtensilsCrossed, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

const statusColors: Record<string, string> = {
  pending: 'bg-primary/10 text-primary border-primary/20',
  preparing: 'bg-secondary/10 text-secondary border-secondary/20',
  ready: 'bg-green-100 text-green-700 border-green-200',
  served: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  preparing: UtensilsCrossed,
  ready: CheckCircle2,
  served: CheckCircle2,
  cancelled: XCircle,
};

const AdminOrders = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { orders, loading, updateOrderStatus } = useAllOrders();
  const { restaurants } = useAllRestaurants();
  const [statusFilter, setStatusFilter] = useState('all');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && user && role !== 'master_admin') {
      navigate('/dashboard');
    }
  }, [user, role, authLoading, navigate]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const { error } = await updateOrderStatus(orderId, newStatus);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus}`,
      });
    }
  };

  let filteredOrders = orders;
  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o) => o.status === statusFilter);
  }
  if (restaurantFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o) => o.restaurant_id === restaurantFilter);
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">All Orders</h1>
            <p className="text-muted-foreground">
              Monitor orders across all restaurants
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="served">Served</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                Orders will appear here when customers place them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              return (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            statusColors[order.status].split(' ')[0]
                          }`}
                        >
                          <StatusIcon
                            className={`w-6 h-6 ${
                              statusColors[order.status].split(' ')[1]
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            Order #{order.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-primary font-medium">
                            {order.restaurant_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name || 'Guest'} •{' '}
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ${Number(order.total_amount).toFixed(2)}
                          </p>
                          <Badge
                            variant="outline"
                            className={statusColors[order.status]}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusChange(order.id, value as Order['status'])
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="served">Served</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;
