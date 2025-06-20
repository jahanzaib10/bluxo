import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
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
  const { data: incomeData = [] } = useQuery({
    queryKey: ['/api/income'],
  });

  const { data: spendingData = [] } = useQuery({
    queryKey: ['/api/spending'],
  });

  const { data: subscriptionsData = [] } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  // Process and filter data based on filters and date range
  const chartData = React.useMemo(() => {
    if (!Array.isArray(incomeData) || !Array.isArray(spendingData)) return [];

    // Filter data based on date range and other filters
    const filteredIncome = incomeData.filter((item: any) => {
      const itemDate = new Date(item.date);
      const inDateRange = itemDate >= dateRange.from && itemDate <= dateRange.to;
      const clientMatch = !selectedClient || item.clientId === selectedClient;
      return inDateRange && clientMatch;
    });

    const filteredSpending = spendingData.filter((item: any) => {
      const itemDate = new Date(item.date);
      const inDateRange = itemDate >= dateRange.from && itemDate <= dateRange.to;
      const employeeMatch = !selectedEmployee || item.employeeId === selectedEmployee;
      const categoryMatch = !selectedCategory || item.categoryId === selectedCategory;
      return inDateRange && employeeMatch && categoryMatch;
    });

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
            periodKey = format(startOfYear(currentDate), 'yyyy');
            periodLabel = format(currentDate, 'yyyy');
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default: // month
            periodKey = format(startOfMonth(currentDate), 'yyyy-MM');
            periodLabel = format(currentDate, 'MMM yyyy');
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
        
        if (!periods[periodKey]) {
          periods[periodKey] = { period: periodLabel, income: 0, expenses: 0 };
        }
      }
    };

    generatePeriods();

    // Aggregate income data
    filteredIncome.forEach((item: any) => {
      const itemDate = parseISO(item.date);
      let periodKey: string;
      
      switch (timeRange) {
        case 'day':
          periodKey = format(itemDate, 'yyyy-MM-dd');
          break;
        case 'week':
          periodKey = format(startOfWeek(itemDate), 'yyyy-MM-dd');
          break;
        case 'quarter':
          periodKey = format(startOfQuarter(itemDate), 'yyyy-MM');
          break;
        case 'year':
          periodKey = format(startOfYear(itemDate), 'yyyy');
          break;
        default: // month
          periodKey = format(startOfMonth(itemDate), 'yyyy-MM');
          break;
      }
      
      if (periods[periodKey]) {
        periods[periodKey].income += parseFloat(item.amount || 0);
      }
    });

    // Aggregate spending data
    filteredSpending.forEach((item: any) => {
      const itemDate = parseISO(item.date);
      let periodKey: string;
      
      switch (timeRange) {
        case 'day':
          periodKey = format(itemDate, 'yyyy-MM-dd');
          break;
        case 'week':
          periodKey = format(startOfWeek(itemDate), 'yyyy-MM-dd');
          break;
        case 'quarter':
          periodKey = format(startOfQuarter(itemDate), 'yyyy-MM');
          break;
        case 'year':
          periodKey = format(startOfYear(itemDate), 'yyyy');
          break;
        default: // month
          periodKey = format(startOfMonth(itemDate), 'yyyy-MM');
          break;
      }
      
      if (periods[periodKey]) {
        periods[periodKey].expenses += parseFloat(item.amount || 0);
      }
    });

    return Object.values(periods)
      .map(period => ({
        ...period,
        net: period.income - period.expenses
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [incomeData, spendingData, dateRange, timeRange, selectedClient, selectedEmployee, selectedCategory]);

  // Calculate totals and trends
  const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const netIncome = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

  // Calculate trend (comparing first half to second half)
  const midPoint = Math.floor(chartData.length / 2);
  const firstHalf = chartData.slice(0, midPoint);
  const secondHalf = chartData.slice(midPoint);
  
  const firstHalfNet = firstHalf.reduce((sum, item) => sum + item.net, 0) / Math.max(firstHalf.length, 1);
  const secondHalfNet = secondHalf.reduce((sum, item) => sum + item.net, 0) / Math.max(secondHalf.length, 1);
  const trendPercentage = firstHalfNet !== 0 ? ((secondHalfNet - firstHalfNet) / Math.abs(firstHalfNet)) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Summary Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {chartData.length} periods
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Operational costs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          {netIncome >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}% margin
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trend</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Period over period
          </p>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>
            Financial performance over {timeRange}ly periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stackId="1"
                  stroke={chartConfig.income.color}
                  fill={chartConfig.income.color}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke={chartConfig.expenses.color}
                  fill={chartConfig.expenses.color}
                  fillOpacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke={chartConfig.net.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.net.color, strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}