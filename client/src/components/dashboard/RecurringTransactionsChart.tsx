
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Repeat } from 'lucide-react';

export function RecurringTransactionsChart() {
  // Fetch recurring income
  const { data: recurringIncome = [] } = useQuery({
    queryKey: ['recurring-income'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('is_recurring', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch recurring expenses
  const { data: recurringExpenses = [] } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spending')
        .select('*')
        .eq('is_recurring', true);
      if (error) throw error;
      return data;
    },
  });

  // Generate chart data for the next 12 months
  const generateChartData = () => {
    const chartData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const targetDate = addMonths(currentDate, i);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);
      
      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      
      // Calculate projected income for this month
      recurringIncome.forEach((income) => {
        const amount = Number(income.amount);
        const frequency = income.recurring_frequency;
        const startDate = parseISO(income.date);
        const endDate = income.recurring_end_date ? parseISO(income.recurring_end_date) : null;
        
        // Skip if recurring period has ended
        if (endDate && monthStart > endDate) return;
        
        // Skip if recurring hasn't started yet
        if (startDate > monthEnd) return;
        
        switch (frequency) {
          case 'daily':
            monthlyIncome += amount * 30; // Approximate monthly amount
            break;
          case 'weekly':
            monthlyIncome += amount * 4; // Approximate monthly amount
            break;
          case 'monthly':
            monthlyIncome += amount;
            break;
          case 'yearly':
            monthlyIncome += amount / 12; // Monthly portion of yearly amount
            break;
        }
      });
      
      // Calculate projected expenses for this month
      recurringExpenses.forEach((expense) => {
        const amount = Number(expense.amount);
        const frequency = expense.recurring_frequency;
        const startDate = parseISO(expense.date);
        const endDate = expense.recurring_end_date ? parseISO(expense.recurring_end_date) : null;
        
        // Skip if recurring period has ended
        if (endDate && monthStart > endDate) return;
        
        // Skip if recurring hasn't started yet
        if (startDate > monthEnd) return;
        
        switch (frequency) {
          case 'daily':
            monthlyExpenses += amount * 30;
            break;
          case 'weekly':
            monthlyExpenses += amount * 4;
            break;
          case 'monthly':
            monthlyExpenses += amount;
            break;
          case 'yearly':
            monthlyExpenses += amount / 12;
            break;
        }
      });
      
      chartData.push({
        month: format(targetDate, 'MMM yyyy'),
        income: Math.round(monthlyIncome),
        expenses: Math.round(monthlyExpenses),
        net: Math.round(monthlyIncome - monthlyExpenses)
      });
    }
    
    return chartData;
  };

  const chartData = generateChartData();
  const totalRecurringIncome = recurringIncome.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalRecurringExpenses = recurringExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recurring Income</p>
                <p className="text-2xl font-bold text-green-600">${totalRecurringIncome.toLocaleString()}</p>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-5 w-5 mr-1" />
                <Repeat className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recurring Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totalRecurringExpenses.toLocaleString()}</p>
              </div>
              <div className="flex items-center text-red-600">
                <TrendingDown className="h-5 w-5 mr-1" />
                <Repeat className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Recurring</p>
                <p className={`text-2xl font-bold ${totalRecurringIncome - totalRecurringExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(totalRecurringIncome - totalRecurringExpenses).toLocaleString()}
                </p>
              </div>
              <div className={`flex items-center ${totalRecurringIncome - totalRecurringExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalRecurringIncome - totalRecurringExpenses >= 0 ? (
                  <TrendingUp className="h-5 w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-1" />
                )}
                <Repeat className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Transactions Timeline (Next 12 Months)
          </CardTitle>
          <CardDescription>
            Projected monthly recurring income vs expenses based on your current recurring transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  name="Recurring Income"
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  name="Recurring Expenses"
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Net (Income - Expenses)"
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
