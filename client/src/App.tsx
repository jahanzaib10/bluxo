import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Import layout component
import DashboardLayout from "./components/layout/DashboardLayout";

// Import new simplified pages
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Subscriptions from "./pages/Subscriptions";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import Categories from "./pages/settings/Categories";
import PaymentSources from "./pages/settings/PaymentSources";
import UserManagement from "./pages/settings/UserManagement";
import ClientDashboard from "./pages/ClientDashboard";
import ClientPortal from "./pages/ClientPortal";
import AcceptInvitation from "./pages/AcceptInvitation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

function AuthenticatedApp() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/income" component={Income} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/employees" component={Employees} />
        <Route path="/clients" component={Clients} />
        <Route path="/settings/categories" component={Categories} />
        <Route path="/settings/payment-sources" component={PaymentSources} />
        <Route path="/settings/user-management" component={UserManagement} />
        <Route path="/client-portal" component={ClientPortal} />
        <Route path="/client-dashboard" component={ClientDashboard} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function UnauthenticatedApp() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/accept-invitation/:token" component={AcceptInvitation} />
      <Route>
        {() => <Login />}
      </Route>
    </Switch>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="light" storageKey="finance-saas-theme">
        <Toaster />
        <Router>
          <AppRouter />
        </Router>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;