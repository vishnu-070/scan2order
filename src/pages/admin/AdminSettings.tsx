import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Globe, Shield, Bell } from 'lucide-react';

const AdminSettings = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && user && role !== 'master_admin') {
      navigate('/dashboard');
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading) {
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
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">
            Configure platform-wide settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic platform configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Platform settings will be available here. Configure trial periods, 
              default currencies, and other global options.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>
              Security and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Manage admin users, set up authentication requirements, and configure
              security policies.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Email and notification settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Configure email templates, notification triggers, and communication
              preferences for restaurants and customers.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
