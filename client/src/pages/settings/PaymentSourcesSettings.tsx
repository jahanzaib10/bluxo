import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export function PaymentSourcesSettings() {
  const [showPaymentSourceForm, setShowPaymentSourceForm] = useState(false);
  const [editingPaymentSource, setEditingPaymentSource] = useState<any>(null);
  
  const [paymentSourceForm, setPaymentSourceForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    details: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: paymentSources = [] } = useQuery({
    queryKey: ['/api/payment-sources'],
  });

  // Payment source mutations
  const createPaymentSource = useMutation({
    mutationFn: async (data: any) => {
      const cleanData = {
        ...data,
        details: data.details ? JSON.parse(data.details) : null
      };
      return apiRequest('POST', '/api/payment-sources', cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-sources'] });
      setShowPaymentSourceForm(false);
      setPaymentSourceForm({ name: '', type: 'income', details: '' });
      toast({ title: "Success", description: "Payment source created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePaymentSource = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const cleanData = {
        ...data,
        details: data.details ? JSON.parse(data.details) : null
      };
      return apiRequest('PUT', `/api/payment-sources/${id}`, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-sources'] });
      setEditingPaymentSource(null);
      setPaymentSourceForm({ name: '', type: 'income', details: '' });
      setShowPaymentSourceForm(false);
      toast({ title: "Success", description: "Payment source updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePaymentSource = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/payment-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-sources'] });
      toast({ title: "Success", description: "Payment source deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEditPaymentSource = (paymentSource: any) => {
    setEditingPaymentSource(paymentSource);
    setPaymentSourceForm({
      name: paymentSource.name,
      type: paymentSource.type,
      details: paymentSource.details ? JSON.stringify(paymentSource.details) : ''
    });
    setShowPaymentSourceForm(true);
  };

  const handlePaymentSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPaymentSource) {
      updatePaymentSource.mutate({ id: editingPaymentSource.id, ...paymentSourceForm });
    } else {
      createPaymentSource.mutate(paymentSourceForm);
    }
  };

  const resetPaymentSourceForm = () => {
    setShowPaymentSourceForm(false);
    setEditingPaymentSource(null);
    setPaymentSourceForm({ name: '', type: 'income', details: '' });
  };

  const handleDeletePaymentSource = (id: string) => {
    if (confirm('Are you sure you want to delete this payment source?')) {
      deletePaymentSource.mutate(id);
    }
  };

  // Filter payment sources by type
  const incomePaymentSources = Array.isArray(paymentSources) ? paymentSources.filter((source: any) => source.type === 'income') : [];
  const expensePaymentSources = Array.isArray(paymentSources) ? paymentSources.filter((source: any) => source.type === 'expense') : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Sources Settings</h1>
          <p className="text-muted-foreground">
            Manage payment methods and financial accounts for income and expense tracking
          </p>
        </div>
        <Button onClick={() => setShowPaymentSourceForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Source
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(paymentSources) ? paymentSources.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All payment methods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income Sources</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {incomePaymentSources.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Sources</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {expensePaymentSources.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Payment methods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Sources List */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Income Payment Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Income Sources
            </CardTitle>
            <CardDescription>Payment methods for receiving income and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomePaymentSources.map((source: any) => (
                <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="font-medium">{source.name}</span>
                      {source.details && (
                        <p className="text-xs text-muted-foreground">
                          {typeof source.details === 'string' ? source.details : JSON.stringify(source.details)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPaymentSource(source)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePaymentSource(source.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {incomePaymentSources.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No income sources yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Payment Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Expense Sources
            </CardTitle>
            <CardDescription>Payment methods for expenses and outgoing payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expensePaymentSources.map((source: any) => (
                <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <div>
                      <span className="font-medium">{source.name}</span>
                      {source.details && (
                        <p className="text-xs text-muted-foreground">
                          {typeof source.details === 'string' ? source.details : JSON.stringify(source.details)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPaymentSource(source)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePaymentSource(source.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {expensePaymentSources.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No expense sources yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Payment Source Form */}
      {showPaymentSourceForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPaymentSource ? 'Edit Payment Source' : 'Add New Payment Source'}</CardTitle>
            <CardDescription>
              {editingPaymentSource ? 'Update payment source information' : 'Create a new payment source for tracking transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSourceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentSourceName">Payment Source Name</Label>
                  <Input
                    id="paymentSourceName"
                    value={paymentSourceForm.name}
                    onChange={(e) => setPaymentSourceForm({ ...paymentSourceForm, name: e.target.value })}
                    placeholder="Enter payment source name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentSourceType">Source Type</Label>
                  <Select
                    value={paymentSourceForm.type}
                    onValueChange={(value: 'income' | 'expense') => 
                      setPaymentSourceForm({ ...paymentSourceForm, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentSourceDetails">Details (JSON format, optional)</Label>
                <Input
                  id="paymentSourceDetails"
                  value={paymentSourceForm.details}
                  onChange={(e) => setPaymentSourceForm({ ...paymentSourceForm, details: e.target.value })}
                  placeholder='{"account": "1234", "bank": "Example Bank"}'
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetPaymentSourceForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPaymentSource.isPending || updatePaymentSource.isPending}
                >
                  {editingPaymentSource ? 'Update' : 'Create'} Payment Source
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}