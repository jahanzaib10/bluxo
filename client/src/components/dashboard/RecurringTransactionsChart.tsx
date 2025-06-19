import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function RecurringTransactionsChart() {
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  // Process subscriptions for pie chart
  const chartData = Array.isArray(subscriptions) ? subscriptions.map((sub: any, index: number) => ({
    name: sub.name || `Subscription ${index + 1}`,
    value: parseFloat(sub.amount || 0),
    color: COLORS[index % COLORS.length]
  })).filter((item: any) => item.value > 0) : [];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <div className="text-center">
          <p>No recurring subscriptions</p>
          <p className="text-sm">Add some subscriptions to see the breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}