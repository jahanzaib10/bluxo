
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import InviteAcceptance from "./pages/InviteAcceptance";
import DebugInvitation from "./pages/DebugInvitation";
import NotFound from "./pages/NotFound";
import { Settings } from "./pages/settings/Settings";
import { queryClient } from "./lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/signup" element={<SignupPage />} />
              <Route path="/invite/:token" element={<InviteAcceptance />} />
              <Route path="/debug-invitation" element={<DebugInvitation />} />
              
              {/* Protected Settings routes with role-based access */}
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
                  <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings/organization" 
                element={
                  <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings/invitations" 
                element={
                  <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Dashboard routes */}
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
                path="/income" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="income" />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/expenses" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="expenses" />
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
              <Route 
                path="/developers" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="developers" />
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard tab="reports" />
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
