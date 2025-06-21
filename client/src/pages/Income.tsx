import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, Search, Edit, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CategorySelect } from "@/components/CategorySelect";

interface IncomeRecord {
  id: string;
  amount: string;
  date: string;
  clientId?: string;
  clientName?: string;
  paymentSourceId?: string;
  paymentSourceName?: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringEndDate?: string;
  status?: string;
  invoiceId?: string;
  currency?: string;
  createdAt: string;
}

interface FormData {
  amount: string;
  date: string;
  clientId: string;
  paymentSourceId: string;
  categoryId: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency: string;
  recurringEndDate: string;
  status: string;
  invoiceId: string;
  currency: string;
}

export default function Income() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [csvData, setCsvData] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    date: "",
    clientId: "",
    paymentSourceId: "",
    categoryId: "",
    description: "",
    isRecurring: false,
    recurringFrequency: "",
    recurringEndDate: "",
    status: "paid",
    invoiceId: "",
    currency: "USD",
  });

  // Queries
  const { data: income = [], isLoading } = useQuery<IncomeRecord[]>({
    queryKey: ["/api/income"],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: paymentSources = [] } = useQuery<any[]>({
    queryKey: ["/api/payment-sources"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const incomeCategories = categories.filter((cat: any) => cat.type === 'income');

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/income", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Income record created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create income record", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiRequest(`/api/income/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      setIsEditOpen(false);
      setEditingIncome(null);
      resetForm();
      toast({ title: "Income record updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update income record", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/income/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      toast({ title: "Income record deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete income record", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: (csvData: string) => apiRequest("/api/income/import", "POST", { csvData }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      setIsImportOpen(false);
      setCsvData("");
      setPreviewData([]);
      toast({ 
        title: `Import completed: ${data.imported} records imported, ${data.errors} errors` 
      });
    },
    onError: () => {
      toast({ title: "Failed to import income records", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      date: "",
      clientId: "",
      paymentSourceId: "",
      categoryId: "",
      description: "",
      isRecurring: false,
      recurringFrequency: "",
      recurringEndDate: "",
      status: "paid",
      invoiceId: "",
      currency: "USD",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up form data before submission
    const cleanedData = { ...formData };
    
    // Handle empty date fields
    if (!cleanedData.recurringEndDate || cleanedData.recurringEndDate.trim() === '') {
      cleanedData.recurringEndDate = null;
    }
    
    // If not recurring, clear recurring fields
    if (!cleanedData.isRecurring) {
      cleanedData.recurringFrequency = '';
      cleanedData.recurringEndDate = null;
    }
    
    if (editingIncome) {
      updateMutation.mutate({ id: editingIncome.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const handleEdit = (record: IncomeRecord) => {
    setEditingIncome(record);
    setFormData({
      amount: record.amount?.toString() || "",
      date: record.date || "",
      clientId: record.clientId || "",
      paymentSourceId: record.paymentSourceId || "",
      categoryId: record.categoryId || "",
      description: record.description || "",
      isRecurring: record.isRecurring || false,
      recurringFrequency: record.recurringFrequency || "",
      recurringEndDate: record.recurringEndDate || "",
      status: record.status || "paid",
      invoiceId: record.invoiceId || "",
      currency: record.currency || "USD",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this income record?")) {
      deleteMutation.mutate(id);
    }
  };

  const parseCsv = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(1);
    
    // Helper function to parse boolean values
    const parseBooleanValue = (value: string | boolean): boolean => {
      if (typeof value === 'boolean') return value;
      if (!value) return false;
      
      const normalized = value.toString().toLowerCase().trim();
      return ['true', 't', 'yes', 'y', '1', 'on'].includes(normalized);
    };
    
    return dataLines.map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Handle special field parsing
        if (header === 'is_recurring') {
          row[header] = parseBooleanValue(value);
        } else {
          row[header] = value;
        }
      });
      return row;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        setCsvData(csvText);
        const parsed = parseCsv(csvText);
        setPreviewData(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    importMutation.mutate(csvData);
  };

  const filteredIncome = income.filter((record: IncomeRecord) =>
    record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.paymentSourceName?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Label htmlFor="clientId">Client</Label>
          <Select
            value={formData.clientId}
            onValueChange={(value) => setFormData({ ...formData, clientId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client: any) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="paymentSourceId">Payment Source</Label>
          <Select
            value={formData.paymentSourceId}
            onValueChange={(value) => setFormData({ ...formData, paymentSourceId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment source" />
            </SelectTrigger>
            <SelectContent>
              {paymentSources.map((source: any) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="categoryId">Category</Label>
        <CategorySelect
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          type="income"
          placeholder="Select income category"
        />
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="PKR">PKR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="invoiceId">Invoice ID</Label>
        <Input
          id="invoiceId"
          value={formData.invoiceId}
          onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
          placeholder="Optional invoice reference"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRecurring"
          checked={formData.isRecurring}
          onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked as boolean })}
        />
        <Label htmlFor="isRecurring">Recurring Income</Label>
      </div>

      {formData.isRecurring && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="recurringFrequency">Recurring Frequency</Label>
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
            <Label htmlFor="recurringEndDate">Recurring End Date</Label>
            <Input
              id="recurringEndDate"
              type="date"
              value={formData.recurringEndDate}
              onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
            />
          </div>
        </div>
      )}

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
          {editingIncome ? "Update" : "Create"} Income
        </Button>
      </div>
    </form>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Income</h1>
        <div className="flex space-x-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Income Records</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">Upload CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Expected headers: amount, currency, date, description, category, status, is_recurring, recurring_frequency, recurring_end_date, invoice_id, client_id, payment_source_id
                  </p>
                </div>

                {previewData.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Preview ({previewData.length} records)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 border-r">Amount</th>
                            <th className="text-left p-2 border-r">Currency</th>
                            <th className="text-left p-2 border-r">Date</th>
                            <th className="text-left p-2 border-r">Description</th>
                            <th className="text-left p-2 border-r">Category</th>
                            <th className="text-left p-2 border-r">Status</th>
                            <th className="text-left p-2 border-r">Recurring</th>
                            <th className="text-left p-2 border-r">Frequency</th>
                            <th className="text-left p-2 border-r">End Date</th>
                            <th className="text-left p-2 border-r">Invoice ID</th>
                            <th className="text-left p-2 border-r">Client ID</th>
                            <th className="text-left p-2">Payment Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 border-r">{row.amount || '-'}</td>
                              <td className="p-2 border-r">{row.currency || 'USD'}</td>
                              <td className="p-2 border-r">{row.date || '-'}</td>
                              <td className="p-2 border-r">{row.description || '-'}</td>
                              <td className="p-2 border-r">{row.category || '-'}</td>
                              <td className="p-2 border-r">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  row.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  row.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {row.status || 'paid'}
                                </span>
                              </td>
                              <td className="p-2 border-r">{row.is_recurring ? 'Yes' : 'No'}</td>
                              <td className="p-2 border-r">{row.recurring_frequency || '-'}</td>
                              <td className="p-2 border-r">{row.recurring_end_date || '-'}</td>
                              <td className="p-2 border-r">{row.invoice_id || '-'}</td>
                              <td className="p-2 border-r">{row.client_id || '-'}</td>
                              <td className="p-2">{row.payment_source_id || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewData.length > 5 && (
                        <p className="text-sm text-gray-500 mt-2">
                          Showing first 5 rows of {previewData.length} total records
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsImportOpen(false);
                    setCsvData("");
                    setPreviewData([]);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={importMutation.isPending || !csvData}
                  >
                    {importMutation.isPending ? "Importing..." : `Import ${previewData.length} Records`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Income Record</DialogTitle>
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
          placeholder="Search income records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Income Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Income Records ({filteredIncome.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIncome.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                    Loading income records...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredIncome.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No income records found
                </TableCell>
              </TableRow>
            ) : (
              filteredIncome.map((record: IncomeRecord) => {
                // Calculate next due date for recurring income
                const calculateNextDueDate = (date: string, frequency: string) => {
                  if (!frequency) return null;
                  const baseDate = new Date(date);
                  const now = new Date();
                  
                  while (baseDate <= now) {
                    switch (frequency) {
                      case 'weekly':
                        baseDate.setDate(baseDate.getDate() + 7);
                        break;
                      case 'monthly':
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        break;
                      case 'quarterly':
                        baseDate.setMonth(baseDate.getMonth() + 3);
                        break;
                      case 'bi-annual':
                        baseDate.setMonth(baseDate.getMonth() + 6);
                        break;
                      case 'yearly':
                        baseDate.setFullYear(baseDate.getFullYear() + 1);
                        break;
                      default:
                        return null;
                    }
                  }
                  
                  // Check if past end date
                  if (record.recurringEndDate && baseDate > new Date(record.recurringEndDate)) {
                    return null;
                  }
                  
                  return baseDate;
                };

                const nextDueDate = record.isRecurring ? calculateNextDueDate(record.date, record.recurringFrequency || '') : null;
                const isRecurringActive = nextDueDate && (!record.recurringEndDate || new Date(record.recurringEndDate) > new Date());

                return (
                  <TableRow key={record.id} className={!isRecurringActive && record.isRecurring ? 'opacity-60' : ''}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {record.currency && record.currency !== 'USD' ? record.currency + ' ' : '$'}
                      {parseFloat(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap">{record.clientName || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{record.categoryName || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={
                        record.status === 'paid' ? 'default' : 
                        record.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }>
                        {record.status || 'paid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{record.invoiceId || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {record.isRecurring ? (
                        <Badge variant={isRecurringActive ? "default" : "outline"}>
                          {record.recurringFrequency || 'recurring'}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {nextDueDate ? nextDueDate.toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.description || '—'}
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
                );
              })
            )}
          </TableBody>
        </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No income records found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Income Record</DialogTitle>
          </DialogHeader>
          <FormComponent />
        </DialogContent>
      </Dialog>
    </div>
  );
}