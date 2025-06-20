import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subscription",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalSubscriptions = Array.isArray(subscriptions) ? subscriptions.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading subscription data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Subscription Management</h2>
            <p className="text-sm text-muted-foreground">Track your recurring subscriptions and payments</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              ${totalSubscriptions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-purple-600">
              {Array.isArray(subscriptions) ? subscriptions.length : 0} active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {Array.isArray(subscriptions) && subscriptions.length > 0 ? (
          <div className="grid gap-4">
            {subscriptions.map((item: any) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{item.name || 'Subscription'}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Amount: <strong className="text-purple-600">${parseFloat(item.amount || 0).toLocaleString()}</strong></span>
                        <span>Billing: {item.billingCycle || 'Monthly'}</span>
                        {item.startDate && <span>Started: {formatDate(item.startDate)}</span>}
                        {item.nextBillingDate && <span>Next: {formatDate(item.nextBillingDate)}</span>}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
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
            <CreditCard className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No subscriptions found</h3>
            <p className="text-sm text-center mb-4">
              Start tracking your recurring subscriptions and payments
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Subscription
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}