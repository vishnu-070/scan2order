import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllRestaurants, useAllOrders, useAllSubscriptions } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Building2, Receipt, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminOverview = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { restaurants, loading: restaurantsLoading, updateRestaurant } = useAllRestaurants();
  const { orders } = useAllOrders();
  const { subscriptions } = useAllSubscriptions();
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

  if (authLoading || restaurantsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleActive = async (restaurantId: string, currentStatus: boolean, name: string) => {
    const { error } = await updateRestaurant(restaurantId, {
      is_active: !currentStatus,
    });
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update restaurant',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Updated',
        description: `${name} is now ${!currentStatus ? 'active' : 'inactive'}`,
      });
    }
  };

  // Calculate order values per restaurant
  const getRestaurantOrderStats = (restaurantId: string) => {
    const restaurantOrders = orders.filter(o => o.restaurant_id === restaurantId);
    const totalValue = restaurantOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    return { orderCount: restaurantOrders.length, totalValue };
  };

  // Get subscription for a restaurant
  const getRestaurantSubscription = (restaurantId: string) => {
    return subscriptions.find(s => s.restaurant_id === restaurantId);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeRestaurants = restaurants.filter(r => r.is_active).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Platform Overview</h1>
          <p className="text-muted-foreground">
            View all onboarded restaurants, their order values and plans
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
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
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-3xl font-bold mt-1">{orders.length}</p>
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
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants List */}
        <Card>
          <CardHeader>
            <CardTitle>All Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            {restaurants.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No restaurants onboarded yet</p>
            ) : (
              <div className="space-y-4">
                {restaurants.map((restaurant) => {
                  const stats = getRestaurantOrderStats(restaurant.id);
                  const subscription = getRestaurantSubscription(restaurant.id);
                  
                  return (
                    <div
                      key={restaurant.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        {restaurant.logo_url ? (
                          <img
                            src={restaurant.logo_url}
                            alt={restaurant.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{restaurant.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={subscription?.status === 'active' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : subscription?.status === 'trial'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-muted text-muted-foreground'
                              }
                            >
                              {subscription?.plan_name || 'No plan'} ({subscription?.status || 'N/A'})
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">/{restaurant.slug}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Orders</p>
                          <p className="font-bold">{stats.orderCount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="font-bold">${stats.totalValue.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch
                            checked={restaurant.is_active}
                            onCheckedChange={() => handleToggleActive(restaurant.id, restaurant.is_active, restaurant.name)}
                          />
                        </div>
                        <a
                          href={`/menu/${restaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Menu
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
