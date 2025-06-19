
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function PaymentSourcesSettings() {
  const [showPaymentSourceForm, setShowPaymentSourceForm] = useState(false);
  const [editingPaymentSource, setEditingPaymentSource] = useState<any>(null);
  
  const [paymentSourceForm, setPaymentSourceForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    details: ''
  });

  const queryClient = useQueryClient();

  const { data: paymentSources = [] } = useQuery({
    queryKey: ['payment-sources-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_sources')
        .select('*')
        .eq('archived', false)
        .order('type', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Payment source mutations
  const createPaymentSource = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('payment_sources')
        .insert([{ 
          ...data, 
          details: data.details ? JSON.parse(data.details) : null,
          created_by: (await supabase.auth.getUser()).data.user?.id 
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-sources-all'] });
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
      const { error } = await supabase
        .from('payment_sources')
        .update({
          ...data,
          details: data.details ? JSON.parse(data.details) : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-sources-all'] });
      setEditingPaymentSource(null);
      setPaymentSourceForm({ name: '', type: 'income', details: '' });
      toast({ title: "Success", description: "Payment source updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePaymentSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_sources')
        .update({ archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-sources-all'] });
      toast({ title: "Success", description: "Payment source archived successfully." });
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
      updatePaymentSource.mutate({ ...paymentSourceForm, id: editingPaymentSource.id });
    } else {
      createPaymentSource.mutate(paymentSourceForm);
    }
  };

  const resetPaymentSourceForm = () => {
    setShowPaymentSourceForm(false);
    setEditingPaymentSource(null);
    setPaymentSourceForm({ name: '', type: 'income', details: '' });
  };

  return (
    <div className="space-y-6">
      {showPaymentSourceForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPaymentSource ? 'Edit Payment Source' : 'Add New Payment Source'}</CardTitle>
            <CardDescription>
              {editingPaymentSource ? 'Update payment source information' : 'Create a new payment source (bank account, credit card, etc.)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSourceSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentSourceName">Name</Label>
                <Input
                  id="paymentSourceName"
                  value={paymentSourceForm.name}
                  onChange={(e) => setPaymentSourceForm({ ...paymentSourceForm, name: e.target.value })}
                  placeholder="e.g., Business Checking Account"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentSourceType">Type</Label>
                <Select value={paymentSourceForm.type} onValueChange={(value: 'income' | 'expense') => setPaymentSourceForm({ ...paymentSourceForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentSourceDetails">Details (JSON)</Label>
                <Input
                  id="paymentSourceDetails"
                  value={paymentSourceForm.details}
                  onChange={(e) => setPaymentSourceForm({ ...paymentSourceForm, details: e.target.value })}
                  placeholder='{"account_number": "****1234", "bank": "Example Bank"}'
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingPaymentSource ? 'Update' : 'Create'} Payment Source
                </Button>
                <Button type="button" variant="outline" onClick={resetPaymentSourceForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-slate-800">Payment Sources</CardTitle>
              <CardDescription>
                Manage your payment methods (bank accounts, credit cards, etc.)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowPaymentSourceForm(true)} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Payment Source
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {paymentSources.map((source) => (
              <Card key={source.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{source.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{source.type}</p>
                      {source.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {JSON.stringify(source.details)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEditPaymentSource(source)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deletePaymentSource.mutate(source.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
