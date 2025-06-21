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

  // Data processing with proper type handling
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  
  const hierarchicalCategories = Array.isArray(categories) ? (categories as any[])?.map(cat => ({
    ...cat,
    displayName: cat.parentName ? `${cat.parentName} → ${cat.name}` : cat.name
  })) : [];

  const topSubscriptions = Array.isArray(subscriptions) ? (subscriptions as any[])
    ?.filter(sub => sub.subscriptionType === 'self')
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 5) : [];

  // Reset filters
  const resetFilters = () => {
    setTimeRange('1M');
    setSelectedCategory('all');
    setSelectedClient('all');
  };

  // Loading state
  if (summaryLoading || trendsLoading || clientLoading || expenseLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Updated {new Date().toLocaleDateString()}
            </div>
            <Button onClick={resetFilters} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex gap-2">
            {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
              <Button
                key={period}
                variant={timeRange === period ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(period)}
                className={timeRange === period ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Income */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${((summary as any)?.totalIncome || 0).toLocaleString()}
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${((summary as any)?.totalExpenses || 0).toLocaleString()}
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingDown className="w-4 h-4 mr-1" />
                -8% from last month
              </p>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${((summary as any)?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${((summary as any)?.netProfit || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Revenue minus all expenses
              </p>
            </CardContent>
          </Card>

          {/* Recurring Revenue */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recurring Revenue</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <RotateCcw className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${((summary as any)?.recurringRevenue || 0).toLocaleString()}
              </div>
              <p className="text-sm text-purple-600 mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Monthly subscription income
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income vs Expenses Trends */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Income vs Expenses Trend
              </CardTitle>
              <CardDescription>
                Monthly comparison of income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends as any[] || []}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)"
                    strokeWidth={2}
                    name="Income"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorExpenses)"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-purple-600" />
                Expense Breakdown
              </CardTitle>
              <CardDescription>
                Top expense categories this month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown as any[] || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {(expenseBreakdown as any[] || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Client Revenue Contribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Client Revenue Contribution
            </CardTitle>
            <CardDescription>
              Revenue breakdown by client for current period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(clientContribution as any[] || []).slice(0, 5).map((client, index) => (
                <div key={client.clientId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="font-medium text-gray-900">{client.clientName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${Number(client.totalRevenue).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{client.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Costs Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              Top Subscription Costs
            </CardTitle>
            <CardDescription>
              Highest recurring internal expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Service</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Billing Cycle</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Next Billing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSubscriptions.length > 0 ? (
                    topSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{subscription.name}</TableCell>
                        <TableCell className="font-semibold text-gray-900">${Number(subscription.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {subscription.billingCycle}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{subscription.categoryName || 'N/A'}</TableCell>
                        <TableCell className="text-gray-600">
                          {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No subscription data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}