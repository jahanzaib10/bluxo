
import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown';
import { GeneralSettings } from './GeneralSettings';
import { CategoriesSettings } from './CategoriesSettings';
import { PaymentSourcesSettings } from './PaymentSourcesSettings';
import { UserManagementSettings } from './UserManagementSettings';

export function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/settings' || path === '/settings/general') return 'general';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/payment-sources')) return 'payment-sources';
    if (path.includes('/user-management')) return 'user-management';
    return 'general';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'general':
        navigate('/settings');
        break;
      case 'categories':
        navigate('/settings/categories');
        break;
      case 'payment-sources':
        navigate('/settings/payment-sources');
        break;
      case 'user-management':
        navigate('/settings/user-management');
        break;
    }
  };

  return (
    <div className="min-h-screen flex w-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      <AppSidebar activeTab="settings" onTabChange={() => {}} />
      <SidebarInset className="flex-1 h-screen overflow-hidden flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold capitalize truncate text-slate-800">Settings</h1>
            <p className="text-sm text-muted-foreground truncate">
              Application settings
            </p>
          </div>
          <div className="ml-auto">
            <ProfileDropdown />
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
          <div className="w-full max-w-full h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="payment-sources">Payment Sources</TabsTrigger>
                    <TabsTrigger value="user-management">User Management</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general">
                    <GeneralSettings />
                  </TabsContent>

                  <TabsContent value="categories">
                    <CategoriesSettings />
                  </TabsContent>

                  <TabsContent value="payment-sources">
                    <PaymentSourcesSettings />
                  </TabsContent>

                  <TabsContent value="user-management">
                    <UserManagementSettings />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
