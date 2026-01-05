import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  QrCode, 
  LogOut, 
  LayoutDashboard, 
  UtensilsCrossed, 
  Receipt, 
  Users,
  Settings,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isMasterAdmin = role === 'master_admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">Scan2Serve</span>
            </a>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {role?.replace('_', ' ') || 'Loading...'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            {isMasterAdmin 
              ? 'Manage all restaurants and platform settings from here.' 
              : 'Manage your restaurant orders, menu, and tables.'}
          </p>
        </div>

        {/* Role Badge */}
        <div className="mb-8">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            isMasterAdmin 
              ? 'bg-secondary/10 text-secondary' 
              : 'bg-primary/10 text-primary'
          }`}>
            {isMasterAdmin ? '🛡️ Master Admin' : '🍽️ Restaurant Admin'}
          </span>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {isMasterAdmin ? (
            <>
              <DashboardCard
                icon={Users}
                title="All Restaurants"
                description="View and manage all onboarded restaurants"
                onClick={() => {}}
              />
              <DashboardCard
                icon={Receipt}
                title="All Orders"
                description="Track orders across the entire platform"
                onClick={() => {}}
              />
              <DashboardCard
                icon={LayoutDashboard}
                title="Subscriptions"
                description="Manage billing and subscription plans"
                onClick={() => {}}
              />
              <DashboardCard
                icon={Settings}
                title="Platform Settings"
                description="Configure platform-wide settings"
                onClick={() => {}}
              />
            </>
          ) : (
            <>
              <DashboardCard
                icon={Receipt}
                title="Orders"
                description="View incoming paid orders"
                count={0}
                onClick={() => {}}
              />
              <DashboardCard
                icon={UtensilsCrossed}
                title="Menu"
                description="Manage your menu items"
                onClick={() => {}}
              />
              <DashboardCard
                icon={QrCode}
                title="Tables & QR"
                description="Manage tables and QR codes"
                onClick={() => {}}
              />
              <DashboardCard
                icon={Settings}
                title="Settings"
                description="Restaurant profile settings"
                onClick={() => {}}
              />
            </>
          )}
        </div>

        {/* Recent Activity / Getting Started */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <h2 className="font-display text-xl font-bold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Set up your restaurant profile</h3>
                <p className="text-muted-foreground text-sm">Add your restaurant details, logo, and contact information.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create your menu</h3>
                <p className="text-muted-foreground text-sm">Add categories and menu items with prices and descriptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Add your tables</h3>
                <p className="text-muted-foreground text-sm">Configure your tables and download QR codes to place on them.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface DashboardCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count?: number;
  onClick: () => void;
}

const DashboardCard = ({ icon: Icon, title, description, count, onClick }: DashboardCardProps) => (
  <button
    onClick={onClick}
    className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 text-left"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center group-hover:shadow-glow transition-shadow">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      {count !== undefined && (
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
          {count}
        </span>
      )}
    </div>
    <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </button>
);

export default Dashboard;
