import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Users, Building } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function ClientsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading client data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
            <p className="text-sm text-muted-foreground">Manage your client relationships</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Building className="mr-2 h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {Array.isArray(clients) ? clients.length : 0}
            </div>
            <p className="text-xs text-blue-600">
              Active client relationships
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {Array.isArray(clients) && clients.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client: any) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1">{client.name}</h3>
                      {client.company && (
                        <p className="text-sm text-gray-600 mb-2">{client.company}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                      {client.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    {client.email && (
                      <p>Email: {client.email}</p>
                    )}
                    {client.phone && (
                      <p>Phone: {client.phone}</p>
                    )}
                    {client.industry && (
                      <p>Industry: {client.industry}</p>
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
                      onClick={() => handleDelete(client.id)}
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
            <h3 className="text-lg font-medium mb-2">No clients found</h3>
            <p className="text-sm text-center mb-4">
              Start building your client base by adding your first client
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Client
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}