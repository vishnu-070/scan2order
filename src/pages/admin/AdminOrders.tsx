import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllOrders, useAllRestaurants } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Clock, UtensilsCrossed, CheckCircle2, XCircle, TrendingUp, DollarSign } from 'lucide-react';

const AdminOrders = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { orders, loading } = useAllOrders();
  const { restaurants } = useAllRestaurants();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && user && role !== 'master_admin') {
      navigate('/dashboard');
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate metrics
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const weekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  const monthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  // Status breakdown
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const servedCount = orders.filter(o => o.status === 'served').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  // Orders per restaurant
  const restaurantOrderCounts = restaurants.map(r => ({
    name: r.name,
    count: orders.filter(o => o.restaurant_id === r.id).length,
    revenue: orders.filter(o => o.restaurant_id === r.id).reduce((sum, o) => sum + Number(o.total_amount), 0),
  })).sort((a, b) => b.count - a.count);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Order Metrics</h1>
          <p className="text-muted-foreground">
            Platform-wide order statistics and revenue overview
          </p>
        </div>

        {/* Revenue Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-3xl font-bold mt-1">${todayRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {todayOrders.length} orders
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold mt-1">${weekRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {weekOrders.length} orders
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-3xl font-bold mt-1">${monthRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {monthOrders.length} orders
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">All Time Revenue</p>
                  <p className="text-3xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {orders.length} total orders
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-primary/10 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/10 text-center">
                <UtensilsCrossed className="w-6 h-6 mx-auto mb-2 text-secondary" />
                <p className="text-2xl font-bold">{preparingCount}</p>
                <p className="text-sm text-muted-foreground">Preparing</p>
              </div>
              <div className="p-4 rounded-xl bg-green-100 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{readyCount}</p>
                <p className="text-sm text-muted-foreground">Ready</p>
              </div>
              <div className="p-4 rounded-xl bg-muted text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{servedCount}</p>
                <p className="text-sm text-muted-foreground">Served</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/10 text-center">
                <XCircle className="w-6 h-6 mx-auto mb-2 text-destructive" />
                <p className="text-2xl font-bold">{cancelledCount}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {restaurantOrderCounts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No restaurant data available</p>
            ) : (
              <div className="space-y-3">
                {restaurantOrderCounts.slice(0, 10).map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.count} orders
                      </p>
                    </div>
                    <p className="text-lg font-bold">${r.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;