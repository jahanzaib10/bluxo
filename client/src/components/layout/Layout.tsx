import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { UserButton } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  RefreshCw,
  Users,
  UserCircle,
  Settings,
  Menu,
  Search,
  Moon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';
import { OrgSwitcher } from './OrgSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Income', href: '/income', icon: DollarSign },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Subscriptions', href: '/subscriptions', icon: RefreshCw },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'People', href: '/employees', icon: UserCircle },
];

const settingsItems = [
  { name: 'Profile', href: '/settings/profile' },
  { name: 'Organization', href: '/settings/organization' },
  { name: 'Categories', href: '/settings/categories' },
  { name: 'Payment Sources', href: '/settings/payment-sources' },
  { name: 'User Management', href: '/settings/user-management' },
];

export function Layout({ children }: LayoutProps) {
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const isActivePath = (path: string) => {
    if (!location) return false;
    return location === path || (path !== '/dashboard' && location.startsWith(path));
  };

  const isSettingsPath = () => {
    return location.startsWith('/settings');
  };

  // Auto-expand settings if we're on a settings page
  React.useEffect(() => {
    if (isSettingsPath()) {
      setSettingsExpanded(true);
    }
  }, [location]);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-slate-900 dark:bg-slate-950">
      {/* Header with Logo and Org Switcher */}
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-4">Bluxo</h1>
        <OrgSwitcher />
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
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
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
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
              {settingsItems.map((item) => {
                const isActive = isActivePath(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                        isActive
                          ? "bg-slate-700 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                      )}
                    >
                      {item.name}
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

        {/* User Profile via Clerk */}
        <div className="p-4 border-t border-slate-700">
          <UserButton
            appearance={{
              baseTheme: dark,
              elements: {
                userButtonBox: "w-full",
                userButtonTrigger: "w-full justify-start",
              },
            }}
          />
        </div>
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
            <UserButton
              appearance={{
                baseTheme: dark,
                elements: {
                  userButtonBox: "",
                  userButtonTrigger: "",
                },
              }}
            />
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
