import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllRestaurants, useAllSubscriptions, useAllBalances } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Search, ExternalLink, MapPin, Phone, Mail, CreditCard, Wallet, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;

const AdminRestaurants = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { restaurants, loading, updateRestaurant } = useAllRestaurants();
  const { subscriptions } = useAllSubscriptions();
  const { balances, addBalance, refetch: refetchBalances } = useAllBalances();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showAddBalanceDialog, setShowAddBalanceDialog] = useState(false);
  const [balanceRestaurant, setBalanceRestaurant] = useState<Restaurant | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');
  const [addingBalance, setAddingBalance] = useState(false);
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

  const handleAddBalance = async () => {
    if (!balanceRestaurant || !balanceAmount) return;
    
    setAddingBalance(true);
    const amount = parseFloat(balanceAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      setAddingBalance(false);
      return;
    }

    const { error } = await addBalance(
      balanceRestaurant.id, 
      amount, 
      balanceDescription || `Admin credit: ${amount}`
    );
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add balance',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Balance added',
        description: `Added ${amount} to ${balanceRestaurant.name}`,
      });
      setShowAddBalanceDialog(false);
      setBalanceAmount('');
      setBalanceDescription('');
      setBalanceRestaurant(null);
      refetchBalances();
    }
    setAddingBalance(false);
  };

  const getRestaurantSubscription = (restaurantId: string) => {
    return subscriptions.find(s => s.restaurant_id === restaurantId);
  };

  const getRestaurantBalance = (restaurantId: string) => {
    return balances.find(b => b.restaurant_id === restaurantId);
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
              const balance = getRestaurantBalance(restaurant.id);
              
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
                    
                    {/* Balance Info */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Balance: {restaurant.currency} {balance?.balance?.toFixed(2) || '0.00'}
                        </span>
                        {(balance?.balance || 0) < 500 && (
                          <Badge variant="destructive" className="text-xs">Low</Badge>
                        )}
                      </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBalanceRestaurant(restaurant);
                            setShowAddBalanceDialog(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Balance
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        checked={restaurant.is_active}
                        onCheckedChange={() => handleToggleActive(restaurant)}
                      />
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
                balance={getRestaurantBalance(selectedRestaurant.id)}
                onToggleActive={() => handleToggleActive(selectedRestaurant)}
                onAddBalance={() => {
                  setBalanceRestaurant(selectedRestaurant);
                  setShowAddBalanceDialog(true);
                  setSelectedRestaurant(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Balance Dialog */}
        <Dialog open={showAddBalanceDialog} onOpenChange={setShowAddBalanceDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Restaurant</Label>
                <p className="text-sm font-medium">{balanceRestaurant?.name}</p>
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  placeholder="e.g., Initial credit, Bonus"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBalanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBalance} disabled={addingBalance || !balanceAmount}>
                {addingBalance ? 'Adding...' : 'Add Balance'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

interface RestaurantDetailsProps {
  restaurant: Restaurant;
  subscription?: Tables<'subscriptions'> & { restaurant_name?: string };
  balance?: { balance: number };
  onToggleActive: () => void;
  onAddBalance: () => void;
}

const RestaurantDetails = ({ restaurant, subscription, balance, onToggleActive, onAddBalance }: RestaurantDetailsProps) => {
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

      {/* Balance Section */}
      <div className="pt-4 border-t border-border">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Account Balance
        </h4>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold">
            {restaurant.currency} {balance?.balance?.toFixed(2) || '0.00'}
          </span>
          {(balance?.balance || 0) < 500 && (
            <Badge variant="destructive">Below minimum (500)</Badge>
          )}
        </div>
        <Button onClick={onAddBalance} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Balance
        </Button>
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
