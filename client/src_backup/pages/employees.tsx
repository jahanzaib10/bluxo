import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import AddRecordModal from "@/components/modals/add-record-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { IdCard, Search, Edit, Trash2, Calendar, Archive, Users } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete employee: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.group_name && employee.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <Header 
        title="Employees" 
        subtitle="Manage employee records and organizational structure"
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <AddRecordModal />
        </div>

        <Card className="bg-surface shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <IdCard className="mr-2 h-5 w-5" />
              All Employees ({filteredEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEmployees.length > 0 ? (
              <div className="space-y-4">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <IdCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {employee.group_name && (
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {employee.group_name}
                            </span>
                          )}
                          {employee.birth_date && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Born: {formatDate(employee.birth_date)}
                            </span>
                          )}
                          <span>Joined: {formatDate(employee.created_at)}</span>
                        </div>
                        {employee.comments && (
                          <p className="text-xs text-gray-500 mt-1 max-w-md truncate">
                            {employee.comments}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {employee.archived ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          <Archive className="h-3 w-3 mr-1" />
                          Archived
                        </Badge>
                      ) : employee.end_date ? (
                        <Badge variant="secondary" className="bg-warning bg-opacity-10 text-warning">
                          Terminated
                        </Badge>
                      ) : (
                        <Badge className="bg-success bg-opacity-10 text-success">
                          Active
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IdCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "No employees match your search criteria." : "Get started by adding your first employee."}
                </p>
                {!searchTerm && <AddRecordModal />}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
