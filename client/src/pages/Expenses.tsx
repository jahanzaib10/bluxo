import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, Search, Edit, Trash2, CreditCard, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CategorySelect } from "@/components/CategorySelect";

interface ExpenseRecord {
  id: string;
  amount: string;
  date: string;
  employeeId?: string;
  employeeName?: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringEndDate?: string;
  createdAt: string;
}

interface FormData {
  amount: string;
  date: string;
  employeeId: string;
  categoryId: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency: string;
  recurringEndDate: string;
}

interface CsvRow {
  date: string;
  amount: string;
  description: string;
  employee_email: string;
  category_parent?: string;
  category_name: string;
  is_recurring: string;
  recurring_frequency?: string;
  recurring_end_date?: string;
  [key: string]: string | undefined;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [csvData, setCsvData] = useState("");
  const [parsedData, setParsedData] = useState<CsvRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    date: "",
    employeeId: "",
    categoryId: "",
    description: "",
    isRecurring: false,
    recurringFrequency: "",
    recurringEndDate: ""
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
      resetImportState();
      toast({ 
        title: "Expense records imported successfully",
        description: `Successfully imported ${data.imported || parsedData.length} expense records`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to import expense records", 
        description: error.message || "Please check your data and try again",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      date: "",
      employeeId: "",
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

  const handleEdit = (record: ExpenseRecord) => {
    setEditingExpense(record);
    setFormData({
      amount: record.amount?.toString() || "",
      date: record.date || "",
      employeeId: record.employeeId || "",
      categoryId: record.categoryId || "",
      description: record.description || "",
      isRecurring: record.isRecurring || false,
      recurringFrequency: record.recurringFrequency || "",
      recurringEndDate: record.recurringEndDate || ""
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      deleteMutation.mutate(id);
    }
  };

  // CSV Processing Functions
  const parseCsvData = (csvText: string): CsvRow[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("CSV must contain headers and at least one data row");
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const dataLines = lines.slice(1);

    return dataLines.map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
      const row: any = {};
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        row[header] = value;
      });

      return row as CsvRow;
    });
  };

  const validateCsvData = (data: CsvRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const validFrequencies = ['weekly', 'monthly', 'quarterly', 'bi-annual', 'yearly'];

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Validate required fields
      if (!row.date) {
        errors.push({ row: rowNum, field: 'date', message: 'Date is required' });
      }
      if (!row.amount) {
        errors.push({ row: rowNum, field: 'amount', message: 'Amount is required' });
      }
      if (!row.category_name) {
        errors.push({ row: rowNum, field: 'category_name', message: 'Category name is required' });
      }

      // Validate employee email if provided
      if (row.employee_email) {
        const employee = employees.find(e => 
          e.email && e.email.toLowerCase() === row.employee_email.toLowerCase()
        );
        if (!employee) {
          errors.push({ 
            row: rowNum, 
            field: 'employee_email', 
            message: `Employee not found: ${row.employee_email}` 
          });
        }
      }

      // Validate category mapping
      if (row.category_name) {
        let categoryFound = false;
        
        if (row.category_parent) {
          const parentCategory = expenseCategories.find(c => 
            c.name.toLowerCase() === row.category_parent.toLowerCase() && !c.parentId
          );
          if (parentCategory) {
            const childCategory = expenseCategories.find(c => 
              c.name.toLowerCase() === row.category_name.toLowerCase() && 
              c.parentId === parentCategory.id
            );
            categoryFound = !!childCategory;
          }
        } else {
          categoryFound = !!expenseCategories.find(c => 
            c.name.toLowerCase() === row.category_name.toLowerCase()
          );
        }

        if (!categoryFound) {
          const categoryDesc = row.category_parent 
            ? `${row.category_parent} > ${row.category_name}`
            : row.category_name;
          errors.push({ 
            row: rowNum, 
            field: 'category_name', 
            message: `Category not found: ${categoryDesc}` 
          });
        }
      }

      // Validate recurring fields
      const isRecurring = ['true', 't', 'yes', 'y', '1', 'on'].includes(
        row.is_recurring?.toLowerCase() || ''
      );

      if (isRecurring) {
        if (row.recurring_frequency) {
          const frequency = row.recurring_frequency.toLowerCase().trim();
          if (!validFrequencies.includes(frequency)) {
            errors.push({ 
              row: rowNum, 
              field: 'recurring_frequency', 
              message: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` 
            });
          }
        }

        if (row.recurring_end_date) {
          const endDate = new Date(row.recurring_end_date);
          if (isNaN(endDate.getTime())) {
            errors.push({ 
              row: rowNum, 
              field: 'recurring_end_date', 
              message: 'Invalid date format for recurring end date' 
            });
          } else if (endDate < new Date()) {
            errors.push({ 
              row: rowNum, 
              field: 'recurring_end_date', 
              message: 'Recurring end date is in the past' 
            });
          }
        }
      }

      // Validate amount format
      const amount = parseFloat(row.amount?.replace(/[,$]/g, '') || '0');
      if (isNaN(amount) || amount <= 0) {
        errors.push({ 
          row: rowNum, 
          field: 'amount', 
          message: 'Invalid amount format' 
        });
      }
    });

    return errors;
  };

  const handleCsvUpload = () => {
    try {
      const parsed = parseCsvData(csvData);
      const errors = validateCsvData(parsed);
      
      setParsedData(parsed);
      setValidationErrors(errors);
      setShowPreview(true);
    } catch (error) {
      toast({ 
        title: "Invalid CSV format", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleImport = () => {
    if (validationErrors.length > 0) {
      toast({ 
        title: "Cannot import with validation errors", 
        description: "Please fix all errors before importing",
        variant: "destructive" 
      });
      return;
    }

    importMutation.mutate(parsedData);
  };

  const resetImportState = () => {
    setCsvData("");
    setParsedData([]);
    setValidationErrors([]);
    setShowPreview(false);
    setIsImportOpen(false);
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
          <CategorySelect
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            type="expense"
            placeholder="Select expense category"
          />
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

      {/* Recurring Expense Fields */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
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
                onValueChange={(value) => setFormData({ ...formData, recurringFrequency: value })}
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
                onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
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
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Import Expense Records</DialogTitle>
              </DialogHeader>
              
              {!showPreview ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
                    <p className="text-sm text-blue-700 mb-2">Required columns:</p>
                    <ul className="text-xs text-blue-600 space-y-1 ml-4">
                      <li>• <strong>date</strong> - Transaction date (YYYY-MM-DD)</li>
                      <li>• <strong>amount</strong> - Expense amount (numeric)</li>
                      <li>• <strong>category_name</strong> - Expense category name</li>
                      <li>• <strong>description</strong> - Expense description</li>
                    </ul>
                    <p className="text-sm text-blue-700 mt-2 mb-2">Optional columns:</p>
                    <ul className="text-xs text-blue-600 space-y-1 ml-4">
                      <li>• <strong>employee_email</strong> - Employee email address</li>
                      <li>• <strong>category_parent</strong> - Parent category (for hierarchical categories)</li>
                      <li>• <strong>is_recurring</strong> - true/false for recurring expenses</li>
                      <li>• <strong>recurring_frequency</strong> - weekly, monthly, quarterly, bi-annual, yearly</li>
                      <li>• <strong>recurring_end_date</strong> - End date for recurring expenses (YYYY-MM-DD)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <Label htmlFor="csvData">CSV Data</Label>
                    <Textarea
                      id="csvData"
                      placeholder="date,amount,description,employee_email,category_name,is_recurring,recurring_frequency,recurring_end_date&#10;2024-01-15,150.00,Office supplies,john@company.com,Office Expenses,false,,&#10;2024-01-20,75.50,Monthly software subscription,jane@company.com,Software,true,monthly,2024-12-31"
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetImportState}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCsvUpload} 
                      disabled={!csvData.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Preview & Validate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Validation Summary */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">{parsedData.length} rows parsed</span>
                      </div>
                      {validationErrors.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-600">
                            {validationErrors.length} validation errors
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Edit CSV
                    </Button>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">
                        Validation Errors ({validationErrors.length})
                      </h4>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {validationErrors.map((error, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium text-red-700">Row {error.row}:</span>
                              <span className="text-red-600 ml-2">
                                {error.field} - {error.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Data Preview */}
                  <div className="border rounded-lg">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h4 className="font-medium">Data Preview</h4>
                    </div>
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Recurring</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>End Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.map((row, index) => {
                            const rowErrors = validationErrors.filter(e => e.row === index + 1);
                            const hasErrors = rowErrors.length > 0;
                            
                            return (
                              <TableRow key={index} className={hasErrors ? "bg-red-50" : ""}>
                                <TableCell className="font-medium">
                                  {index + 1}
                                  {hasErrors && (
                                    <AlertTriangle className="h-4 w-4 text-red-500 inline ml-1" />
                                  )}
                                </TableCell>
                                <TableCell>{row.date || '-'}</TableCell>
                                <TableCell>${row.amount || '0'}</TableCell>
                                <TableCell className="max-w-32 truncate">
                                  {row.description || '-'}
                                </TableCell>
                                <TableCell>{row.employee_email || '-'}</TableCell>
                                <TableCell>
                                  {row.category_parent && row.category_name 
                                    ? `${row.category_parent} > ${row.category_name}`
                                    : row.category_name || '-'
                                  }
                                </TableCell>
                                <TableCell>
                                  {['true', 't', 'yes', 'y', '1', 'on'].includes(
                                    row.is_recurring?.toLowerCase() || ''
                                  ) ? (
                                    <Badge variant="secondary">Yes</Badge>
                                  ) : (
                                    <Badge variant="outline">No</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{row.recurring_frequency || '-'}</TableCell>
                                <TableCell>{row.recurring_end_date || '-'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetImportState}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={validationErrors.length > 0 || importMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {importMutation.isPending ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import {parsedData.length} Records
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
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
              <TableHead>Recurring</TableHead>
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