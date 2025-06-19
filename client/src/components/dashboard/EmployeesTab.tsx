import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, ArrowLeft, Upload, Settings, Search } from 'lucide-react';
import { EmployeeProfile } from './EmployeeProfile';
import { CSVImportDialog } from './CSVImportDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export function EmployeesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    worker_full_name: '',
    country_of_residence: '',
    group_name: '',
    start_date: '',
    personal_email: '',
    birth_date: '',
    job_title: '',
    seniority: '',
    end_date: '',
    payment_amount: '',
    direct_manager_id: '',
    comments: ''
  });

  const queryClient = useQueryClient();

  // First get all employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('archived', false)
        .order('worker_id', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Then get manager information separately and merge
  const { data: enrichedEmployees = [] } = useQuery({
    queryKey: ['employees-with-managers', employees],
    queryFn: async () => {
      if (!employees.length) return [];
      
      // Get all manager IDs
      const managerIds = employees
        .map(emp => emp.direct_manager_id)
        .filter(Boolean);
      
      // Get manager details
      const { data: managers, error } = await supabase
        .from('employees')
        .select('id, worker_full_name')
        .in('id', managerIds);
      
      if (error) throw error;
      
      // Create a map of manager ID to manager info
      const managerMap = (managers || []).reduce((acc, manager) => {
        acc[manager.id] = manager;
        return acc;
      }, {} as Record<string, any>);
      
      // Merge employees with their manager info
      return employees.map(employee => ({
        ...employee,
        direct_manager: employee.direct_manager_id 
          ? managerMap[employee.direct_manager_id] 
          : null
      }));
    },
    enabled: employees.length > 0,
  });

  // Filter employees based on search
  const filteredEmployees = enrichedEmployees.filter(employee => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      employee.worker_full_name?.toLowerCase().includes(searchLower) ||
      employee.job_title?.toLowerCase().includes(searchLower) ||
      employee.personal_email?.toLowerCase().includes(searchLower) ||
      employee.country_of_residence?.toLowerCase().includes(searchLower) ||
      employee.group_name?.toLowerCase().includes(searchLower) ||
      employee.direct_manager?.worker_full_name?.toLowerCase().includes(searchLower)
    );
  });

  const createEmployee = useMutation({
    mutationFn: async (data: any) => {
      const cleanData = {
        ...data,
        payment_amount: data.payment_amount ? parseFloat(data.payment_amount) : null,
        direct_manager_id: data.direct_manager_id === 'no-manager' ? null : data.direct_manager_id || null,
        start_date: data.start_date || null,
        birth_date: data.birth_date || null,
        end_date: data.end_date || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };
      
      const { error } = await supabase
        .from('employees')
        .insert([cleanData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
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
        payment_amount: data.payment_amount ? parseFloat(data.payment_amount) : null,
        direct_manager_id: data.direct_manager_id === 'no-manager' ? null : data.direct_manager_id || null,
        start_date: data.start_date || null,
        birth_date: data.birth_date || null,
        end_date: data.end_date || null
      };
      
      const { error } = await supabase
        .from('employees')
        .update(cleanData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingEmployee(null);
      resetFormData();
      toast({ title: "Success", description: "Employee updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const archiveEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: "Success", description: "Employee archived successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetFormData = () => {
    setFormData({
      worker_full_name: '',
      country_of_residence: '',
      group_name: '',
      start_date: '',
      personal_email: '',
      birth_date: '',
      job_title: '',
      seniority: '',
      end_date: '',
      payment_amount: '',
      direct_manager_id: '',
      comments: ''
    });
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      worker_full_name: employee.worker_full_name || '',
      country_of_residence: employee.country_of_residence || '',
      group_name: employee.group_name || '',
      start_date: employee.start_date || '',
      personal_email: employee.personal_email || '',
      birth_date: employee.birth_date || '',
      job_title: employee.job_title || '',
      seniority: employee.seniority || '',
      end_date: employee.end_date || '',
      payment_amount: employee.payment_amount?.toString() || '',
      direct_manager_id: employee.direct_manager_id || 'no-manager',
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
      key: 'worker_id',
      label: 'Worker ID',
      minWidth: '80px',
      render: (employee) => (
        <span className="font-mono text-sm">{employee.worker_id}</span>
      )
    },
    {
      key: 'worker_full_name',
      label: 'Full Name',
      minWidth: '200px',
      render: (employee) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 flex-shrink-0" />
          <div className="font-medium truncate">{employee.worker_full_name}</div>
        </div>
      )
    },
    {
      key: 'job_title',
      label: 'Job Title',
      minWidth: '150px',
      render: (employee) => (
        <span className="truncate">{employee.job_title || '-'}</span>
      )
    },
    {
      key: 'country_of_residence',
      label: 'Country',
      minWidth: '120px',
      render: (employee) => (
        <span className="truncate">{employee.country_of_residence || '-'}</span>
      )
    },
    {
      key: 'group_name',
      label: 'Group',
      minWidth: '120px',
      render: (employee) => (
        <span className="truncate">{employee.group_name || '-'}</span>
      )
    },
    {
      key: 'direct_manager',
      label: 'Manager',
      minWidth: '150px',
      render: (employee) => (
        <span className="truncate">{employee.direct_manager?.worker_full_name || '-'}</span>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      minWidth: '120px'
    },
    {
      key: 'personal_email',
      label: 'Email',
      minWidth: '200px',
      render: (employee) => (
        <span className="truncate">{employee.personal_email || '-'}</span>
      )
    },
    {
      key: 'birth_date',
      label: 'Birth Date',
      minWidth: '120px'
    },
    {
      key: 'seniority',
      label: 'Seniority',
      minWidth: '120px',
      render: (employee) => (
        <span className="truncate">{employee.seniority || '-'}</span>
      )
    },
    {
      key: 'end_date',
      label: 'End Date',
      minWidth: '120px'
    },
    {
      key: 'payment_amount',
      label: 'Payment Amount',
      minWidth: '140px',
      render: (employee) => (
        <span>{employee.payment_amount ? `$${employee.payment_amount}` : '-'}</span>
      )
    }
  ];

  // Define table actions
  const actions: DataTableAction[] = [
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
      variant: 'outline'
    },
    {
      label: 'Archive',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (employee) => archiveEmployee.mutate(employee.id),
      variant: 'outline'
    }
  ];

  // If an employee is selected, show their profile
  if (selectedEmployee) {
    return (
      <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b bg-background">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedEmployee.worker_full_name}</h2>
              <p className="text-muted-foreground">{selectedEmployee.job_title}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <EmployeeProfile employee={selectedEmployee} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 space-y-6 w-full">
          {showForm && (
            <Card className="w-full border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
                <CardTitle className="text-slate-800">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
                <CardDescription>
                  {editingEmployee ? 'Update employee information' : 'Add a new employee to your team'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="worker_full_name">Full Name *</Label>
                      <Input
                        id="worker_full_name"
                        value={formData.worker_full_name}
                        onChange={(e) => setFormData({ ...formData, worker_full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        placeholder="e.g., Software Engineer, Designer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="personal_email">Personal Email</Label>
                      <Input
                        id="personal_email"
                        type="email"
                        value={formData.personal_email}
                        onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country_of_residence">Country of Residence</Label>
                      <Input
                        id="country_of_residence"
                        value={formData.country_of_residence}
                        onChange={(e) => setFormData({ ...formData, country_of_residence: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="group_name">Group</Label>
                      <Input
                        id="group_name"
                        value={formData.group_name}
                        onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seniority">Seniority</Label>
                      <Input
                        id="seniority"
                        value={formData.seniority}
                        onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
                        placeholder="e.g., Junior, Senior, Lead"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Birth Date</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_amount">Payment Amount</Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        step="0.01"
                        value={formData.payment_amount}
                        onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                        placeholder="Monthly salary or hourly rate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direct_manager_id">Direct Manager</Label>
                      <Select value={formData.direct_manager_id || 'no-manager'} onValueChange={(value) => setFormData({ ...formData, direct_manager_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-manager">No Manager</SelectItem>
                          {employees.filter(emp => emp.id !== editingEmployee?.id).map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.worker_full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      placeholder="Additional notes about the employee..."
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

          <Card className="w-full border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-800">Employees</CardTitle>
                  <CardDescription>
                    Manage your team members. Click on an employee row to view their profile and expenses.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <CSVImportDialog />
                  <Button size="sm" onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
              <DataTable
                data={filteredEmployees}
                columns={columns}
                actions={actions}
                onRowClick={handleViewProfile}
                height="70vh"
                stickyActions={true}
                configurableColumns={false}
                storageKey="employeesColumnPreferences"
                showColumnConfig={false}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search employees..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
