import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, Search, Edit, Trash2, Badge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
    mutationFn: (csvData: any[]) => apiRequest("/api/income/import", "POST", { csvData }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      setIsImportOpen(false);
      setCsvData("");
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
    if (editingIncome) {
      updateMutation.mutate({ id: editingIncome.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {incomeCategories.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    <div className="space-y-6">
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Income Records</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvData">CSV Data</Label>
                  <Textarea
                    id="csvData"
                    placeholder="amount,date,client_name,payment_source_name,category_name,description,is_recurring"
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

      {/* Table */}
      <div className="rounded-md border">
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
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredIncome.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No income records found
                </TableCell>
              </TableRow>
            ) : (
              filteredIncome.map((record: IncomeRecord) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    ${parseFloat(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.clientName || 'N/A'}</TableCell>
                  <TableCell>{record.paymentSourceName || 'N/A'}</TableCell>
                  <TableCell>{record.categoryName || 'N/A'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {record.description || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {record.isRecurring && (
                      <UIBadge variant="secondary">
                        <Badge className="h-3 w-3 mr-1" />
                        Recurring
                      </UIBadge>
                    )}
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