import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

const DashboardSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading, updateRestaurant } = useRestaurant();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    currency: 'USD',
    logo_url: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name,
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        currency: restaurant.currency,
        logo_url: restaurant.logo_url || '',
        is_active: restaurant.is_active,
      });
    }
  }, [restaurant]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateRestaurant({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      address: formData.address.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      currency: formData.currency,
      logo_url: formData.logo_url.trim() || null,
      is_active: formData.is_active,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings saved',
        description: 'Your restaurant settings have been updated',
      });
    }
    setSaving(false);
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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant profile and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Restaurant Profile
            </CardTitle>
            <CardDescription>
              Basic information about your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Restaurant Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your restaurant name"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your restaurant"
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Logo URL</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, Country"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@restaurant.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Restaurant Active</Label>
                <p className="text-sm text-muted-foreground">
                  When disabled, customers cannot view your menu or place orders
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !formData.name.trim()} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;
