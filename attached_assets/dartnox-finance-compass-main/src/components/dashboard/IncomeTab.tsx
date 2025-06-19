import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign, Calendar, User, Settings } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export function IncomeTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: '',
    client_id: '',
    payment_receiver_id: '',
    is_recurring: false,
    recurring_frequency: '',
    recurring_end_date: ''
  });

  const queryClient = useQueryClient();

  const { data: income = [] } = useQuery({
    queryKey: ['income'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income')
        .select(`
          *,
          client:clients(name),
          payment_receiver:payment_sources(name)
        `)
        .eq('archived', false)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('archived', false);
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentSources = [] } = useQuery({
    queryKey: ['payment-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_sources')
        .select('*')
        .eq('archived', false)
        .eq('type', 'income');
      if (error) throw error;
      return data;
    },
  });

  const createIncome = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('income')
        .insert([{ 
          ...data, 
          amount: parseFloat(data.amount),
          created_by: (await supabase.auth.getUser()).data.user?.id 
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      setShowForm(false);
      resetFormData();
      toast({ title: "Success", description: "Income record created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateIncome = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('income')
        .update({ ...data, amount: parseFloat(data.amount) })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      setEditingIncome(null);
      resetFormData();
      toast({ title: "Success", description: "Income record updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const archiveIncome = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income')
        .update({ archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast({ title: "Success", description: "Income record archived successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Filter income based on search
  const filteredIncome = useMemo(() => {
    if (!searchValue) return income;
    
    return income.filter((item) => {
      const searchTerm = searchValue.toLowerCase();
      return (
        item.description?.toLowerCase().includes(searchTerm) ||
        item.client?.name?.toLowerCase().includes(searchTerm) ||
        item.payment_receiver?.name?.toLowerCase().includes(searchTerm) ||
        item.amount?.toString().includes(searchTerm) ||
        item.date?.includes(searchTerm)
      );
    });
  }, [income, searchValue]);

  const resetFormData = () => {
    setFormData({
      amount: '',
      description: '',
      date: '',
      client_id: '',
      payment_receiver_id: '',
      is_recurring: false,
      recurring_frequency: '',
      recurring_end_date: ''
    });
  };

  const handleEdit = (incomeRecord: any) => {
    setEditingIncome(incomeRecord);
    setFormData({
      amount: incomeRecord.amount?.toString() || '',
      description: incomeRecord.description || '',
      date: incomeRecord.date || '',
      client_id: incomeRecord.client_id || '',
      payment_receiver_id: incomeRecord.payment_receiver_id || '',
      is_recurring: incomeRecord.is_recurring || false,
      recurring_frequency: incomeRecord.recurring_frequency || '',
      recurring_end_date: incomeRecord.recurring_end_date || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingIncome) {
      updateIncome.mutate({ ...formData, id: editingIncome.id });
    } else {
      createIncome.mutate(formData);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingIncome(null);
    resetFormData();
  };

  // Define table columns
  const columns: DataTableColumn[] = [
    {
      key: 'date',
      label: 'Date',
      minWidth: '120px',
      render: (income) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{income.date}</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      minWidth: '120px',
      render: (income) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 flex-shrink-0 text-green-600" />
          <span className="font-medium text-green-600">${income.amount}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      minWidth: '200px',
      render: (income) => (
        <span className="truncate">{income.description || '-'}</span>
      )
    },
    {
      key: 'client',
      label: 'Client',
      minWidth: '150px',
      render: (income) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{income.client?.name || '-'}</span>
        </div>
      )
    },
    {
      key: 'payment_receiver',
      label: 'Payment Receiver',
      minWidth: '180px',
      render: (income) => (
        <span className="truncate">{income.payment_receiver?.name || '-'}</span>
      )
    },
    {
      key: 'is_recurring',
      label: 'Recurring',
      minWidth: '100px',
      render: (income) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          income.is_recurring 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {income.is_recurring ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'recurring_frequency',
      label: 'Frequency',
      minWidth: '120px',
      render: (income) => (
        <span className="truncate">{income.recurring_frequency || '-'}</span>
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
      label: 'Archive',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (income) => archiveIncome.mutate(income.id),
      variant: 'outline'
    }
  ];

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {showForm && (
            <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
                <CardTitle className="text-slate-800">{editingIncome ? 'Edit Income' : 'Add New Income'}</CardTitle>
                <CardDescription>
                  {editingIncome ? 'Update income information' : 'Record a new income transaction'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the income..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client_id">Client *</Label>
                      <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_receiver_id">Payment Receiver *</Label>
                      <Select value={formData.payment_receiver_id} onValueChange={(value) => setFormData({ ...formData, payment_receiver_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment receiver" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentSources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked as boolean })}
                    />
                    <Label htmlFor="is_recurring">Recurring Income</Label>
                  </div>

                  {formData.is_recurring && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recurring_frequency">Frequency</Label>
                        <Select value={formData.recurring_frequency} onValueChange={(value) => setFormData({ ...formData, recurring_frequency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recurring_end_date">End Date</Label>
                        <Input
                          id="recurring_end_date"
                          type="date"
                          value={formData.recurring_end_date}
                          onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingIncome ? 'Update' : 'Create'} Income
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-800">Income</CardTitle>
                  <CardDescription>
                    Track your revenue and income sources.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowForm(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Toggle columns</h4>
                        <div className="space-y-2">
                          {columns.map((column) => (
                            <div key={column.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={column.key}
                                checked={true}
                                onChange={() => {}}
                              />
                              <label htmlFor={column.key} className="text-sm font-normal">
                                {column.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <DataTable
                  data={filteredIncome}
                  columns={columns}
                  actions={actions}
                  height="60vh"
                  stickyActions={true}
                  configurableColumns={false}
                  storageKey="incomeColumnPreferences"
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  searchPlaceholder="Search income records..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
