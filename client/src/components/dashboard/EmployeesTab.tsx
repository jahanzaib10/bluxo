import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, UserCheck, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function EmployeesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Success",
        description: "Employee record deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee record?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading employee data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
            <p className="text-sm text-muted-foreground">Manage your team and employee information</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
        
        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-indigo-800 flex items-center">
              <UserCheck className="mr-2 h-4 w-4" />
              Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">
              {Array.isArray(employees) ? employees.length : 0}
            </div>
            <p className="text-xs text-indigo-600">
              Total employees
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {Array.isArray(employees) && employees.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee: any) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1">{employee.name}</h3>
                      {employee.position && (
                        <p className="text-sm text-gray-600 mb-2">{employee.position}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(employee.status)}`}>
                      {employee.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    {employee.email && (
                      <p>Email: {employee.email}</p>
                    )}
                    {employee.department && (
                      <p>Department: {employee.department}</p>
                    )}
                    {employee.hourlyRate && (
                      <p>Rate: ${employee.hourlyRate}/hour</p>
                    )}
                    {employee.salary && (
                      <p>Salary: {formatSalary(employee.salary)}</p>
                    )}
                    {employee.hireDate && (
                      <p>Hired: {new Date(employee.hireDate).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Users className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No employees found</h3>
            <p className="text-sm text-center mb-4">
              Start building your team by adding your first employee
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Employee
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}