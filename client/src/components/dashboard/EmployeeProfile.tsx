
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign, Repeat, Calendar } from 'lucide-react';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';
import { HierarchicalSelect } from '@/components/ui/hierarchical-select';

interface EmployeeProfileProps {
  employee: any;
}

export function EmployeeProfile({ employee }: EmployeeProfileProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    date: '',
    description: '',
    notes: '',
    is_recurring: false,
    recurring_frequency: '',
    recurring_end_date: ''
  });

  const queryClient = useQueryClient();

  const { data: employeeExpenses = [] } = useQuery({
    queryKey: ['employee-expenses', employee.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spending')
        .select(`
          *,
          categories (name, type, parent_id)
        `)
        .eq('employee_id', employee.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allExpenseCategories = [], isLoading: categoriesLoading, error: categoriesError } = useHierarchicalCategories('expense');

  console.log('EmployeeProfile - Categories loading:', categoriesLoading);
  console.log('EmployeeProfile - Categories error:', categoriesError);
  console.log('EmployeeProfile - All categories data:', allExpenseCategories);

  // Filter to get only Employee Expenses and its children
  const employeeExpenseCategories = allExpenseCategories.filter(cat => 
    cat.name === 'Employee Expenses'
  );

  console.log('EmployeeProfile - Filtered employee expense categories:', employeeExpenseCategories);

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('spending')
        .insert([{
          ...data,
          employee_id: employee.id,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-expenses', employee.id] });
      setShowForm(false);
      setFormData({ category_id: '', amount: '', date: '', description: '', notes: '', is_recurring: false, recurring_frequency: '', recurring_end_date: '' });
      toast({ title: "Success", description: "Employee expense added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('spending')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-expenses', employee.id] });
      setEditingExpense(null);
      setFormData({ category_id: '', amount: '', date: '', description: '', notes: '', is_recurring: false, recurring_frequency: '', recurring_end_date: '' });
      toast({ title: "Success", description: "Employee expense updated successfully." });
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
      queryClient.invalidateQueries({ queryKey: ['employee-expenses', employee.id] });
      toast({ title: "Success", description: "Employee expense deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      recurring_frequency: formData.is_recurring ? formData.recurring_frequency : null,
      recurring_end_date: formData.is_recurring && formData.recurring_end_date ? formData.recurring_end_date : null
    };
    
    if (editingExpense) {
      updateExpense.mutate({ ...submitData, id: editingExpense.id });
    } else {
      createExpense.mutate(submitData);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      category_id: expense.category_id || '',
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description || '',
      notes: expense.notes || '',
      is_recurring: expense.is_recurring || false,
      recurring_frequency: expense.recurring_frequency || '',
      recurring_end_date: expense.recurring_end_date || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData({ category_id: '', amount: '', date: '', description: '', notes: '', is_recurring: false, recurring_frequency: '', recurring_end_date: '' });
  };

  const getTotalExpenses = () => {
    return employeeExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
  };

  const getCategoryDisplayName = (expense: any) => {
    if (!expense.categories) return 'Unknown Category';
    
    // If category has a parent, show "Parent > Child" format
    if (expense.categories.parent_id) {
      // Find parent category name from the flat categories list
      const findCategoryById = (categories: any[], categoryId: string): any => {
        for (const cat of categories) {
          if (cat.id === categoryId) return cat;
          if (cat.children) {
            for (const child of cat.children) {
              if (child.id === categoryId) return child;
              const found = findCategoryById(child.children || [], categoryId);
              if (found) return found;
            }
          }
        }
        return null;
      };
      
      const parentCategory = findCategoryById(allExpenseCategories, expense.categories.parent_id);
      const parentName = parentCategory?.name || 'Employee Expenses';
      return `${parentName} > ${expense.categories.name}`;
    }
    
    return expense.categories.name;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Employee Expenses
          </CardTitle>
          <CardDescription>
            Manage salary, bonuses, and other expenses for {employee.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">${getTotalExpenses().toLocaleString()}</p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
                <CardDescription>
                  Add salary, bonus, or other expenses for this employee
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">Error loading categories: {categoriesError.message}</p>
                  </div>
                )}
                
                {categoriesLoading && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800">Loading categories...</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_id">Employee Expense Category *</Label>
                      <HierarchicalSelect
                        categories={employeeExpenseCategories}
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        placeholder="Select employee expense category"
                        showOnlyChildren={false}
                      />
                      {!categoriesLoading && employeeExpenseCategories.length === 0 && (
                        <p className="text-xs text-red-600">No employee expense categories found. Please check database.</p>
                      )}
                    </div>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Expense description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_recurring"
                        checked={formData.is_recurring}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: !!checked })}
                      />
                      <Label htmlFor="is_recurring" className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Make this a recurring expense
                      </Label>
                    </div>
                    
                    {formData.is_recurring && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="recurring_frequency">Frequency</Label>
                          <HierarchicalSelect
                            categories={[
                              { id: 'weekly', name: 'Weekly', type: 'expense', parent_id: null, created_by: null, created_at: '', children: [] },
                              { id: 'monthly', name: 'Monthly', type: 'expense', parent_id: null, created_by: null, created_at: '', children: [] },
                              { id: 'yearly', name: 'Yearly', type: 'expense', parent_id: null, created_by: null, created_at: '', children: [] }
                            ]}
                            value={formData.recurring_frequency}
                            onValueChange={(value) => setFormData({ ...formData, recurring_frequency: value })}
                            placeholder="Select frequency"
                            showOnlyChildren={false}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recurring_end_date">End Date (Optional)</Label>
                          <Input
                            id="recurring_end_date"
                            type="date"
                            value={formData.recurring_end_date}
                            onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingExpense ? 'Update' : 'Add'} Expense
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{getCategoryDisplayName(expense)}</TableCell>
                  <TableCell>${Number(expense.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {expense.is_recurring ? (
                      <div className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        <span className="text-sm">{expense.recurring_frequency}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      {expense.description && (
                        <div className="text-sm">{expense.description}</div>
                      )}
                      {expense.notes && (
                        <div className="text-xs text-muted-foreground">{expense.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(expense)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteExpense.mutate(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
