import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import CustomerMenu from "./pages/CustomerMenu";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardMenu from "./pages/dashboard/DashboardMenu";
import DashboardTables from "./pages/dashboard/DashboardTables";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/menu/:slug" element={<CustomerMenu />} />
            
            {/* Restaurant Admin Routes */}
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/dashboard/orders" element={<DashboardOrders />} />
            <Route path="/dashboard/menu" element={<DashboardMenu />} />
            <Route path="/dashboard/tables" element={<DashboardTables />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            
            {/* Master Admin Routes */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
