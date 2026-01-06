import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useRestaurantBalance } from '@/hooks/useRestaurantBalance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  LogOut,
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Users,
  Settings,
  Grid3X3,
  Building2,
  Wallet,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, role, signOut } = useAuth();
  const { restaurant } = useRestaurant();
  const { balance, isLowBalance, canAcceptOrders } = useRestaurantBalance(restaurant?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show low balance warning toast
  useEffect(() => {
    if (isLowBalance && role !== 'master_admin') {
      toast({
        title: 'Low Balance Warning',
        description: `Your balance is ₹${balance?.toFixed(0)}. Recharge to continue accepting orders.`,
        variant: 'destructive',
      });
    }
  }, [isLowBalance, balance]);

  const isMasterAdmin = role === 'master_admin';

  const navItems = isMasterAdmin
    ? [
        { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
        { path: '/admin/restaurants', icon: Building2, label: 'Restaurants' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/dashboard/orders', icon: Receipt, label: 'Orders' },
        { path: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menu' },
        { path: '/dashboard/tables', icon: Grid3X3, label: 'Tables & QR' },
        { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Scan2Serve</span>
          </Link>
        </div>

        {/* Balance Display - Only for restaurant admins */}
        {!isMasterAdmin && balance !== null && (
          <div className="p-4 border-b border-border">
            <div className={cn(
              "p-3 rounded-xl",
              isLowBalance ? "bg-destructive/10" : "bg-primary/10"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className={cn(
                  "w-4 h-4",
                  isLowBalance ? "text-destructive" : "text-primary"
                )} />
                <span className="text-xs font-medium text-muted-foreground">Account Balance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xl font-bold",
                  isLowBalance ? "text-destructive" : "text-foreground"
                )}>
                  ₹{balance.toFixed(0)}
                </span>
                {isLowBalance && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Low
                  </Badge>
                )}
              </div>
              {!canAcceptOrders && (
                <p className="text-xs text-destructive mt-2">
                  Orders paused. Recharge to continue.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Scan2Serve</span>
          </Link>
          
          {/* Mobile Balance Display */}
          {!isMasterAdmin && balance !== null && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold",
              isLowBalance ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            )}>
              <Wallet className="w-4 h-4" />
              ₹{balance.toFixed(0)}
              {isLowBalance && <AlertTriangle className="w-3 h-3" />}
            </div>
          )}
          
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Low balance warning banner */}
        {!isMasterAdmin && !canAcceptOrders && (
          <div className="px-4 pb-2">
            <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Orders paused due to low balance. Please recharge.</span>
            </div>
          </div>
        )}
        
        {/* Mobile Navigation */}
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:overflow-auto">
        <div className="pt-28 lg:pt-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};
