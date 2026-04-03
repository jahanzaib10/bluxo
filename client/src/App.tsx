import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useActiveOrg } from "./hooks/useActiveOrg";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Subscriptions from "./pages/Subscriptions";
import NotFound from "./pages/NotFound";

// Pages
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import EmployeeExpenses from "./pages/EmployeeExpenses";

// Settings pages
import ProfileSettings from "./pages/settings/ProfileSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import OrganizationSettings from "./pages/settings/OrganizationSettings";
import CategoriesSettings from "./pages/settings/CategoriesSettings";
import PaymentSourcesSettings from "./pages/settings/PaymentSourcesSettings";
import { UserManagementSettings } from "./pages/settings/UserManagementSettings";

function CommandCenter() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">HQ Command Center</h1>
      <p className="text-muted-foreground mt-2">Coming in a future update.</p>
    </div>
  );
}

function InvoicingPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Invoicing</h1>
      <p className="text-muted-foreground mt-2">Coming soon.</p>
    </div>
  );
}

function AccountingPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Accounting</h1>
      <p className="text-muted-foreground mt-2">Coming soon.</p>
    </div>
  );
}

function TaxRulesPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Tax Rules</h1>
      <p className="text-muted-foreground mt-2">Coming soon.</p>
    </div>
  );
}

function OrgRouter() {
  const { activeOrg, isLoaded, hasMultipleOrgs } = useActiveOrg();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!activeOrg) {
    if (hasMultipleOrgs) {
      return (
        <DashboardLayout>
          <Switch>
            <Route path="/hq" component={CommandCenter} />
            <Route path="/hq/organizations">
              <div className="p-6">
                <h1 className="text-2xl font-bold">Organizations</h1>
              </div>
            </Route>
            <Route>
              <Redirect to="/hq" />
            </Route>
          </Switch>
        </DashboardLayout>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Bluxo</h1>
          <p className="text-muted-foreground">
            Create or join an organization to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/income" component={Income} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/clients" component={Clients} />
        <Route path="/employees" component={Employees} />
        <Route path="/employees/:employeeId/expenses" component={EmployeeExpenses} />
        <Route path="/settings/profile" component={ProfileSettings} />
        <Route path="/settings/security" component={SecuritySettings} />
        <Route path="/settings/organization" component={OrganizationSettings} />
        <Route path="/settings/categories" component={CategoriesSettings} />
        <Route path="/settings/payment-sources" component={PaymentSourcesSettings} />
        <Route path="/settings/user-management" component={UserManagementSettings} />
        <Route path="/settings/tax-rules" component={TaxRulesPlaceholder} />
        <Route path="/invoicing" component={InvoicingPlaceholder} />
        <Route path="/accounting" component={AccountingPlaceholder} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="bluxo-theme">
        <Switch>
          <Route path="/sign-in">
            <div className="flex items-center justify-center min-h-screen bg-background">
              <SignIn routing="hash" />
            </div>
          </Route>
          <Route path="/sign-up">
            <div className="flex items-center justify-center min-h-screen bg-background">
              <SignUp routing="hash" />
            </div>
          </Route>
          <Route>
            <ProtectedRoute>
              <OrgRouter />
            </ProtectedRoute>
          </Route>
        </Switch>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
