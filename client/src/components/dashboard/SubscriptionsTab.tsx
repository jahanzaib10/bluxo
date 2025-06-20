import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, CreditCard, Search, RotateCcw, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export function SubscriptionsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    nextDueDate: '',
    categoryId: '',
    type: 'Company',
    recurringEndDate: '',
    paymentReceiverId: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: paymentSources = [] } = useQuery({
    queryKey: ['/api/payment-sources'],
  });

  const createSubscription = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/subscriptions', {
        ...data,
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      setShowForm(false);
      resetFormData();
      toast({ title: "Success", description: "Subscription added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest('PUT', `/api/subscriptions/${id}`, {
        ...data,
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      setShowForm(false);
      setEditingSubscription(null);
      resetFormData();
      toast({ title: "Success", description: "Subscription updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Success", description: "Subscription deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetFormData = () => {
    setFormData({
      name: '',
      amount: '',
      billingCycle: 'monthly',
      nextDueDate: '',
      categoryId: '',
      type: 'Company',
      recurringEndDate: '',
      paymentReceiverId: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubscription) {
      updateSubscription.mutate({ id: editingSubscription.id, ...formData });
    } else {
      createSubscription.mutate(formData);
    }
  };

  const handleEdit = (subscription: any) => {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription.name || '',
      amount: subscription.amount?.toString() || '',
      billingCycle: subscription.billingCycle || 'monthly',
      nextDueDate: subscription.nextDueDate || '',
      categoryId: subscription.categoryId || '',
      type: subscription.type || 'Company',
      recurringEndDate: subscription.recurringEndDate || '',
      paymentReceiverId: subscription.paymentReceiverId || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription.mutate(id);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = Array.isArray(categories) ? categories.find((c: any) => c.id === categoryId) : null;
    return category?.name || 'Unknown Category';
  };

  const getPaymentSourceName = (paymentSourceId: string) => {
    const paymentSource = Array.isArray(paymentSources) ? paymentSources.find((ps: any) => ps.id === paymentSourceId) : null;
    return paymentSource?.name || 'Unknown Payment Source';
  };

  const filteredSubscriptions = useMemo(() => {
    if (!Array.isArray(subscriptions)) return [];
    return subscriptions.filter((subscription: any) => 
      subscription.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      getCategoryName(subscription.categoryId).toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [subscriptions, searchValue, categories]);

  const totalMonthlyAmount = Array.isArray(subscriptions) ? subscriptions.reduce((sum: number, sub: any) => {
    const amount = parseFloat(sub.amount || 0);
    return sum + (sub.billingCycle === 'yearly' ? amount / 12 : amount);
  }, 0) : 0;

  const totalYearlyAmount = totalMonthlyAmount * 12;

  const getNextDueDate = (nextDueDate: string) => {
    if (!nextDueDate) return 'Not set';
    const date = new Date(nextDueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDueDateStatus = (nextDueDate: string) => {
    if (!nextDueDate) return 'default';
    const date = new Date(nextDueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due-soon';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalMonthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Per month recurring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalYearlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Annual subscription cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(subscriptions) ? subscriptions.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      {/* Subscription Records */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Manage recurring payments and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSubscriptions.map((subscription: any) => {
              const dueDateStatus = getDueDateStatus(subscription.nextDueDate);
              return (
                <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{subscription.name || 'Subscription'}</h3>
                      <span className="text-sm text-blue-600 font-semibold">
                        ${parseFloat(subscription.amount || 0).toLocaleString()}/{subscription.billingCycle}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        dueDateStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                        dueDateStatus === 'due-soon' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getNextDueDate(subscription.nextDueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Type: {subscription.type}</span>
                      {subscription.categoryId && (
                        <span>Category: {getCategoryName(subscription.categoryId)}</span>
                      )}
                      {subscription.paymentReceiverId && (
                        <span>Payment: {getPaymentSourceName(subscription.paymentReceiverId)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(subscription)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(subscription.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No subscriptions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</CardTitle>
            <CardDescription>
              {editingSubscription ? 'Update subscription details' : 'Enter details for the new subscription'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Netflix, Adobe Creative Cloud"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value: 'monthly' | 'yearly') => setFormData({ ...formData, billingCycle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Next Due Date</Label>
                  <Input
                    id="nextDueDate"
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Company">Company</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(categories) && categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentSource">Payment Source</Label>
                  <Select
                    value={formData.paymentReceiverId}
                    onValueChange={(value) => setFormData({ ...formData, paymentReceiverId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment source" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(paymentSources) && paymentSources.map((source: any) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingSubscription(null);
                  resetFormData();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubscription.isPending || updateSubscription.isPending}>
                  {editingSubscription ? 'Update' : 'Create'} Subscription
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}