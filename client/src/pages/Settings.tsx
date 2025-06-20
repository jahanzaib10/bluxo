import React from 'react';
import { useLocation, Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Lock, 
  Building, 
  Users, 
  Tag,
  CreditCard
} from 'lucide-react';
import ProfileSettings from '@/pages/settings/ProfileSettings';
import SecuritySettings from '@/pages/settings/SecuritySettings';
import OrganizationSettings from '@/pages/settings/OrganizationSettings';
import CategoriesSettings from '@/pages/settings/CategoriesSettings';
import PaymentSourcesSettings from '@/pages/settings/PaymentSourcesSettings';
import UserManagement from '@/pages/settings/UserManagement';

interface SettingsProps {
  defaultTab?: string;
}

export default function Settings({ defaultTab }: SettingsProps) {
  const [location, navigate] = useLocation();
  
  // Extract the tab from the current route
  const getCurrentTab = () => {
    if (defaultTab) return defaultTab;
    
    const pathSegments = location.split('/');
    const settingsIndex = pathSegments.indexOf('settings');
    
    if (settingsIndex !== -1 && pathSegments.length > settingsIndex + 1) {
      return pathSegments[settingsIndex + 1];
    }
    
    return 'profile'; // Default tab
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (value: string) => {
    navigate(`/settings/${value}`);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-6xl">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Settings</h3>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
          
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="organization" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="payment-sources" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Sources
              </TabsTrigger>
              <TabsTrigger value="user-management" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4">
              <ProfileSettings />
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <SecuritySettings />
            </TabsContent>
            
            <TabsContent value="organization" className="space-y-4">
              <OrganizationSettings />
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <CategoriesSettings />
            </TabsContent>
            
            <TabsContent value="payment-sources" className="space-y-4">
              <PaymentSourcesSettings />
            </TabsContent>
            
            <TabsContent value="user-management" className="space-y-4">
              <UserManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}