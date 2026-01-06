import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllRestaurants, useAllOrders, useAllSubscriptions } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Receipt, CreditCard, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const AdminOverview = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { restaurants } = useAllRestaurants();
  const { orders } = useAllOrders();
  const { subscriptions } = useAllSubscriptions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && user && role !== 'master_admin') {
      navigate('/dashboard');
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const activeRestaurants = restaurants.filter(r => r.is_active).length;
  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const trialSubs = subscriptions.filter(s => s.status === 'trial').length;
  const activeSubs = subscriptions.filter(s => s.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Platform Overview</h1>
          <p className="text-muted-foreground">
            Monitor all restaurants and platform-wide metrics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Restaurants</p>
                  <p className="text-3xl font-bold mt-1">{restaurants.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeRestaurants} active
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {pendingOrders} pending
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
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">${totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time
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
                  <p className="text-sm text-muted-foreground">Subscriptions</p>
                  <p className="text-3xl font-bold mt-1">{activeSubs}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trialSubs} on trial
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              {restaurants.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No restaurants yet</p>
              ) : (
                <div className="space-y-3">
                  {restaurants.slice(0, 5).map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          /{restaurant.slug}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          restaurant.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {restaurant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.restaurant_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${Number(order.total_amount).toFixed(2)}</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            order.status === 'pending'
                              ? 'bg-primary/10 text-primary'
                              : order.status === 'preparing'
                              ? 'bg-secondary/10 text-secondary'
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

        {/* Alerts */}
        {trialSubs > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Trial Subscriptions</h3>
                  <p className="text-muted-foreground text-sm">
                    {trialSubs} restaurant(s) are on trial. Consider reaching out to convert them to paid plans.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
