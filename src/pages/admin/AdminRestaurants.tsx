import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllRestaurants } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Search, ExternalLink, MapPin, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;

const AdminRestaurants = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { restaurants, loading, updateRestaurant } = useAllRestaurants();
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
            {filteredRestaurants.map((restaurant) => (
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
            ))}
          </div>
        )}

        {/* Restaurant Details Dialog */}
        <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Restaurant Details</DialogTitle>
            </DialogHeader>
            {selectedRestaurant && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedRestaurant.logo_url ? (
                    <img
                      src={selectedRestaurant.logo_url}
                      alt={selectedRestaurant.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{selectedRestaurant.name}</h3>
                    <p className="text-muted-foreground">/{selectedRestaurant.slug}</p>
                  </div>
                </div>

                {selectedRestaurant.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRestaurant.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {selectedRestaurant.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedRestaurant.address}</span>
                    </div>
                  )}
                  {selectedRestaurant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedRestaurant.phone}</span>
                    </div>
                  )}
                  {selectedRestaurant.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedRestaurant.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedRestaurant.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {selectedRestaurant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Currency</span>
                    <span className="font-medium">{selectedRestaurant.currency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(selectedRestaurant.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.open(`/menu/${selectedRestaurant.slug}`, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Menu
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminRestaurants;
