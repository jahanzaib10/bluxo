import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit, Trash2, DollarSign, Calendar, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CategorySelect } from "@/components/CategorySelect";

interface EmployeeExpense {
  id: string;
  amount: string;
  date: string;
  employeeId: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringEndDate?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
}

interface FormData {
  amount: string;
  date: string;
  categoryId: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency: string;
  recurringEndDate: string;
}

export default function EmployeeExpenses() {
  const [, setLocation] = useLocation();
  // Extract employeeId from URL path
  const employeeId = window.location.pathname.split('/')[2];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EmployeeExpense | null>(null);
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    date: "",
    categoryId: "",
    description: "",
    isRecurring: false,
    recurringFrequency: "",
    recurringEndDate: ""
  });

  // Data fetching
  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ["/api/employees", employeeId],
    queryFn: () => apiRequest(`/api/employees/${employeeId}`, "GET"),
    enabled: !!employeeId,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/employees", employeeId, "expenses"],
    queryFn: () => apiRequest(`/api/employees/${employeeId}/expenses`, "GET"),
    enabled: !!employeeId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const expenseCategories = (categories as any[]).filter((cat: any) => cat.type === 'expense');

  // Calculate total expenses
  const totalExpenses = (expenses as EmployeeExpense[]).reduce((total, expense) => 
    total + parseFloat(expense.amount || "0"), 0
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/expenses", "POST", {
      ...data,
      employeeId: employeeId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "expenses"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Expense record created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create expense record", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiRequest(`/api/expenses/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "expenses"] });
      setIsEditOpen(false);
      setEditingExpense(null);
      resetForm();
      toast({ title: "Expense record updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update expense record", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/expenses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "expenses"] });
      toast({ title: "Expense record deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense record", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      date: "",
      categoryId: "",
      description: "",
      isRecurring: false,
      recurringFrequency: "",
      recurringEndDate: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (expense: EmployeeExpense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount?.toString() || "",
      date: expense.date || "",
      categoryId: expense.categoryId || "",
      description: expense.description || "",
      isRecurring: expense.isRecurring || false,
      recurringFrequency: expense.recurringFrequency || "",
      recurringEndDate: expense.recurringEndDate || ""
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    return `${month} ${day}, ${year}`;
  };

  // Form component to prevent input field focus issues
  const renderForm = () => {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="categoryId">Category</Label>
          <CategorySelect
            value={formData.categoryId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            type="expense"
            placeholder="Select expense category"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <Label htmlFor="isRecurring" className="text-sm font-medium">
              This is a recurring expense
            </Label>
          </div>

          {formData.isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recurringFrequency">Frequency</Label>
                <Select
                  value={formData.recurringFrequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recurringFrequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="bi-annual">Bi-Annual</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recurringEndDate">End Date (Optional)</Label>
                <Input
                  id="recurringEndDate"
                  type="date"
                  value={formData.recurringEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsAddOpen(false);
              setIsEditOpen(false);
              setEditingExpense(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {editingExpense ? "Update" : "Create"} Expense
          </Button>
        </div>
      </form>
    );
  };

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Employee not found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setLocation("/employees")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/employees")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{employee.name}</h1>
            <div className="flex items-center space-x-4 text-muted-foreground mt-1">
              {employee.position && <span>{employee.position}</span>}
              {employee.department && <span>• {employee.department}</span>}
              {employee.email && <span>• {employee.email}</span>}
            </div>
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Expense for {employee.name}</DialogTitle>
            </DialogHeader>
            <FormComponent />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-blue-700 mt-1">Total Expenses</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(expenses as EmployeeExpense[]).length}
              </div>
              <div className="text-sm text-green-700 mt-1">Total Records</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(expenses as EmployeeExpense[]).filter(e => e.isRecurring).length}
              </div>
              <div className="text-sm text-purple-700 mt-1">Recurring Expenses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Expense Records ({(expenses as EmployeeExpense[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(expenses as EmployeeExpense[]).length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[100px]">Amount</TableHead>
                      <TableHead className="min-w-[90px]">Date</TableHead>
                      <TableHead className="min-w-[100px]">Recurring</TableHead>
                      <TableHead className="min-w-[150px]">Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading expenses...
                        </TableCell>
                      </TableRow>
                    ) : (
                      (expenses as EmployeeExpense[]).map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="whitespace-nowrap">
                            {expense.categoryName ? (
                              <span className="text-sm">{expense.categoryName}</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            ${parseFloat(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(expense.date)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {expense.isRecurring ? (
                              <div className="flex items-center space-x-2">
                                <Repeat className="h-4 w-4 text-purple-600" />
                                <Badge variant="secondary" className="text-xs">
                                  {expense.recurringFrequency?.charAt(0).toUpperCase() + expense.recurringFrequency?.slice(1) || 'Recurring'}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">One-time</Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                            {expense.description || 'N/A'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(expense)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No expenses found</p>
              <p className="text-sm mb-4">Start tracking expenses for {employee.name}</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense for {employee.name}</DialogTitle>
          </DialogHeader>
          <FormComponent />
        </DialogContent>
      </Dialog>
    </div>
  );
}