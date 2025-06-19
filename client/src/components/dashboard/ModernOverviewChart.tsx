import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function ModernOverviewChart() {
  const { data: income = [] } = useQuery({
    queryKey: ['/api/income'],
  });

  const { data: spending = [] } = useQuery({
    queryKey: ['/api/spending'],
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  // Process data for chart
  const processDataForChart = () => {
    const monthlyData: { [key: string]: { month: string; income: number; expenses: number; subscriptions: number } } = {};

    // Process income
    income.forEach((item: any) => {
      if (item.date) {
        const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expenses: 0, subscriptions: 0 };
        }
        monthlyData[month].income += parseFloat(item.amount || 0);
      }
    });

    // Process spending
    spending.forEach((item: any) => {
      if (item.date) {
        const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expenses: 0, subscriptions: 0 };
        }
        monthlyData[month].expenses += parseFloat(item.amount || 0);
      }
    });

    // Process subscriptions
    subscriptions.forEach((item: any) => {
      if (item.startDate) {
        const month = new Date(item.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expenses: 0, subscriptions: 0 };
        }
        monthlyData[month].subscriptions += parseFloat(item.amount || 0);
      }
    });

    return Object.values(monthlyData).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const chartData = processDataForChart();

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <div className="text-center">
          <p>No financial data available</p>
          <p className="text-sm">Add some income or expenses to see the chart</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend />
        <Bar dataKey="income" fill="#22c55e" name="Income" />
        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
        <Bar dataKey="subscriptions" fill="#8b5cf6" name="Subscriptions" />
      </BarChart>
    </ResponsiveContainer>
  );
}