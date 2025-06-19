import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export function ExpensesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    date: '',
    description: '',
    notes: '',
    developer_id: '',
    employee_id: '',
    vendor_id: '',
    subscription_id: '',
    is_recurring: false,
    recurring_frequency: '',
    recurring_end_date: ''
  });

  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spending')
        .select('*')
        .eq('archived', false)
        .order('date', { ascending: false });
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

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, worker_full_name')
        .eq('archived', false);
      if (error) throw error;
      return data;
    },
  });

  const { data: developers = [] } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('id, name')
        .eq('archived', false);
      if (error) throw error;
      return data;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('archived', false);
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, name')
        .eq('archived', false);
      if (error) throw error;
      return data;
    },
  });

  const { data: enrichedExpenses = [] } = useQuery({
    queryKey: ['enrichedExpenses', expenses],
    queryFn: async () => {
      if (!expenses.length) return [];

      const categoryMap = categories.reduce((acc, category) => {
        acc[category.id] = category;
        return acc;
      }, {});

      const employeeMap = employees.reduce((acc, employee) => {
        acc[employee.id] = employee;
        return acc;
      }, {});

      const developerMap = developers.reduce((acc, developer) => {
        acc[developer.id] = developer;
        return acc;
      }, {});

      const vendorMap = vendors.reduce((acc, vendor) => {
        acc[vendor.id] = vendor;
        return acc;
      }, {});

      return expenses.map(expense => ({
        ...expense,
        category: categoryMap[expense.category_id],
        employee: employeeMap[expense.employee_id],
        developer: developerMap[expense.developer_id],
        vendor: vendorMap[expense.vendor_id],
      }));
    },
    enabled: expenses.length > 0,
  });

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      const cleanData = {
        ...data,
        amount: parseFloat(data.amount),
        is_recurring: data.is_recurring === 'true',
        created_by: (await supabase.auth.getUser()).data.user?.id
      };
      const { error } = await supabase
        .from('spending')
        .insert([cleanData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowForm(false);
      resetFormData();
      toast({ title: "Success", description: "Expense added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const cleanData = {
        ...data,
        amount: parseFloat(data.amount),
        is_recurring: data.is_recurring === 'true'
      };
      const { error } = await supabase
        .from('spending')
        .update(cleanData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setEditingExpense(null);
      resetFormData();
      toast({ title: "Success", description: "Expense updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('spending')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Success", description: "Expense deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetFormData = () => {
    setFormData({
      amount: '',
      category_id: '',
      date: '',
      description: '',
      notes: '',
      developer_id: '',
      employee_id: '',
      vendor_id: '',
      subscription_id: '',
      is_recurring: false,
      recurring_frequency: '',
      recurring_end_date: ''
    });
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount?.toString() || '',
      category_id: expense.category_id || '',
      date: expense.date || '',
      description: expense.description || '',
      notes: expense.notes || '',
      developer_id: expense.developer_id || '',
      employee_id: expense.employee_id || '',
      vendor_id: expense.vendor_id || '',
      subscription_id: expense.subscription_id || '',
      is_recurring: expense.is_recurring?.toString() || 'false',
      recurring_frequency: expense.recurring_frequency || '',
      recurring_end_date: expense.recurring_end_date || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateExpense.mutate({ ...formData, id: editingExpense.id });
    } else {
      createExpense.mutate(formData);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    resetFormData();
  };

  // Filter expenses based on search
  const filteredExpenses = enrichedExpenses.filter(expense => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      expense.description?.toLowerCase().includes(searchLower) ||
      expense.notes?.toLowerCase().includes(searchLower) ||
      expense.category?.name?.toLowerCase().includes(searchLower) ||
      expense.employee?.worker_full_name?.toLowerCase().includes(searchLower) ||
      expense.developer?.name?.toLowerCase().includes(searchLower) ||
      expense.vendor?.name?.toLowerCase().includes(searchLower) ||
      expense.amount?.toString().includes(searchLower)
    );
  });

  // Define table columns
  const columns: DataTableColumn[] = [
    {
      key: 'date',
      label: 'Date',
      minWidth: '120px'
    },
    {
      key: 'amount',
      label: 'Amount',
      minWidth: '120px',
      render: (expense) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">${expense.amount}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      minWidth: '200px',
      render: (expense) => (
        <span className="truncate">{expense.description || '-'}</span>
      )
    },
    {
      key: 'category',
      label: 'Category',
      minWidth: '150px',
      render: (expense) => (
        <span className="truncate">{expense.category?.name || '-'}</span>
      )
    },
    {
      key: 'employee',
      label: 'Employee',
      minWidth: '150px',
      render: (expense) => (
        <span className="truncate">{expense.employee?.worker_full_name || '-'}</span>
      )
    },
    {
      key: 'developer',
      label: 'Developer',
      minWidth: '150px',
      render: (expense) => (
        <span className="truncate">{expense.developer?.name || '-'}</span>
      )
    },
    {
      key: 'vendor',
      label: 'Vendor',
      minWidth: '120px',
      render: (expense) => (
        <span className="truncate">{expense.vendor?.name || '-'}</span>
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      minWidth: '200px',
      render: (expense) => (
        <span className="truncate">{expense.notes || '-'}</span>
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
      onClick: (expense) => deleteExpense.mutate(expense.id),
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
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-slate-200">
                <CardTitle className="text-slate-800">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
                <CardDescription>
                  {editingExpense ? 'Update expense information' : 'Add a new expense to your records'}
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
                      placeholder="e.g., Office Supplies, Client Dinner"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about the expense..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_id">Category *</Label>
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
                      <Label htmlFor="employee_id">Employee</Label>
                      <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.worker_full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="developer_id">Developer</Label>
                      <Select value={formData.developer_id} onValueChange={(value) => setFormData({ ...formData, developer_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select developer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {developers.map((developer) => (
                            <SelectItem key={developer.id} value={developer.id}>
                              {developer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor_id">Vendor</Label>
                      <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription_id">Subscription</Label>
                      <Select value={formData.subscription_id} onValueChange={(value) => setFormData({ ...formData, subscription_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subscription" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {subscriptions.map((subscription) => (
                            <SelectItem key={subscription.id} value={subscription.id}>
                              {subscription.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="is_recurring">Recurring?</Label>
                      <Select value={formData.is_recurring.toString()} onValueChange={(value) => setFormData({ ...formData, is_recurring: value === 'true' })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.is_recurring === true && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recurring_frequency">Frequency</Label>
                        <Select value={formData.recurring_frequency} onValueChange={(value) => setFormData({ ...formData, recurring_frequency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recurring_end_date">Recurring End Date</Label>
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
                      {editingExpense ? 'Update' : 'Create'} Expense
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
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-800">Expenses</CardTitle>
                  <CardDescription>
                    Track all your business expenses and spending
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowForm(true)} className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={filteredExpenses}
                columns={columns}
                actions={actions}
                height="70vh"
                stickyActions={true}
                configurableColumns={false}
                storageKey="expensesColumnPreferences"
                showColumnConfig={false}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search expenses..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
