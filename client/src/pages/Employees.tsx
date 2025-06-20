import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Upload, Download, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  birthDate: string | null;
  seniorityLevel: string | null;
  paymentAmount: number | null;
  directManagerId: string | null;
  groupName: string | null;
  status: string;
  createdAt: string;
}

export default function Employees() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    country: "",
    startDate: "",
    endDate: "",
    birthDate: "",
    seniorityLevel: "",
    paymentAmount: "",
    groupName: "",
    status: "active",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create employee", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      await apiRequest(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee updated successfully" });
      setIsEditOpen(false);
      setEditingEmployee(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update employee", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/employees/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete employee", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (employeeData: any[]) => {
      await apiRequest("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: employeeData }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: `Successfully imported ${variables.length} employees` });
      setIsImportOpen(false);
      setCsvData([]);
      setCsvPreview([]);
    },
    onError: () => {
      toast({ title: "Failed to import employees", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      position: "",
      country: "",
      startDate: "",
      endDate: "",
      status: "active",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      position: employee.position || "",
      country: employee.country || "",
      startDate: employee.startDate || "",
      endDate: employee.endDate || "",
      status: employee.status,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || null;
        });
        return obj;
      });
      
      setCsvData(data);
      setCsvPreview(data.slice(0, 5)); // Show first 5 rows for preview
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = "name,email,position,country,start_date,end_date,status\nJohn Doe,john@example.com,Developer,USA,2024-01-01,,active\nJane Smith,jane@example.com,Designer,Canada,2024-02-01,,active";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    importMutation.mutate(csvData);
  };

  const filteredEmployees = employees.filter((employee: Employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Loading employees...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Import Employees from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose CSV File
                  </Button>
                </div>
                
                {csvPreview.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Preview ({csvData.length} total records)</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.email}</TableCell>
                              <TableCell>{row.position}</TableCell>
                              <TableCell>{row.country}</TableCell>
                              <TableCell>{row.start_date}</TableCell>
                              <TableCell>{row.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => {setCsvData([]); setCsvPreview([])}}>
                        Cancel
                      </Button>
                      <Button onClick={handleImport} disabled={importMutation.isPending}>
                        {importMutation.isPending ? "Importing..." : `Import ${csvData.length} Employees`}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Employee"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employees ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee: Employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email || "—"}</TableCell>
                      <TableCell>{employee.position || "—"}</TableCell>
                      <TableCell>{employee.country || "—"}</TableCell>
                      <TableCell>{employee.startDate ? new Date(employee.startDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{employee.endDate ? new Date(employee.endDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'default' : employee.status === 'inactive' ? 'secondary' : 'destructive'}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {searchTerm ? "No employees found matching your search." : "No employees found. Add your first employee to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Employee"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}