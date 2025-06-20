import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, Search, Edit, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExpenseRecord {
  id: string;
  amount: string;
  date: string;
  employeeId?: string;
  employeeName?: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  createdAt: string;
}

interface FormData {
  amount: string;
  date: string;
  employeeId: string;
  categoryId: string;
  description: string;
}

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [csvData, setCsvData] = useState("");
  
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    date: "",
    employeeId: "",
    categoryId: "",
    description: "",
  });

  // Queries
  const { data: expenses = [], isLoading } = useQuery<ExpenseRecord[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const expenseCategories = categories.filter((cat: any) => cat.type === 'expense');

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/expenses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense record deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense record", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: (csvData: any[]) => apiRequest("/api/expenses/import", "POST", { csvData }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsImportOpen(false);
      setCsvData("");
      toast({ 
        title: `Import completed: ${data.imported} records imported, ${data.errors} errors` 
      });
    },
    onError: () => {
      toast({ title: "Failed to import expense records", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      date: "",
      employeeId: "",
      categoryId: "",
      description: "",
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

  const handleEdit = (record: ExpenseRecord) => {
    setEditingExpense(record);
    setFormData({
      amount: record.amount?.toString() || "",
      date: record.date || "",
      employeeId: record.employeeId || "",
      categoryId: record.categoryId || "",
      description: record.description || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleImport = () => {
    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
      importMutation.mutate(data);
    } catch (error) {
      toast({ title: "Invalid CSV format", variant: "destructive" });
    }
  };

  const filteredExpenses = expenses.filter((record: ExpenseRecord) =>
    record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FormComponent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
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
        <div>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employeeId">Employee</Label>
          <Select
            value={formData.employeeId}
            onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee: any) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddOpen(false);
            setIsEditOpen(false);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex space-x-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Expense Records</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvData">CSV Data</Label>
                  <Textarea
                    id="csvData"
                    placeholder="amount,date,employee_name,category_name,description"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={10}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={importMutation.isPending}>
                    Import
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Expense Record</DialogTitle>
              </DialogHeader>
              <FormComponent />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search expense records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Expense Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Expense Records ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No expense records found
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((record: ExpenseRecord) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    ${parseFloat(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.employeeName || 'N/A'}</TableCell>
                  <TableCell>{record.categoryName || 'N/A'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {record.description || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No expense records found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense Record</DialogTitle>
          </DialogHeader>
          <FormComponent />
        </DialogContent>
      </Dialog>
    </div>
  );
}