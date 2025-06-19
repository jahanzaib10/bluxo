
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import InviteAcceptance from "./pages/InviteAcceptance";
import DebugInvitation from "./pages/DebugInvitation";
import NotFound from "./pages/NotFound";
import { Settings } from "./pages/settings/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/invite/:token" element={<InviteAcceptance />} />
              <Route path="/debug-invitation" element={<DebugInvitation />} />
              
              {/* Settings routes - put these before dashboard routes to avoid conflicts */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings/categories" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings/payment-sources" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings/user-management" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              
              {/* Dashboard routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="overview" />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/overview" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="overview" />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/finance" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="finance" />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="clients" />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employees" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="employees" />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
