import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Users, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export function ClientsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('archived', false)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchValue) return clients;
    
    return clients.filter((client) => {
      const searchTerm = searchValue.toLowerCase();
      return (
        client.name?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm)
      );
    });
  }, [clients, searchValue]);

  const createClient = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('clients')
        .insert([{ ...data, created_by: (await supabase.auth.getUser()).data.user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-count'] });
      setShowForm(false);
      setFormData({ name: '', email: '' });
      toast({ title: "Success", description: "Client created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingClient(null);
      setFormData({ name: '', email: '' });
      toast({ title: "Success", description: "Client updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-count'] });
      toast({ title: "Success", description: "Client archived successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient.mutate({ ...formData, id: editingClient.id });
    } else {
      createClient.mutate(formData);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: '', email: '' });
  };

  // Define table columns
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      minWidth: '200px',
      render: (client) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 flex-shrink-0" />
          <div className="font-medium truncate">{client.name}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      minWidth: '250px',
      render: (client) => (
        <span className="truncate">{client.email || '-'}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Created Date',
      minWidth: '150px',
      render: (client) => (
        <span>{new Date(client.created_at).toLocaleDateString()}</span>
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
      onClick: (client) => deleteClient.mutate(client.id),
      variant: 'outline'
    }
  ];

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {showForm && (
            <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <CardTitle className="text-slate-800">{editingClient ? 'Edit Client' : 'Add New Client'}</CardTitle>
                <CardDescription>
                  {editingClient ? 'Update client information' : 'Create a new client'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Optional email address"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingClient ? 'Update' : 'Create'} Client
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
                  <CardTitle className="text-slate-800">Clients</CardTitle>
                  <CardDescription>
                    Manage your clients and their information.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
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
                  data={filteredClients}
                  columns={columns}
                  actions={actions}
                  height="60vh"
                  stickyActions={true}
                  configurableColumns={false}
                  storageKey="clientsColumnPreferences"
                  showColumnConfig={false}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  searchPlaceholder="Search clients..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
