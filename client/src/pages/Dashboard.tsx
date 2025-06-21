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
  const [timeRange, setTimeRange] = useState('3M');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');

  // Fetch dashboard data with filter parameters
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/dashboard/summary', { timeRange, selectedClient, selectedCategory }],
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/dashboard/trends', { timeRange, selectedClient, selectedCategory }],
  });

  const { data: clientContribution, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/dashboard/client-contribution', { timeRange, selectedClient }],
  });

  const { data: expenseBreakdown, isLoading: expenseLoading } = useQuery({
    queryKey: ['/api/dashboard/expense-breakdown', { timeRange, selectedClient, selectedCategory }],
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
    setTimeRange('3M');
    setSelectedCategory('all');
    setSelectedClient('all');
  };

  // Loading state
  if (summaryLoading || trendsLoading || clientLoading || expenseLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Compact Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Financial overview and business intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString()}
            </div>
            <Button onClick={resetFilters} variant="outline" size="sm" className="flex items-center gap-2">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>

        {/* Compact Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-700">Filters:</span>
              
              {/* Time Range */}
              <div className="flex gap-1">
                {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                  <Button
                    key={period}
                    variant={timeRange === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(period)}
                    className={`h-7 px-3 text-xs ${timeRange === period ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  >
                    {period}
                  </Button>
                ))}
              </div>

              {/* Client Filter */}
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[140px] h-7 text-xs">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {Array.isArray(clients) && (clients as any[]).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px] h-7 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {hierarchicalCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compact KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Income */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-gray-600">Total Income</CardTitle>
              <div className="p-1.5 bg-green-100 rounded-md">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-gray-900">
                ${((summary as any)?.totalIncome || 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% vs last period
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-gray-600">Total Expenses</CardTitle>
              <div className="p-1.5 bg-red-100 rounded-md">
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-gray-900">
                ${((summary as any)?.totalExpenses || 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" />
                -8% vs last period
              </p>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-gray-600">Net Profit</CardTitle>
              <div className="p-1.5 bg-blue-100 rounded-md">
                <DollarSign className="h-3 w-3 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className={`text-xl font-bold ${((summary as any)?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${((summary as any)?.netProfit || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Income - Expenses
              </p>
            </CardContent>
          </Card>

          {/* Recurring Revenue */}
          <Card className="relative overflow-hidden border-0 shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-gray-600">Recurring Revenue</CardTitle>
              <div className="p-1.5 bg-purple-100 rounded-md">
                <RotateCcw className="h-3 w-3 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-gray-900">
                ${((summary as any)?.recurringRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-purple-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Monthly subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compact Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Income vs Expenses Trends */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Income vs Expenses Trend
              </CardTitle>
              <CardDescription className="text-xs">
                Monthly financial performance
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={240}>
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
                    fontSize={10}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={10}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                    labelStyle={{ color: '#374151', fontSize: '12px' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }}
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <PieChartIcon className="h-4 w-4 text-purple-600" />
                Expense Breakdown
              </CardTitle>
              <CardDescription className="text-xs">
                Top expense categories
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown as any[] || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {(expenseBreakdown as any[] || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Client Revenue Contribution - Compact */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-purple-600" />
              Client Revenue Contribution
            </CardTitle>
            <CardDescription className="text-xs">
              Top revenue-generating clients
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {(clientContribution as any[] || []).slice(0, 5).map((client, index) => (
                <div key={client.clientId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm font-medium text-gray-900">{client.clientName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">${Number(client.totalRevenue).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{client.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Costs Table - Compact */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4 text-purple-600" />
              Top Subscription Costs
            </CardTitle>
            <CardDescription className="text-xs">
              Highest recurring expenses
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-8 text-xs font-semibold">Service</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Amount</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Cycle</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Category</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Next Billing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSubscriptions.length > 0 ? (
                    topSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs font-medium py-2">{subscription.name}</TableCell>
                        <TableCell className="text-xs font-semibold text-gray-900 py-2">${Number(subscription.amount).toLocaleString()}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {subscription.billingCycle}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-2">{subscription.categoryName || 'N/A'}</TableCell>
                        <TableCell className="text-xs text-gray-600 py-2">
                          {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-4 text-xs">
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