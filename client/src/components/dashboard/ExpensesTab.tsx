import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign, Search, TrendingDown, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/queryClient';

export function ExpensesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    date: '',
    description: '',
    notes: '',
    developerId: '',
    employeeId: '',
    vendorId: '',
    subscriptionId: '',
    isRecurring: false,
    recurringFrequency: '',
    recurringEndDate: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses = [] } = useQuery({
    queryKey: ['/api/spending'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: developers = [] } = useQuery({
    queryKey: ['/api/developers'],
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/spending', {
        ...data,
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spending'] });
      setShowForm(false);
      resetFormData();
      toast({ title: "Success", description: "Expense created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest('PUT', `/api/spending/${id}`, {
        ...data,
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spending'] });
      setShowForm(false);
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
      return apiRequest('DELETE', `/api/spending/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spending'] });
      toast({ title: "Success", description: "Expense deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetFormData = () => {
    setFormData({
      amount: '',
      categoryId: '',
      date: '',
      description: '',
      notes: '',
      developerId: '',
      employeeId: '',
      vendorId: '',
      subscriptionId: '',
      isRecurring: false,
      recurringFrequency: '',
      recurringEndDate: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, ...formData });
    } else {
      createExpense.mutate(formData);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount?.toString() || '',
      categoryId: expense.categoryId || '',
      date: expense.date || '',
      description: expense.description || '',
      notes: expense.notes || '',
      developerId: expense.developerId || '',
      employeeId: expense.employeeId || '',
      vendorId: expense.vendorId || '',
      subscriptionId: expense.subscriptionId || '',
      isRecurring: expense.isRecurring || false,
      recurringFrequency: expense.recurringFrequency || '',
      recurringEndDate: expense.recurringEndDate || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense.mutate(id);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = Array.isArray(categories) ? categories.find((c: any) => c.id === categoryId) : null;
    return category?.name || 'Unknown Category';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = Array.isArray(employees) ? employees.find((e: any) => e.id === employeeId) : null;
    return employee?.workerFullName || employee?.name || 'Unknown Employee';
  };

  const getDeveloperName = (developerId: string) => {
    const developer = Array.isArray(developers) ? developers.find((d: any) => d.id === developerId) : null;
    return developer?.name || 'Unknown Developer';
  };

  const filteredExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return expenses.filter((expense: any) => 
      expense.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      getCategoryName(expense.categoryId).toLowerCase().includes(searchValue.toLowerCase()) ||
      getEmployeeName(expense.employeeId).toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [expenses, searchValue, categories, employees]);

  const totalExpenses = Array.isArray(expenses) ? expenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {Array.isArray(expenses) ? expenses.length : 0} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredExpenses.filter((expense: any) => {
                const expenseDate = new Date(expense.date);
                const currentDate = new Date();
                return expenseDate.getMonth() === currentDate.getMonth() && 
                       expenseDate.getFullYear() === currentDate.getFullYear();
              }).reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Array.isArray(expenses) && expenses.length > 0 ? (totalExpenses / expenses.length).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per expense record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Expense Records */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>Track and manage business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExpenses.map((expense: any) => (
              <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{expense.description || 'Expense Entry'}</h3>
                    <span className="text-sm text-red-600 font-semibold">
                      -${parseFloat(expense.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Date: {new Date(expense.date).toLocaleDateString()}</span>
                    {expense.categoryId && (
                      <span>Category: {getCategoryName(expense.categoryId)}</span>
                    )}
                    {expense.employeeId && (
                      <span>Employee: {getEmployeeName(expense.employeeId)}</span>
                    )}
                    {expense.developerId && (
                      <span>Developer: {getDeveloperName(expense.developerId)}</span>
                    )}
                  </div>
                  {expense.notes && (
                    <p className="text-sm text-muted-foreground">Notes: {expense.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(expense.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No expenses found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
            <CardDescription>
              {editingExpense ? 'Update expense details' : 'Enter details for the new expense'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
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
                  placeholder="Enter expense description..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(employees) && employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.workerFullName || employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="developer">Developer</Label>
                  <Select
                    value={formData.developerId}
                    onValueChange={(value) => setFormData({ ...formData, developerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(developers) && developers.map((developer: any) => (
                        <SelectItem key={developer.id} value={developer.id}>
                          {developer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscription">Related Subscription</Label>
                  <Select
                    value={formData.subscriptionId}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(subscriptions) && subscriptions.map((subscription: any) => (
                        <SelectItem key={subscription.id} value={subscription.id}>
                          {subscription.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
                />
                <Label htmlFor="recurring">Recurring Expense</Label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.recurringFrequency}
                      onValueChange={(value) => setFormData({ ...formData, recurringFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingExpense(null);
                  resetFormData();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending}>
                  {editingExpense ? 'Update' : 'Create'} Expense
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}