import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeTab } from './IncomeTab';
import { ExpensesTab } from './ExpensesTab';
import { SubscriptionsTab } from './SubscriptionsTab';

export function FinanceTab() {
  const [activeTab, setActiveTab] = useState('income');

  return (
    <div className="flex-1 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Finance</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your income, expenses, and subscriptions
          </p>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="income" className="h-full m-0">
            <IncomeTab />
          </TabsContent>
          <TabsContent value="expenses" className="h-full m-0">
            <ExpensesTab />
          </TabsContent>
          <TabsContent value="subscriptions" className="h-full m-0">
            <SubscriptionsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}