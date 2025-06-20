import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeTab } from './IncomeTab';
import { ExpensesTab } from './ExpensesTab';
import { SubscriptionsTab } from './SubscriptionsTab';

export function FinanceTab() {
  const [activeTab, setActiveTab] = useState('income');

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="h-full">
              <IncomeTab />
            </TabsContent>

            <TabsContent value="expenses" className="h-full">
              <ExpensesTab />
            </TabsContent>

            <TabsContent value="subscriptions" className="h-full">
              <SubscriptionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}