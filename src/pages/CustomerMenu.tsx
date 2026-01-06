import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  QrCode, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Trash2, 
  Star,
  Phone,
  MapPin,
  Send,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;
type MenuCategory = Tables<'menu_categories'>;
type MenuItem = Tables<'menu_items'>;

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

const CustomerMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchMenuData();
    }
  }, [slug]);

  const fetchMenuData = async () => {
    try {
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (restaurantError) throw restaurantError;
      if (!restaurantData) {
        setError('Restaurant not found');
        setLoading(false);
        return;
      }

      setRestaurant(restaurantData);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_active', true)
        .order('sort_order');

      setCategories(categoriesData || []);

      // Fetch menu items
      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_available', true)
        .order('sort_order');

      setItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    toast({
      title: 'Added to cart',
      description: `${item.name} added to your order`,
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((i) => i.category_id === selectedCategory);

  const popularItems = items.filter((i) => i.is_popular);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading menu...</div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <X className="w-16 h-16 mx-auto mb-4 text-destructive/50" />
            <h1 className="text-2xl font-bold mb-2">Menu Not Found</h1>
            <p className="text-muted-foreground">
              {error || 'This restaurant menu is not available.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-16 h-16 rounded-xl object-cover bg-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                <QrCode className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-primary-foreground/80 text-sm mt-1">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>
          {(restaurant.address || restaurant.phone) && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-primary-foreground/80">
              {restaurant.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {restaurant.address}
                </span>
              )}
              {restaurant.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {restaurant.phone}
                </span>
              )}
            </div>
          )}
          {tableId && (
            <Badge variant="secondary" className="mt-4">
              Table #{tableId.slice(0, 4)}
            </Badge>
          )}
        </div>
      </header>

      {/* Categories */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-3 gap-2 no-scrollbar">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="flex-shrink-0"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="flex-shrink-0"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Items */}
      {selectedCategory === 'all' && popularItems.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary fill-primary" />
            Popular Items
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
            {popularItems.map((item) => (
              <Card
                key={item.id}
                className="flex-shrink-0 w-64 overflow-hidden"
              >
                {item.image_url && (
                  <div className="aspect-video">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-lg font-bold text-primary mt-1">
                    {restaurant.currency} {Number(item.price).toFixed(2)}
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => addToCart(item)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Menu Items */}
      <section className="container mx-auto px-4 py-6">
        {selectedCategory === 'all' ? (
          categories.map((cat) => {
            const categoryItems = items.filter((i) => i.category_id === cat.id);
            if (categoryItems.length === 0) return null;
            return (
              <div key={cat.id} className="mb-8">
                <h2 className="font-display text-lg font-bold mb-4">{cat.name}</h2>
                <div className="grid gap-4">
                  {categoryItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      currency={restaurant.currency}
                      onAdd={() => addToCart(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                currency={restaurant.currency}
                onAdd={() => addToCart(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cart FAB */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({cartCount}) • {restaurant.currency} {cartTotal.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Your Order</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3">
            {cart.map((cartItem) => (
              <div
                key={cartItem.menuItem.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{cartItem.menuItem.name}</h4>
                  <p className="text-sm text-primary font-semibold">
                    {restaurant.currency}{' '}
                    {(Number(cartItem.menuItem.price) * cartItem.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cartItem.menuItem.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">
                    {cartItem.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cartItem.menuItem.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFromCart(cartItem.menuItem.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total</span>
              <span>
                {restaurant.currency} {cartTotal.toFixed(2)}
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setShowCart(false);
                setShowCheckout(true);
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        restaurant={restaurant}
        cart={cart}
        tableId={tableId}
        total={cartTotal}
        onSuccess={() => {
          setCart([]);
          setShowCheckout(false);
        }}
      />
    </div>
  );
};

interface MenuItemCardProps {
  item: MenuItem;
  currency: string;
  onAdd: () => void;
}

const MenuItemCard = ({ item, currency, onAdd }: MenuItemCardProps) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="flex gap-4">
        <div className="flex-1 p-4">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold">{item.name}</h3>
            {item.is_popular && (
              <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-lg font-bold text-primary mt-2">
            {currency} {Number(item.price).toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-20 h-20 rounded-xl object-cover mb-2"
            />
          )}
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  cart: CartItem[];
  tableId: string | null;
  total: number;
  onSuccess: () => void;
}

const CheckoutDialog = ({
  open,
  onClose,
  restaurant,
  cart,
  tableId,
  total,
  onSuccess,
}: CheckoutDialogProps) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          table_id: tableId,
          customer_name: customerName.trim() || null,
          customer_phone: customerPhone.trim() || null,
          notes: notes.trim() || null,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderPlaced(true);
      setTimeout(() => {
        onSuccess();
        setOrderPlaced(false);
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
      }, 2000);
    } catch (err) {
      console.error('Error placing order:', err);
      toast({
        title: 'Error',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
            <p className="text-muted-foreground">
              Your order has been sent to the kitchen.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name (optional)</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="For order updates"
            />
          </div>
          <div>
            <Label>Special Instructions</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any allergies or special requests?"
              rows={3}
            />
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>
                {restaurant.currency} {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              'Placing Order...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Place Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerMenu;
