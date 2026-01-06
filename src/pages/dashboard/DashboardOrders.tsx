import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant, useOrders, useOrderItems, Order } from '@/hooks/useRestaurant';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, CheckCircle2, UtensilsCrossed, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const DashboardOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { orders, updateOrderStatus } = useOrders(restaurant?.id);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !restaurantLoading && user && !restaurant) {
      navigate('/onboarding');
    }
  }, [user, restaurant, authLoading, restaurantLoading, navigate]);

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

  if (authLoading || restaurantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) return null;

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage incoming orders in real-time</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="served">Served</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
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
                <Card
                  key={order.id}
                  className="cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${statusColors[order.status].split(' ')[0]}`}>
                          <StatusIcon className={`w-6 h-6 ${statusColors[order.status].split(' ')[1]}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name || 'Guest'} • Table {order.table_id?.slice(0, 4) || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {restaurant.currency} {Number(order.total_amount).toFixed(2)}
                          </p>
                          <Badge variant="outline" className={statusColors[order.status]}>
                            {order.status}
                          </Badge>
                        </div>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}
                        >
                          <SelectTrigger 
                            className="w-[130px]" 
                            onClick={(e) => e.stopPropagation()}
                          >
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

        {/* Order Details Dialog */}
        <OrderDetailsDialog
          order={selectedOrder}
          currency={restaurant.currency}
          onClose={() => setSelectedOrder(null)}
        />
      </div>
    </DashboardLayout>
  );
};

interface OrderDetailsDialogProps {
  order: Order | null;
  currency: string;
  onClose: () => void;
}

const OrderDetailsDialog = ({ order, currency, onClose }: OrderDetailsDialogProps) => {
  const { items } = useOrderItems(order?.id);

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium">{order.customer_name || 'Guest'}</span>
          </div>
          {order.customer_phone && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{order.customer_phone}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
          
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold mb-3">Order Items</h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    {currency} {(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{currency} {Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardOrders;
