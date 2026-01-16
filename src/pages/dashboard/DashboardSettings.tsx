import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useRestaurantBalance } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Save, Building2, Globe, Mail, Phone, MapPin, Wallet, Plus, History } from 'lucide-react';
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
  const { balance, transactions, addRecharge, loading: balanceLoading } = useRestaurantBalance(restaurant?.id);
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
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const rechargingRef = useRef(false);
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

  const handleRecharge = async () => {
    if (rechargingRef.current) return;

    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return;
    }

    rechargingRef.current = true;
    setRecharging(true);

    try {
      const { error } = await addRecharge(amount, `Self-recharge: ${amount}`);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add balance',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Balance added',
          description: `Successfully added ${formData.currency} ${amount} to your account`,
        });
        setShowRechargeDialog(false);
        setRechargeAmount('');
      }
    } finally {
      setRecharging(false);
      rechargingRef.current = false;
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
                <Label>Restaurant Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_active 
                    ? 'Your restaurant is active and accepting orders' 
                    : 'Your restaurant is inactive. Contact admin to reactivate.'}
                </p>
              </div>
              <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                {formData.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Account Balance
            </CardTitle>
            <CardDescription>
              Maintain a minimum balance of 500 to accept orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {formData.currency} {balance?.balance?.toFixed(2) || '0.00'}
                </p>
                {(balance?.balance || 0) < 500 && (
                  <p className="text-sm text-destructive mt-1">
                    Balance below minimum. Customers cannot place orders.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTransactionsDialog(true)}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
                <Button onClick={() => setShowRechargeDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Recharge
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !formData.name.trim()} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Recharge Dialog */}
        <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Recharge Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Balance</Label>
                <p className="text-lg font-semibold">
                  {formData.currency} {balance?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <Label>Amount to Add</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRechargeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecharge} disabled={recharging || !rechargeAmount}>
                {recharging ? 'Adding...' : 'Add Balance'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transactions Dialog */}
        <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Transaction History</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {tx.transaction_type === 'recharge' ? 'Recharge' : 
                           tx.transaction_type === 'admin_credit' ? 'Admin Credit' : 'Order Deduction'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {tx.description}
                          </p>
                        )}
                      </div>
                      <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {tx.amount > 0 ? '+' : ''}{formData.currency} {tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransactionsDialog(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;
