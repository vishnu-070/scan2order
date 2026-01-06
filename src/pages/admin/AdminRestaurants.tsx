import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllRestaurants, useAllSubscriptions } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Search, ExternalLink, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;

const AdminRestaurants = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { restaurants, loading, updateRestaurant } = useAllRestaurants();
  const { subscriptions } = useAllSubscriptions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
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

  const handleToggleActive = async (restaurant: Restaurant) => {
    const { error } = await updateRestaurant(restaurant.id, {
      is_active: !restaurant.is_active,
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
        description: `${restaurant.name} is now ${!restaurant.is_active ? 'active' : 'inactive'}`,
      });
    }
  };

  const getRestaurantSubscription = (restaurantId: string) => {
    return subscriptions.find(s => s.restaurant_id === restaurantId);
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="font-display text-3xl font-bold">Restaurants</h1>
            <p className="text-muted-foreground">
              Manage all onboarded restaurants
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-[250px]"
            />
          </div>
        </div>

        {filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Restaurants will appear here when they sign up'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((restaurant) => {
              const subscription = getRestaurantSubscription(restaurant.id);
              
              return (
                <Card
                  key={restaurant.id}
                  className="cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => setSelectedRestaurant(restaurant)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
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
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            /{restaurant.slug}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          restaurant.is_active ? 'bg-green-500' : 'bg-muted'
                        }`}
                      />
                    </div>
                    
                    {/* Subscription Info */}
                    <div className="mb-4">
                      <Badge 
                        variant="outline" 
                        className={subscription?.status === 'active' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : subscription?.status === 'trial'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-muted text-muted-foreground'
                        }
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        {subscription?.plan_name || 'No plan'} ({subscription?.status || 'N/A'})
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(restaurant.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch
                          checked={restaurant.is_active}
                          onCheckedChange={() => handleToggleActive(restaurant)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Restaurant Details Dialog */}
        <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Restaurant Details</DialogTitle>
            </DialogHeader>
            {selectedRestaurant && (
              <RestaurantDetails 
                restaurant={selectedRestaurant} 
                subscription={getRestaurantSubscription(selectedRestaurant.id)}
                onToggleActive={() => handleToggleActive(selectedRestaurant)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

interface RestaurantDetailsProps {
  restaurant: Restaurant;
  subscription?: Tables<'subscriptions'> & { restaurant_name?: string };
  onToggleActive: () => void;
}

const RestaurantDetails = ({ restaurant, subscription, onToggleActive }: RestaurantDetailsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {restaurant.logo_url ? (
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-lg">{restaurant.name}</h3>
          <p className="text-muted-foreground">/{restaurant.slug}</p>
        </div>
      </div>

      {restaurant.description && (
        <p className="text-sm text-muted-foreground">
          {restaurant.description}
        </p>
      )}

      <div className="space-y-2 text-sm">
        {restaurant.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{restaurant.address}</span>
          </div>
        )}
        {restaurant.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{restaurant.phone}</span>
          </div>
        )}
        {restaurant.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{restaurant.email}</span>
          </div>
        )}
      </div>

      {/* Subscription Details */}
      <div className="pt-4 border-t border-border">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Subscription Plan
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="font-medium">{subscription?.plan_name || 'No plan'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge 
              variant="outline" 
              className={subscription?.status === 'active' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : subscription?.status === 'trial'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-muted text-muted-foreground'
              }
            >
              {subscription?.status || 'N/A'}
            </Badge>
          </div>
          {subscription?.trial_ends_at && subscription.status === 'trial' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trial Ends</span>
              <span className="font-medium">
                {new Date(subscription.trial_ends_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {restaurant.is_active ? 'Active' : 'Inactive'}
            </span>
            <Switch
              checked={restaurant.is_active}
              onCheckedChange={onToggleActive}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Currency</span>
          <span className="font-medium">{restaurant.currency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created</span>
          <span className="font-medium">
            {new Date(restaurant.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <a
        href={`/menu/${restaurant.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
      >
        <ExternalLink className="w-4 h-4" />
        View Public Menu
      </a>
    </div>
  );
};

export default AdminRestaurants;
