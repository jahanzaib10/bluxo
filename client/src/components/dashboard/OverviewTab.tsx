import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { ModernOverviewChart } from './ModernOverviewChart';
import { RecurringTransactionsChart } from './RecurringTransactionsChart';

export function OverviewTab() {
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: income = [] } = useQuery({
    queryKey: ['/api/income'],
  });

  const { data: spending = [] } = useQuery({
    queryKey: ['/api/spending'],
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  // Calculate totals
  const totalIncome = income.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
  const totalSpending = spending.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
  const totalSubscriptions = subscriptions.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
  const netBalance = totalIncome - totalSpending - totalSubscriptions;

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-green-600">
              {income.length} income entries
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Spending</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              ${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-red-600">
              {spending.length} expense entries
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              ${totalSubscriptions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-purple-600">
              {subscriptions.length} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${netBalance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Net Balance</CardTitle>
            <DollarSign className={`h-4 w-4 ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {netBalance >= 0 ? 'Positive balance' : 'Deficit'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ModernOverviewChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecurringTransactionsChart />
          </CardContent>
        </Card>
      </div>

      {/* Categories Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Categories Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((category: any) => (
              <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.type}</p>
                </div>
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-gray-500 text-center py-8">No categories found. Add some categories to see them here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}