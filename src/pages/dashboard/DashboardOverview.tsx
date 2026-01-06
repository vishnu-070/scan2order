import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant, useOrders } from '@/hooks/useRestaurant';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Receipt,
  UtensilsCrossed,
  Grid3X3,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
} from 'lucide-react';

const DashboardOverview = () => {
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { orders } = useOrders(restaurant?.id);
  const navigate = useNavigate();

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

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back, {restaurant.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your restaurant today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-3xl font-bold mt-1">{pendingOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Preparing</p>
                  <p className="text-3xl font-bold mt-1">{preparingOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Orders</p>
                  <p className="text-3xl font-bold mt-1">{todayOrders.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-3xl font-bold mt-1">
                    {restaurant.currency} {todayRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/dashboard/orders">
            <Card className="hover:border-primary/30 hover:shadow-card transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4">
                  <Receipt className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  View Orders
                  <ArrowRight className="w-5 h-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage incoming orders and update their status.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/menu">
            <Card className="hover:border-primary/30 hover:shadow-card transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  Edit Menu
                  <ArrowRight className="w-5 h-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add, edit, or remove menu items and categories.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/tables">
            <Card className="hover:border-primary/30 hover:shadow-card transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4">
                  <Grid3X3 className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  Manage Tables
                  <ArrowRight className="w-5 h-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure tables and download QR codes.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/dashboard/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet. Share your QR codes to start receiving orders!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {restaurant.currency} {Number(order.total_amount).toFixed(2)}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending'
                            ? 'bg-primary/10 text-primary'
                            : order.status === 'preparing'
                            ? 'bg-secondary/10 text-secondary'
                            : order.status === 'ready'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
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

export default DashboardOverview;
