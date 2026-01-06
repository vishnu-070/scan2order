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
  X,
  ClipboardList,
  Clock,
  UtensilsCrossed,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;
type MenuCategory = Tables<'menu_categories'>;
type MenuItem = Tables<'menu_items'>;
type Order = Tables<'orders'>;

// Using RPC function to check if restaurant can accept orders (hides actual balance for security)

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const SESSION_ORDERS_KEY = 'scan2serve_session_orders';

const getSessionOrders = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const addSessionOrder = (orderId: string) => {
  const orders = getSessionOrders();
  if (!orders.includes(orderId)) {
    orders.push(orderId);
    sessionStorage.setItem(SESSION_ORDERS_KEY, JSON.stringify(orders));
  }
};

const CustomerMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const [tableName, setTableName] = useState<string | null>(null);
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [canAcceptOrders, setCanAcceptOrders] = useState<boolean>(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loadingOrders, setLoadingOrders] = useState(false);
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

      // Check if restaurant can accept orders (uses RPC to hide actual balance)
      const { data: canOrder } = await supabase
        .rpc('can_restaurant_accept_orders', { p_restaurant_id: restaurantData.id });

      setCanAcceptOrders(canOrder ?? false);

      // Fetch table name if tableId is provided
      if (tableId) {
        const { data: tableData } = await supabase
          .from('restaurant_tables')
          .select('table_number')
          .eq('id', tableId)
          .maybeSingle();
        
        if (tableData) {
          setTableName(tableData.table_number);
        }
      }

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

  const fetchMyOrders = async () => {
    const orderIds = getSessionOrders();
    if (orderIds.length === 0) return;
    
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMyOrders(data);
        
        // Fetch order items for each order
        const itemsPromises = data.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('id, name, price, quantity')
            .eq('order_id', order.id);
          return { orderId: order.id, items: items || [] };
        });
        
        const allItems = await Promise.all(itemsPromises);
        const itemsMap: Record<string, OrderItem[]> = {};
        allItems.forEach(({ orderId, items }) => {
          itemsMap[orderId] = items;
        });
        setOrderItems(itemsMap);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast({
        title: 'Order cancelled',
        description: 'Your order has been cancelled. Show this to staff for refund.',
      });
      
      fetchMyOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel order',
        variant: 'destructive',
      });
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
          <div className="flex items-center gap-2 mt-4">
            {tableName && (
              <Badge variant="secondary">
                Table {tableName}
              </Badge>
            )}
            {getSessionOrders().length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowMyOrders(true);
                  fetchMyOrders();
                }}
              >
                <ClipboardList className="w-4 h-4 mr-1" />
                My Orders
              </Button>
            )}
          </div>
          
          {/* Balance warning */}
          {!canAcceptOrders && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/20 text-primary-foreground">
              <p className="text-sm font-medium">
                ⚠️ This restaurant is currently not accepting orders. Please contact staff.
              </p>
            </div>
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
        canAcceptOrders={canAcceptOrders}
      />

      {/* My Orders Dialog */}
      <MyOrdersDialog
        open={showMyOrders}
        onClose={() => setShowMyOrders(false)}
        orders={myOrders}
        orderItems={orderItems}
        loading={loadingOrders}
        currency={restaurant.currency}
        tableName={tableName}
        onCancelOrder={handleCancelOrder}
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
  canAcceptOrders: boolean;
}

const CheckoutDialog = ({
  open,
  onClose,
  restaurant,
  cart,
  tableId,
  total,
  onSuccess,
  canAcceptOrders,
}: CheckoutDialogProps) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const { toast } = useToast();

  const canOrder = total > 0 && canAcceptOrders;

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

      // Save order ID to session for "My Orders" feature
      addSessionOrder(order.id);

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
          {!canOrder && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">
                {total === 0 
                  ? 'Cannot place an order with no items.' 
                  : 'This restaurant is currently not accepting orders.'}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !canOrder}>
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

// Status display helpers
const statusColors: Record<string, string> = {
  pending: 'bg-primary/10 text-primary border-primary/20',
  preparing: 'bg-secondary/10 text-secondary border-secondary/20',
  ready: 'bg-green-100 text-green-700 border-green-200',
  served: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  preparing: UtensilsCrossed,
  ready: CheckCircle2,
  served: CheckCircle2,
  cancelled: XCircle,
};

interface MyOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  orderItems: Record<string, OrderItem[]>;
  loading: boolean;
  currency: string;
  tableName: string | null;
  onCancelOrder: (orderId: string) => void;
}

const MyOrdersDialog = ({ open, onClose, orders, orderItems, loading, currency, tableName, onCancelOrder }: MyOrdersDialogProps) => {
  const [showCancelledBill, setShowCancelledBill] = useState<Order | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              My Orders
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No orders found
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const StatusIcon = statusIcons[order.status] || Clock;
                  const items = orderItems[order.id] || [];
                  const isCancelled = order.status === 'cancelled';
                  const canCancel = order.status === 'pending';
                  
                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-xl border ${isCancelled ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${statusColors[order.status]?.split(' ')[0] || 'bg-muted'}`}>
                            <StatusIcon className={`w-4 h-4 ${statusColors[order.status]?.split(' ')[1] || 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                            {tableName && (
                              <p className="text-xs text-muted-foreground">
                                Table: {tableName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{currency} {Number(order.total_amount).toFixed(2)}</p>
                          <Badge variant="outline" className={statusColors[order.status]}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      {items.length > 0 && (
                        <div className="border-t border-border pt-3 mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Items:</p>
                          <div className="space-y-1">
                            {items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{currency} {(Number(item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        {canCancel && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                onCancelOrder(order.id);
                              }
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel Order
                          </Button>
                        )}
                        {isCancelled && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowCancelledBill(order)}
                          >
                            View Cancelled Bill
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancelled Bill Dialog */}
      <Dialog open={!!showCancelledBill} onOpenChange={() => setShowCancelledBill(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">Cancelled Order Bill</DialogTitle>
          </DialogHeader>
          {showCancelledBill && (
            <div className="space-y-4">
              <div className="text-center py-4 border-b border-border">
                <XCircle className="w-12 h-12 mx-auto mb-2 text-destructive" />
                <p className="font-bold text-lg">ORDER CANCELLED</p>
                <p className="text-sm text-muted-foreground">Show this to staff for refund</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{showCancelledBill.id.slice(0, 8)}</span>
                </div>
                {tableName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Table:</span>
                    <span>{tableName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(showCancelledBill.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Order Items */}
              {orderItems[showCancelledBill.id]?.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Items:</p>
                  <div className="space-y-1">
                    {orderItems[showCancelledBill.id].map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{currency} {(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t border-border pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Refund Amount:</span>
                  <span className="text-destructive">{currency} {Number(showCancelledBill.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelledBill(null)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerMenu;
