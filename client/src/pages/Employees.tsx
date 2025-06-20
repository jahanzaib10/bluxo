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
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
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
    directManagerId: "",
    groupName: "",
    status: "active",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Create a map of employee IDs to names for manager lookup
  const employeeMap = (employees as Employee[]).reduce((acc: Record<string, string>, emp: Employee) => {
    acc[emp.id] = emp.name;
    return acc;
  }, {});

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
      return await apiRequest("/api/employees/import", "POST", { employees: employeeData });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: `Successfully imported ${variables.length} employees` });
      setIsImportOpen(false);
      setCsvData([]);
      setCsvPreview([]);
      setShowPreview(false);
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
      birthDate: "",
      seniorityLevel: "",
      paymentAmount: "",
      directManagerId: "",
      groupName: "",
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
      birthDate: employee.birthDate || "",
      seniorityLevel: employee.seniorityLevel || "",
      paymentAmount: employee.paymentAmount?.toString() || "",
      directManagerId: employee.directManagerId || "",
      groupName: employee.groupName || "",
      status: employee.status,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const mapCSVFieldToEmployee = (csvData: any) => {
    return {
      name: csvData['Worker Full Name'] || csvData['Name'] || '',
      email: csvData['Personal Email'] || csvData['Email'] || '',
      position: csvData['Job Title'] || csvData['Position'] || '',
      country: csvData['Country of Residence'] || csvData['Country'] || '',
      startDate: csvData['Start Date'] || csvData['start_date'] || '',
      endDate: csvData['End Date'] || csvData['end_date'] || '',
      birthDate: csvData['Birth date'] || csvData['birth_date'] || '',
      seniorityLevel: csvData['Seniority'] || csvData['seniority_level'] || '',
      paymentAmount: csvData['Payment Amount'] || csvData['payment_amount'] || '',
      directManagerId: csvData['Direct Manager Name'] || csvData['manager'] || '',
      groupName: csvData['Group'] || csvData['group_name'] || '',
      status: 'active'
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);
      
      const data = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return mapCSVFieldToEmployee(obj);
      });
      
      setCsvData(data);
      setCsvPreview(data);
      setCsvHeaders(headers);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = "name,email,position,country,start_date,end_date,birth_date,seniority_level,payment_amount,group_name,status\nJohn Doe,john@dartnox.com,Senior Developer,Pakistan,2023-01-15,,1990-05-20,Senior,PKR 150000,Engineering,active\nJane Smith,jane@dartnox.com,UI/UX Designer,USA,2023-03-01,,1988-12-10,Mid,USD 75000,Design,active\nAli Hassan,ali@dartnox.com,Project Manager,Pakistan,2022-06-01,,1985-08-15,Senior,PKR 200000,Management,active";
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

  const filteredEmployees = (employees as Employee[]).filter((employee: Employee) =>
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
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                
                {showPreview && csvPreview.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Preview ({csvData.length} total records)</h3>
                    {/* Debug info to see headers and first row data */}
                    <div className="text-xs text-gray-600 mb-2">
                      CSV Headers: {csvHeaders.join(", ")}
                    </div>
                    {csvPreview.length > 0 && (
                      <div className="text-xs text-gray-600 mb-2">
                        First row data: {JSON.stringify(csvPreview[0], null, 2)}
                      </div>
                    )}
                    <div className="border rounded-lg overflow-x-auto">
                      <Table className="min-w-max">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Group</TableHead>
                            <TableHead>Seniority</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Birth Date</TableHead>
                            <TableHead>Manager</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.name || "—"}</TableCell>
                              <TableCell>{row.email || "—"}</TableCell>
                              <TableCell>{row.position || "—"}</TableCell>
                              <TableCell>{row.groupName || "—"}</TableCell>
                              <TableCell>{row.seniorityLevel || "—"}</TableCell>
                              <TableCell>{row.paymentAmount || "—"}</TableCell>
                              <TableCell>{row.startDate || "—"}</TableCell>
                              <TableCell>{row.endDate || "—"}</TableCell>
                              <TableCell>{row.birthDate || "—"}</TableCell>
                              <TableCell>{row.directManagerId || "—"}</TableCell>
                              <TableCell>{row.status || "active"}</TableCell>
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
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      required
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
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
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
                  <div>
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seniorityLevel">Seniority Level</Label>
                    <Select value={formData.seniorityLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, seniorityLevel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentAmount">Payment Amount</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      value={formData.paymentAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                      placeholder="e.g., 150000.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="directManagerId">Manager</Label>
                    <Select value={formData.directManagerId} onValueChange={(value) => setFormData(prev => ({ ...prev, directManagerId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Manager</SelectItem>
                        {(employees as Employee[]).map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="groupName">Group/Department</Label>
                    <Input
                      id="groupName"
                      value={formData.groupName}
                      onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
                      placeholder="e.g., Engineering, Design"
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
                    <TableHead>Group</TableHead>
                    <TableHead>Seniority</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Birth Date</TableHead>
                    <TableHead>Manager</TableHead>
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
                      <TableCell>{employee.groupName || "—"}</TableCell>
                      <TableCell>
                        {employee.seniorityLevel ? (
                          <Badge variant="outline">{employee.seniorityLevel}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {employee.paymentAmount ? 
                          new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD',
                            minimumFractionDigits: 0 
                          }).format(employee.paymentAmount) 
                          : "—"
                        }
                      </TableCell>
                      <TableCell>{employee.startDate ? new Date(employee.startDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{employee.endDate ? new Date(employee.endDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{employee.birthDate ? new Date(employee.birthDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{employee.directManagerId ? employeeMap[employee.directManagerId] || "—" : "—"}</TableCell>
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