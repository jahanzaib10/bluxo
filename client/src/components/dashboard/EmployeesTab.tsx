import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, ArrowLeft, Upload, Settings, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { apiRequest } from '@/lib/queryClient';

export function EmployeesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    workerFullName: '',
    countryOfResidence: '',
    groupName: '',
    startDate: '',
    personalEmail: '',
    birthDate: '',
    jobTitle: '',
    seniority: '',
    endDate: '',
    paymentAmount: '',
    directManagerId: '',
    comments: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // First get all employees
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Then get manager information separately and merge
  const enrichedEmployees = React.useMemo(() => {
    const employeeList = Array.isArray(employees) ? employees : [];
    if (!employeeList.length) return [];
    
    // Create a map of employee ID to employee info for manager lookup
    const employeeMap = employeeList.reduce((acc: any, emp: any) => {
      acc[emp.id] = emp;
      return acc;
    }, {});
    
    // Merge employees with their manager info
    return employeeList.map((employee: any) => ({
      ...employee,
      directManager: employee.directManagerId 
        ? employeeMap[employee.directManagerId] 
        : null
    }));
  }, [employees]);

  // Filter employees based on search
  const filteredEmployees = enrichedEmployees.filter((employee: any) => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      employee.workerFullName?.toLowerCase().includes(searchLower) ||
      employee.jobTitle?.toLowerCase().includes(searchLower) ||
      employee.personalEmail?.toLowerCase().includes(searchLower) ||
      employee.countryOfResidence?.toLowerCase().includes(searchLower) ||
      employee.groupName?.toLowerCase().includes(searchLower) ||
      employee.directManager?.workerFullName?.toLowerCase().includes(searchLower)
    );
  });

  const createEmployee = useMutation({
    mutationFn: async (data: any) => {
      const cleanData = {
        ...data,
        paymentAmount: data.paymentAmount ? parseFloat(data.paymentAmount) : null,
        directManagerId: data.directManagerId === 'no-manager' ? null : data.directManagerId || null,
        startDate: data.startDate || null,
        birthDate: data.birthDate || null,
        endDate: data.endDate || null
      };
      
      return apiRequest('POST', '/api/employees', cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setShowForm(false);
      resetFormData();
      toast({ title: "Success", description: "Employee added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const cleanData = {
        ...data,
        paymentAmount: data.paymentAmount ? parseFloat(data.paymentAmount) : null,
        directManagerId: data.directManagerId === 'no-manager' ? null : data.directManagerId || null,
        startDate: data.startDate || null,
        birthDate: data.birthDate || null,
        endDate: data.endDate || null
      };
      
      return apiRequest('PUT', `/api/employees/${id}`, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setEditingEmployee(null);
      setShowForm(false);
      resetFormData();
      toast({ title: "Success", description: "Employee updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({ title: "Success", description: "Employee archived successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetFormData = () => {
    setFormData({
      workerFullName: '',
      countryOfResidence: '',
      groupName: '',
      startDate: '',
      personalEmail: '',
      birthDate: '',
      jobTitle: '',
      seniority: '',
      endDate: '',
      paymentAmount: '',
      directManagerId: '',
      comments: ''
    });
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      workerFullName: employee.workerFullName || '',
      countryOfResidence: employee.countryOfResidence || '',
      groupName: employee.groupName || '',
      startDate: employee.startDate || '',
      personalEmail: employee.personalEmail || '',
      birthDate: employee.birthDate || '',
      jobTitle: employee.jobTitle || '',
      seniority: employee.seniority || '',
      endDate: employee.endDate || '',
      paymentAmount: employee.paymentAmount?.toString() || '',
      directManagerId: employee.directManagerId || 'no-manager',
      comments: employee.comments || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      updateEmployee.mutate({ ...formData, id: editingEmployee.id });
    } else {
      createEmployee.mutate(formData);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    resetFormData();
  };

  const handleViewProfile = (employee: any) => {
    setSelectedEmployee(employee);
  };

  const handleBackToList = () => {
    setSelectedEmployee(null);
  };

  // Define table columns with fixed manager display
  const columns: DataTableColumn[] = [
    {
      key: 'workerId',
      label: 'Worker ID',
      minWidth: '80px',
      render: (employee) => (
        <span className="font-mono text-sm">{employee.workerId || '-'}</span>
      )
    },
    {
      key: 'workerFullName',
      label: 'Full Name',
      minWidth: '200px',
      render: (employee) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 flex-shrink-0" />
          <div className="font-medium truncate">{employee.workerFullName}</div>
        </div>
      )
    },
    {
      key: 'jobTitle',
      label: 'Job Title',
      minWidth: '150px',
      render: (employee) => (
        <span className="truncate">{employee.jobTitle || '-'}</span>
      )
    },
    {
      key: 'countryOfResidence',
      label: 'Country',
      minWidth: '120px',
      render: (employee) => (
        <span className="truncate">{employee.countryOfResidence || '-'}</span>
      )
    },
    {
      key: 'groupName',
      label: 'Group',
      minWidth: '120px',
      render: (employee) => (
        <span className="truncate">{employee.groupName || '-'}</span>
      )
    },
    {
      key: 'directManager',
      label: 'Manager',
      minWidth: '150px',
      render: (employee) => (
        <span className="truncate">{employee.directManager?.workerFullName || '-'}</span>
      )
    },
    {
      key: 'startDate',
      label: 'Start Date',
      minWidth: '120px',
      render: (employee) => (
        <span>{employee.startDate ? new Date(employee.startDate).toLocaleDateString() : '-'}</span>
      )
    },
    {
      key: 'personalEmail',
      label: 'Email',
      minWidth: '200px',
      render: (employee) => (
        <span className="truncate">{employee.personalEmail || '-'}</span>
      )
    }
  ];

  // Define table actions
  const actions: DataTableAction[] = [
    {
      label: 'View',
      icon: <User className="h-4 w-4" />,
      onClick: handleViewProfile,
      variant: 'outline'
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
      variant: 'outline'
    },
    {
      label: 'Archive',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (employee) => deleteEmployee.mutate(employee.id),
      variant: 'outline'
    }
  ];

  if (selectedEmployee) {
    return (
      <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-slate-800">Employee Profile</CardTitle>
                    <CardDescription>
                      Detailed information for {selectedEmployee.workerFullName}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Full Name</Label>
                      <p className="text-slate-900">{selectedEmployee.workerFullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Job Title</Label>
                      <p className="text-slate-900">{selectedEmployee.jobTitle || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Country</Label>
                      <p className="text-slate-900">{selectedEmployee.countryOfResidence || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Group</Label>
                      <p className="text-slate-900">{selectedEmployee.groupName || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Email</Label>
                      <p className="text-slate-900">{selectedEmployee.personalEmail || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Start Date</Label>
                      <p className="text-slate-900">{selectedEmployee.startDate ? new Date(selectedEmployee.startDate).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Direct Manager</Label>
                      <p className="text-slate-900">{selectedEmployee.directManager?.workerFullName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Seniority</Label>
                      <p className="text-slate-900">{selectedEmployee.seniority || '-'}</p>
                    </div>
                  </div>
                </div>
                {selectedEmployee.comments && (
                  <div className="mt-6">
                    <Label className="text-sm font-medium text-slate-600">Comments</Label>
                    <p className="text-slate-900 mt-1">{selectedEmployee.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {showForm && (
            <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <CardTitle className="text-slate-800">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
                <CardDescription>
                  {editingEmployee ? 'Update employee information' : 'Create a new employee record'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workerFullName">Full Name</Label>
                      <Input
                        id="workerFullName"
                        value={formData.workerFullName}
                        onChange={(e) => setFormData({ ...formData, workerFullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="personalEmail">Personal Email</Label>
                      <Input
                        id="personalEmail"
                        type="email"
                        value={formData.personalEmail}
                        onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="countryOfResidence">Country of Residence</Label>
                      <Input
                        id="countryOfResidence"
                        value={formData.countryOfResidence}
                        onChange={(e) => setFormData({ ...formData, countryOfResidence: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        value={formData.groupName}
                        onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seniority">Seniority</Label>
                      <Select
                        value={formData.seniority}
                        onValueChange={(value) => setFormData({ ...formData, seniority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select seniority level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Junior">Junior</SelectItem>
                          <SelectItem value="Mid">Mid</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                          <SelectItem value="Lead">Lead</SelectItem>
                          <SelectItem value="Principal">Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birth Date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="directManagerId">Direct Manager</Label>
                      <Select
                        value={formData.directManagerId}
                        onValueChange={(value) => setFormData({ ...formData, directManagerId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-manager">No Manager</SelectItem>
                          {(Array.isArray(employees) ? employees : [])
                            .filter((emp: any) => emp.id !== editingEmployee?.id)
                            .map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.workerFullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentAmount">Payment Amount</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        value={formData.paymentAmount}
                        onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingEmployee ? 'Update' : 'Create'} Employee
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-800">Employees</CardTitle>
                  <CardDescription>
                    Manage your employees and their information.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-1" />
                    Import CSV
                  </Button>
                  <Button size="sm" onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Toggle columns</h4>
                        <div className="space-y-2">
                          {columns.map((column) => (
                            <div key={column.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={column.key}
                                checked={true}
                                onCheckedChange={() => {}}
                              />
                              <label htmlFor={column.key} className="text-sm font-normal">
                                {column.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <DataTable
                  data={filteredEmployees}
                  columns={columns}
                  actions={actions}
                  height="60vh"
                  stickyActions={true}
                  configurableColumns={false}
                  storageKey="employeesColumnPreferences"
                  showColumnConfig={false}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  searchPlaceholder="Search employees..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}