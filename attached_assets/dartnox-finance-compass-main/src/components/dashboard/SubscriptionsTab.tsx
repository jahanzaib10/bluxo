import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, CreditCard, Search } from 'lucide-react';

export function SubscriptionsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    next_due_date: '',
    category_id: '',
    type: 'Company',
    recurring_end_date: '',
    payment_receiver_id: ''
  });

  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'expense');
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentReceivers = [] } = useQuery({
    queryKey: ['paymentReceivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_sources')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: enrichedSubscriptions = [] } = useQuery({
    queryKey: ['subscriptions-with-categories', subscriptions, categories],
    queryFn: async () => {
      if (!subscriptions.length || !categories.length) return [];

      return subscriptions.map(subscription => {
        const category = categories.find(cat => cat.id === subscription.category_id);
        return {
          ...subscription,
          category: category || null
        };
      });
    },
    enabled: subscriptions.length > 0 && categories.length > 0,
  });

  const createSubscription = useMutation({
    mutationFn: async (data: any) => {
      const cleanData = {
        ...data,
        amount: parseFloat(data.amount),
        created_by: (await supabase.auth.getUser()).data.user?.id
      };
      const { error } = await supabase
        .from('subscriptions')
        .insert([cleanData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
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
      const cleanData = {
        ...data,
        amount: parseFloat(data.amount)
      };
      const { error } = await supabase
        .from('subscriptions')
        .update(cleanData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
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
      const { error } = await supabase
        .from('subscriptions')
        .update({ archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
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
      billing_cycle: 'monthly',
      next_due_date: '',
      category_id: '',
      type: 'Company',
      recurring_end_date: '',
      payment_receiver_id: ''
    });
  };

  const handleEdit = (subscription: any) => {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription.name || '',
      amount: subscription.amount?.toString() || '',
      billing_cycle: subscription.billing_cycle || 'monthly',
      next_due_date: subscription.next_due_date || '',
      category_id: subscription.category_id || '',
      type: subscription.type || 'Company',
      recurring_end_date: subscription.recurring_end_date || '',
      payment_receiver_id: subscription.payment_receiver_id || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubscription) {
      updateSubscription.mutate({ ...formData, id: editingSubscription.id });
    } else {
      createSubscription.mutate(formData);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSubscription(null);
    resetFormData();
  };

  // Filter subscriptions based on search
  const filteredSubscriptions = enrichedSubscriptions.filter(subscription => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      subscription.name?.toLowerCase().includes(searchLower) ||
      subscription.type?.toLowerCase().includes(searchLower) ||
      subscription.category?.name?.toLowerCase().includes(searchLower) ||
      subscription.billing_cycle?.toLowerCase().includes(searchLower) ||
      subscription.amount?.toString().includes(searchLower)
    );
  });

  // Define table columns
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      minWidth: '200px',
      render: (subscription) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 flex-shrink-0" />
          <div className="font-medium truncate">{subscription.name}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      minWidth: '120px',
      render: (subscription) => (
        <span className="font-medium">${subscription.amount}</span>
      )
    },
    {
      key: 'billing_cycle',
      label: 'Billing Cycle',
      minWidth: '120px',
      render: (subscription) => (
        <span className="capitalize">{subscription.billing_cycle}</span>
      )
    },
    {
      key: 'next_due_date',
      label: 'Next Due',
      minWidth: '120px',
      render: (subscription) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{subscription.next_due_date}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      minWidth: '150px',
      render: (subscription) => (
        <span className="truncate">{subscription.category?.name || '-'}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      minWidth: '120px',
      render: (subscription) => (
        <span className="truncate">{subscription.type || '-'}</span>
      )
    }
  ];

  // Define table actions
  const actions: DataTableAction[] = [
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
      variant: 'outline'
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (subscription) => deleteSubscription.mutate(subscription.id),
      variant: 'outline'
    }
  ];

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 space-y-6 w-full">
          {showForm && (
            <Card className="w-full border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
                <CardTitle className="text-slate-800">{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</CardTitle>
                <CardDescription>
                  {editingSubscription ? 'Update subscription information' : 'Add a new subscription to your list'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        placeholder="Monthly amount"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing_cycle">Billing Cycle</Label>
                      <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value as 'monthly' | 'yearly' })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_due_date">Next Due Date</Label>
                      <Input
                        id="next_due_date"
                        type="date"
                        value={formData.next_due_date}
                        onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_id">Category</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        placeholder="e.g., Company, Personal"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurring_end_date">Recurring End Date (Optional)</Label>
                    <Input
                      id="recurring_end_date"
                      type="date"
                      value={formData.recurring_end_date}
                      onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_receiver_id">Payment Receiver</Label>
                    <Select value={formData.payment_receiver_id} onValueChange={(value) => setFormData({ ...formData, payment_receiver_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment receiver" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentReceivers.map((receiver) => (
                          <SelectItem key={receiver.id} value={receiver.id}>
                            {receiver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingSubscription ? 'Update' : 'Create'} Subscription
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="w-full border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-800">Subscriptions</CardTitle>
                  <CardDescription>
                    Manage your recurring subscriptions and services
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={filteredSubscriptions}
                columns={columns}
                actions={actions}
                height="70vh"
                stickyActions={true}
                configurableColumns={false}
                storageKey="subscriptionsColumnPreferences"
                showColumnConfig={false}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search subscriptions..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
