import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Building, Calendar, DollarSign, TrendingUp, Eye, EyeOff, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClientDashboardData {
  client: {
    id: string;
    name: string;
    email: string;
    industry: string;
  };
  permissions: {
    showIncomeGraph: boolean;
    showCategoryBreakdown: boolean;
    showPaymentHistory: boolean;
    showInvoices: boolean;
  };
  dashboard: {
    totalIncome: number;
    monthlyIncome: number;
    totalTransactions: number;
    categoryBreakdown: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
    recentTransactions: Array<{
      id: string;
      date: string;
      amount: string;
      description: string;
      status: string;
    }>;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export default function ClientDashboard() {
  const [token, setToken] = useState("");
  const [clientData, setClientData] = useState<ClientDashboardData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for token in URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const savedToken = localStorage.getItem('clientToken');
    
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem('clientToken', urlToken);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleAuthentication = async () => {
    try {
      const response = await apiRequest("/api/client-auth/verify", "POST", { token });
      setClientData(response);
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: `Welcome ${response.client.name}!`,
      });
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Invalid or expired token",
        variant: "destructive",
      });
      localStorage.removeItem('clientToken');
      setToken("");
    }
  };

  // Auto-authenticate if token exists
  useEffect(() => {
    if (token && !isAuthenticated) {
      handleAuthentication();
    }
  }, [token, isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClientData(null);
    setToken("");
    localStorage.removeItem('clientToken');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Auth form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Building className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>
              Enter your access token to view your financial dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                Access Token
              </label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your access token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button 
              onClick={handleAuthentication}
              disabled={!token}
              className="w-full"
            >
              Access Dashboard
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Contact your account manager if you need an access token
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{clientData.client.name}</h1>
                <p className="text-sm text-gray-500">{clientData.client.industry}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(clientData.dashboard.totalIncome)}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(clientData.dashboard.monthlyIncome)}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientData.dashboard.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">All time count</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          {data.permissions.showCategoryBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Revenue by Category
                </CardTitle>
                <CardDescription>
                  Breakdown of revenue by service categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.dashboard.categoryBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.dashboard.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {data.dashboard.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {data.dashboard.categoryBreakdown.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="text-sm">{category.name}</span>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(category.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          {data.permissions.showPaymentHistory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Your latest payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.dashboard.recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {data.dashboard.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(Number(transaction.amount))}</p>
                          <Badge 
                            variant={transaction.status === 'paid' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No transactions available
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Restricted Sections */}
          {!data.permissions.showCategoryBreakdown && !data.permissions.showPaymentHistory && (
            <Card className="lg:col-span-2">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <EyeOff className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">Limited Access</h3>
                  <p className="text-muted-foreground">
                    Contact your account manager to access additional dashboard features
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Invoices Section (if enabled) */}
        {data.permissions.showInvoices && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Invoices & Billing
              </CardTitle>
              <CardDescription>
                Manage your invoices and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Invoice management coming soon
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}