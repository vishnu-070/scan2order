import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QrCode, Building2, UtensilsCrossed, Check, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading, createRestaurant } = useRestaurant();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    currency: 'USD',
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
    if (!authLoading && !restaurantLoading && restaurant) {
      navigate('/dashboard');
    }
  }, [restaurant, authLoading, restaurantLoading, navigate]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a restaurant name',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const { error } = await createRestaurant({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || null,
      address: formData.address.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      currency: formData.currency,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message.includes('duplicate')
          ? 'This URL slug is already taken. Please choose another.'
          : 'Failed to create restaurant. Please try again.',
        variant: 'destructive',
      });
      setSaving(false);
    } else {
      toast({
        title: 'Welcome aboard!',
        description: 'Your restaurant has been created successfully.',
      });
      navigate('/dashboard');
    }
  };

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Scan2Serve</span>
          </a>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-16 h-1 rounded ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <div className={`w-16 h-1 rounded ${step > 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Restaurant Name */}
        {step === 1 && (
          <Card className="animate-fade-up">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Let's set up your restaurant</CardTitle>
              <CardDescription>
                Start with the basics - your restaurant name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Restaurant Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., The Italian Kitchen"
                  className="text-lg"
                />
              </div>
              <div>
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {window.location.origin}/menu/
                  </span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="your-restaurant"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This will be your menu URL that customers can access
                </p>
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name.trim() || !formData.slug.trim()}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact & Details */}
        {step === 2 && (
          <Card className="animate-fade-up">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Restaurant Details</CardTitle>
              <CardDescription>
                Add contact information (you can update these later)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell customers about your restaurant..."
                  rows={3}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@restaurant.com"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Currency & Confirmation */}
        {step === 3 && (
          <Card className="animate-fade-up">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Almost there!</CardTitle>
              <CardDescription>
                Set your currency and you're ready to go
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
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

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold">Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.name}</p>
                  <p><span className="text-muted-foreground">URL:</span> /menu/{formData.slug}</p>
                  <p><span className="text-muted-foreground">Currency:</span> {formData.currency}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Restaurant
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial Notice */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          🎉 You'll get a 14-day free trial to explore all features
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
