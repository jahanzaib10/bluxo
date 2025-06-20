import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, ArrowLeft, Upload, Settings, Search, Users, Calendar, Briefcase } from 'lucide-react';
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

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Create enriched employees with manager information
  const enrichedEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    
    // Create a map of employee ID to employee info for manager lookup
    const employeeMap = employees.reduce((acc: any, emp: any) => {
      acc[emp.id] = emp;
      return acc;
    }, {});
    
    // Merge employees with their manager info
    return employees.map((employee: any) => ({
      ...employee,
      directManager: employee.directManagerId 
        ? employeeMap[employee.directManagerId] 
        : null
    }));
  }, [employees]);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchValue) return enrichedEmployees;
    const searchLower = searchValue.toLowerCase();
    return enrichedEmployees.filter((employee: any) => 
      employee.workerFullName?.toLowerCase().includes(searchLower) ||
      employee.jobTitle?.toLowerCase().includes(searchLower) ||
      employee.personalEmail?.toLowerCase().includes(searchLower) ||
      employee.countryOfResidence?.toLowerCase().includes(searchLower) ||
      employee.groupName?.toLowerCase().includes(searchLower) ||
      employee.directManager?.workerFullName?.toLowerCase().includes(searchLower)
    );
  }, [enrichedEmployees, searchValue]);

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
      toast({ title: "Success", description: "Employee deleted successfully." });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateEmployee.mutate({ id: editingEmployee.id, ...formData });
    } else {
      createEmployee.mutate(formData);
    }
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
      directManagerId: employee.directManagerId || '',
      comments: employee.comments || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee.mutate(id);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    resetFormData();
  };

  // Calculate stats
  const activeEmployees = Array.isArray(employees) ? employees.filter((emp: any) => !emp.endDate) : [];
  const managersCount = Array.isArray(employees) ? new Set(employees.map((emp: any) => emp.directManagerId).filter(Boolean)).size : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(employees) ? employees.length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeEmployees.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {managersCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Direct managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(employees) ? employees.filter((emp: any) => {
                if (!emp.startDate) return false;
                const startDate = new Date(emp.startDate);
                const currentDate = new Date();
                return startDate.getMonth() === currentDate.getMonth() && 
                       startDate.getFullYear() === currentDate.getFullYear();
              }).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Started this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Manage employee profiles and organizational structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.map((employee: any) => (
              <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{employee.workerFullName}</h3>
                    {employee.jobTitle && (
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {employee.jobTitle}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {employee.personalEmail && (
                      <span>📧 {employee.personalEmail}</span>
                    )}
                    {employee.countryOfResidence && (
                      <span>🌍 {employee.countryOfResidence}</span>
                    )}
                    {employee.directManager && (
                      <span>👤 Reports to: {employee.directManager.workerFullName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {employee.groupName && (
                      <span>Team: {employee.groupName}</span>
                    )}
                    {employee.seniority && (
                      <span>Level: {employee.seniority}</span>
                    )}
                    {employee.startDate && (
                      <span>Started: {new Date(employee.startDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(employee.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchValue ? 'No employees match your search' : 'No employees found'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
            <CardDescription>
              {editingEmployee ? 'Update employee information' : 'Enter details for the new employee'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workerFullName">Full Name</Label>
                  <Input
                    id="workerFullName"
                    value={formData.workerFullName}
                    onChange={(e) => setFormData({ ...formData, workerFullName: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Email</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    placeholder="Enter email address"
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
                    placeholder="Enter job title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seniority">Seniority Level</Label>
                  <Select
                    value={formData.seniority}
                    onValueChange={(value) => setFormData({ ...formData, seniority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seniority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Team/Group</Label>
                  <Input
                    id="groupName"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    placeholder="Enter team or group name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryOfResidence">Country</Label>
                  <Input
                    id="countryOfResidence"
                    value={formData.countryOfResidence}
                    onChange={(e) => setFormData({ ...formData, countryOfResidence: e.target.value })}
                    placeholder="Enter country of residence"
                  />
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
                      {Array.isArray(employees) && employees
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
                    placeholder="Enter payment amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Additional notes or comments..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
                  {editingEmployee ? 'Update' : 'Create'} Employee
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}