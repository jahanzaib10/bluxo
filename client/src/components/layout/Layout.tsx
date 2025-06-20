import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Users, 
  UserCheck, 
  Settings, 
  Menu,
  Search,
  Moon,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import ProfileDropdown from '@/components/ProfileDropdown';

interface LayoutProps {
  children: React.ReactNode;
}

const mainNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/expenses', label: 'Expenses', icon: TrendingDown },
  { path: '/subscriptions', label: 'Subscriptions', icon: RotateCcw },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/employees', label: 'Employees', icon: UserCheck },
];

const settingsNavItems = [
  { path: '/settings/profile', label: 'Profile' },
  { path: '/settings/security', label: 'Security' },
  { path: '/settings/organization', label: 'Organization' },
  { path: '/settings/categories', label: 'Categories' },
  { path: '/settings/payment-sources', label: 'Payment Sources' },
  { path: '/settings/user-management', label: 'User Management' },
];

export function Layout({ children }: LayoutProps) {
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [location] = useLocation();

  const isActivePath = (path: string) => {
    if (!location) return false;
    return location === path || (path !== '/dashboard' && location.startsWith(path));
  };

  const isSettingsPath = () => {
    return location.startsWith('/settings');
  };

  const handleLogout = () => {
    // Clear authentication data immediately
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    localStorage.removeItem('auth_token');
    
    // Force a complete page reload to clear all state
    window.location.href = '/login';
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Auto-expand settings if we're on a settings page
  React.useEffect(() => {
    if (isSettingsPath()) {
      setSettingsExpanded(true);
    }
  }, [location]);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-slate-900 dark:bg-slate-950">
      {/* Header with Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-700/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">FIN</span>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search"
            className="pl-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {/* Main Navigation Items */}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* Settings Section */}
        <div className="mt-6">
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isSettingsPath() 
                ? "bg-blue-600 text-white" 
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 shrink-0" />
              <span>Settings</span>
            </div>
            {settingsExpanded || isSettingsPath() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Settings Submenu */}
          {(settingsExpanded || isSettingsPath()) && (
            <div className="ml-8 mt-1 space-y-1">
              {settingsNavItems.map((item) => {
                const isActive = isActivePath(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                        isActive 
                          ? "bg-slate-700 text-white" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                      )}
                    >
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-700/50 space-y-4">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-slate-300" />
            <span className="text-sm font-medium text-slate-300">Dark Mode</span>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user.name || user.email || ''} />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {getUserInitials(user.name || user.email || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-6 border-b bg-background">
          <div className="flex items-center gap-4">
            {/* Mobile menu button space */}
            <div className="w-10 md:hidden" />
          </div>
          
          <div className="flex items-center gap-4">
            <ProfileDropdown />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;