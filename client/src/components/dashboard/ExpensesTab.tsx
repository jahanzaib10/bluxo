import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, TrendingDown } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function ExpensesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: spending = [], isLoading } = useQuery({
    queryKey: ['/api/spending'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/spending/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spending'] });
      toast({
        title: "Success",
        description: "Expense record deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = Array.isArray(categories) ? categories.find((cat: any) => cat.id === categoryId) : null;
    return category?.name || 'Unknown Category';
  };

  const totalSpending = Array.isArray(spending) ? spending.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading expense data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Expense Management</h2>
            <p className="text-sm text-muted-foreground">Track your expenses and spending</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
        
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center">
              <TrendingDown className="mr-2 h-4 w-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              ${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-red-600">
              {Array.isArray(spending) ? spending.length : 0} expense entries
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {Array.isArray(spending) && spending.length > 0 ? (
          <div className="grid gap-4">
            {spending.map((item: any) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{item.description || 'Expense Entry'}</h3>
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                          {getCategoryName(item.categoryId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Amount: <strong className="text-red-600">${parseFloat(item.amount || 0).toLocaleString()}</strong></span>
                        <span>Date: {formatDate(item.date)}</span>
                        {item.vendor && <span>Vendor: {item.vendor}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <TrendingDown className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No expense records found</h3>
            <p className="text-sm text-center mb-4">
              Start tracking your expenses by adding your first entry
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Expense
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}