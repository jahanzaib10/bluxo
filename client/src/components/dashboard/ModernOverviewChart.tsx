
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react';

interface ModernOverviewChartProps {
  selectedClient?: string;
  selectedEmployee?: string;
  selectedCategory?: string;
  dateRange: { from: Date; to: Date };
  timeRange: string;
}

const chartConfig = {
  income: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  net: {
    label: "Net Income",
    color: "hsl(var(--chart-3))",
  },
} as const;

export function ModernOverviewChart({ selectedClient, selectedEmployee, selectedCategory, dateRange, timeRange }: ModernOverviewChartProps) {
  const { data: chartData = [] } = useQuery({
    queryKey: ['overview-chart', selectedClient, selectedEmployee, selectedCategory, dateRange, timeRange],
    queryFn: async () => {
      // Get income data with filters
      let incomeQuery = supabase
        .from('income')
        .select('amount, date, client_id')
        .eq('archived', false)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));
      
      if (selectedClient) {
        incomeQuery = incomeQuery.eq('client_id', selectedClient);
      }

      const { data: incomeData, error: incomeError } = await incomeQuery;
      if (incomeError) throw incomeError;

      // Get expenses data with filters
      let expensesQuery = supabase
        .from('spending')
        .select('amount, date, employee_id, category_id')
        .eq('archived', false)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));
      
      if (selectedEmployee) {
        expensesQuery = expensesQuery.eq('employee_id', selectedEmployee);
      }
      
      if (selectedCategory) {
        expensesQuery = expensesQuery.eq('category_id', selectedCategory);
      }

      const { data: expensesData, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;

      // Group by time range
      const periods: { [key: string]: { period: string; income: number; expenses: number } } = {};
      
      // Generate periods based on timeRange
      const generatePeriods = () => {
        let currentDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        
        while (currentDate <= endDate) {
          let periodKey: string;
          let periodLabel: string;
          
          switch (timeRange) {
            case 'day':
              periodKey = format(currentDate, 'yyyy-MM-dd');
              periodLabel = format(currentDate, 'MMM dd');
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            case 'week':
              periodKey = format(startOfWeek(currentDate), 'yyyy-MM-dd');
              periodLabel = format(startOfWeek(currentDate), 'MMM dd');
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'quarter':
              periodKey = format(startOfQuarter(currentDate), 'yyyy-MM');
              periodLabel = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${format(currentDate, 'yyyy')}`;
              currentDate.setMonth(currentDate.getMonth() + 3);
              break;
            case 'year':
              periodKey = format(currentDate, 'yyyy');
              periodLabel = format(currentDate, 'yyyy');
              currentDate.setFullYear(currentDate.getFullYear() + 1);
              break;
            default: // month
              periodKey = format(currentDate, 'yyyy-MM');
              periodLabel = format(currentDate, 'MMM yyyy');
              currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          periods[periodKey] = {
            period: periodLabel,
            income: 0,
            expenses: 0,
          };
        }
      };
      
      generatePeriods();

      // Calculate totals
      incomeData?.forEach((income) => {
        const incomeDate = parseISO(income.date);
        let periodKey: string;
        
        switch (timeRange) {
          case 'day':
            periodKey = format(incomeDate, 'yyyy-MM-dd');
            break;
          case 'week':
            periodKey = format(startOfWeek(incomeDate), 'yyyy-MM-dd');
            break;
          case 'quarter':
            periodKey = format(startOfQuarter(incomeDate), 'yyyy-MM');
            break;
          case 'year':
            periodKey = format(incomeDate, 'yyyy');
            break;
          default: // month
            periodKey = format(incomeDate, 'yyyy-MM');
        }
        
        if (periods[periodKey]) {
          periods[periodKey].income += Number(income.amount);
        }
      });

      expensesData?.forEach((expense) => {
        const expenseDate = parseISO(expense.date);
        let periodKey: string;
        
        switch (timeRange) {
          case 'day':
            periodKey = format(expenseDate, 'yyyy-MM-dd');
            break;
          case 'week':
            periodKey = format(startOfWeek(expenseDate), 'yyyy-MM-dd');
            break;
          case 'quarter':
            periodKey = format(startOfQuarter(expenseDate), 'yyyy-MM');
            break;
          case 'year':
            periodKey = format(expenseDate, 'yyyy');
            break;
          default: // month
            periodKey = format(expenseDate, 'yyyy-MM');
        }
        
        if (periods[periodKey]) {
          periods[periodKey].expenses += Number(expense.amount);
        }
      });

      return Object.values(periods).map(period => ({
        period: period.period,
        income: Math.round(period.income),
        expenses: Math.round(period.expenses),
        net: Math.round(period.income - period.expenses),
      }));
    },
  });

  const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Summary Cards - Moved Above */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Selected period</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Selected period</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netIncome.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Selected period</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <BarChart3 className={`h-6 w-6 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Chart - Reduced Height */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Revenue vs Expenses Breakdown
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Compare your income and expenses over time
                {(selectedClient || selectedEmployee || selectedCategory) && " (filtered)"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        name === 'income' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Net Income'
                      ]}
                    />
                  }
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={3}
                  fill="url(#incomeGradient)"
                  dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fill="url(#expensesGradient)"
                  dot={{ fill: "hsl(0, 84%, 60%)", strokeWidth: 2, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
