import React, { useState, useEffect } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { OverviewTab } from './OverviewTab';
import { FinanceTab } from './FinanceTab';
import { ClientsTab } from './ClientsTab';
import { EmployeesTab } from './EmployeesTab';
import { ProfileDropdown } from './ProfileDropdown';

interface DashboardProps {
  initialTab?: string;
}

export function Dashboard({ initialTab = 'overview' }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'finance':
        return <FinanceTab />;
      case 'clients':
        return <ClientsTab />;
      case 'employees':
        return <EmployeesTab />;
      default:
        return <OverviewTab />;
    }
  };

  // Pages that should not show header title and description
  const pagesWithoutHeader = ['finance', 'clients', 'employees'];
  const shouldShowHeader = !pagesWithoutHeader.includes(activeTab);

  return (
    <div className="min-h-screen flex w-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset className="flex-1 h-screen overflow-hidden flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          {shouldShowHeader && (
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold capitalize truncate text-slate-800">{activeTab}</h1>
              <p className="text-sm text-muted-foreground truncate">
                {activeTab === 'overview' && 'Overview of your financial data'}
              </p>
            </div>
          )}
          <div className="ml-auto">
            <ProfileDropdown />
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
          {renderActiveTab()}
        </div>
      </SidebarInset>
    </div>
  );
}