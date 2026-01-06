import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllSubscriptions } from '@/hooks/useAdminData';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Subscription = Tables<'subscriptions'>;

const statusColors: Record<string, string> = {
  trial: 'bg-primary/10 text-primary',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

const AdminSubscriptions = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { subscriptions, loading, updateSubscription } = useAllSubscriptions();
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

  const handleStatusChange = async (subId: string, newStatus: Subscription['status']) => {
    const { error } = await updateSubscription(subId, { status: newStatus });
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Subscription Updated',
        description: `Status changed to ${newStatus}`,
      });
    }
  };

  const trialSubs = subscriptions.filter((s) => s.status === 'trial');
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const expiringSoon = trialSubs.filter((s) => {
    if (!s.trial_ends_at) return false;
    const daysLeft = Math.ceil(
      (new Date(s.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 3 && daysLeft > 0;
  });

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
        <div>
          <h1 className="font-display text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage restaurant subscriptions and billing
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold mt-1">{activeSubs.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On Trial</p>
                  <p className="text-3xl font-bold mt-1">{trialSubs.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-3xl font-bold mt-1">{expiringSoon.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
              <p className="text-muted-foreground">
                Subscriptions will appear when restaurants sign up.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {subscriptions.map((sub) => {
              const daysLeft = sub.trial_ends_at
                ? Math.ceil(
                    (new Date(sub.trial_ends_at).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

              return (
                <Card key={sub.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{sub.restaurant_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Plan: {sub.plan_name}
                        </p>
                        {sub.status === 'trial' && daysLeft !== null && (
                          <p
                            className={`text-sm mt-1 ${
                              daysLeft <= 3 ? 'text-destructive' : 'text-muted-foreground'
                            }`}
                          >
                            {daysLeft > 0
                              ? `Trial ends in ${daysLeft} days`
                              : 'Trial expired'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={statusColors[sub.status]}>
                          {sub.status}
                        </Badge>
                        <Select
                          value={sub.status}
                          onValueChange={(value) =>
                            handleStatusChange(sub.id, value as Subscription['status'])
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="past_due">Past Due</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSubscriptions;
