import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Calendar,
  Users,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('1M');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');

  // Fetch dashboard data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/dashboard/trends'],
  });

  const { data: clientContribution, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/dashboard/client-contribution'],
  });

  const { data: expenseBreakdown, isLoading: expenseLoading } = useQuery({
    queryKey: ['/api/dashboard/expense-breakdown'],
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format chart data for trends
  const chartData = trends?.map(trend => ({
    month: new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    income: trend.income,
    expenses: trend.expenses
  })) || [];

  // Pie chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // Get top 5 subscriptions for subscription costs section
  const topSubscriptions = (Array.isArray(subscriptions) ? subscriptions : [])
    .filter(sub => sub.subscriptionType === 'self')
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 5);

  // Reset filters
  const resetFilters = () => {
    setTimeRange('1M');
    setSelectedCategory('all');
    setSelectedClient('all');
  };

  if (summaryLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Real-time business performance and financial intelligence</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1W">1 Week</SelectItem>
                  <SelectItem value="1M">1 Month</SelectItem>
                  <SelectItem value="3M">3 Months</SelectItem>
                  <SelectItem value="6M">6 Months</SelectItem>
                  <SelectItem value="1Y">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(Array.isArray(categories) ? categories : []).map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.parentName ? `${category.parentName} → ${category.name}` : category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {(Array.isArray(clients) ? clients : []).map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Operating costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary?.netProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses - Client Subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring Revenue</CardTitle>
            <RotateCcw className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary?.recurringRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Recurring income streams</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Income vs Expense Trends
            </CardTitle>
            <CardDescription>Monthly comparison over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Income"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Expense Breakdown by Category
            </CardTitle>
            <CardDescription>Top 5 expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ category, amount }) => `${category}: ${formatCurrency(amount)}`}
                  >
                    {expenseBreakdown?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Revenue Contribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Revenue Contribution
            </CardTitle>
            <CardDescription>Revenue breakdown by client</CardDescription>
          </CardHeader>
          <CardContent>
            {clientLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {(clientContribution || []).slice(0, 5).map((client, index) => (
                  <div key={client.clientId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-medium">{client.clientName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(client.totalIncome)}</div>
                      <div className="text-sm text-muted-foreground">{client.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Subscription Costs
            </CardTitle>
            <CardDescription>Top recurring expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Next Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.name}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(subscription.amount))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscription.billingCycle}</Badge>
                    </TableCell>
                    <TableCell>{subscription.nextDueDate || 'Not set'}</TableCell>
                  </TableRow>
                ))}
                {topSubscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No subscription data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}