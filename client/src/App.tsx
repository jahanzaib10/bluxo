import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { queryClient } from "./lib/queryClient";

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
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="light" storageKey="finance-saas-theme">
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Main application routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/employees" element={<Employees />} />
            
            {/* Settings routes */}
            <Route path="/settings/categories" element={<Categories />} />
            <Route path="/settings/payment-sources" element={<PaymentSources />} />
            <Route path="/settings/user-management" element={<UserManagement />} />
            
            {/* Client dashboard for client users */}
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;