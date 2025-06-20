import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, UserPlus, Settings, Send, RotateCcw, Users, UserCheck, UserX } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { apiRequest } from '@/lib/queryClient';

export function UserManagementSettings() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user' as 'user' | 'admin' | 'super_admin'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get users and invitations
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['/api/invitations'],
  });

  // Combine users and invitations for display
  const allUserEntries = React.useMemo(() => {
    const userEntries = Array.isArray(users) ? users.map((user: any) => ({
      ...user,
      type: 'user',
      status: 'active'
    })) : [];

    const invitationEntries = Array.isArray(invitations) ? invitations.map((invitation: any) => ({
      ...invitation,
      type: 'invitation',
      name: invitation.email,
      status: 'pending'
    })) : [];

    return [...userEntries, ...invitationEntries];
  }, [users, invitations]);

  // Filter users based on search
  const filteredUsers = React.useMemo(() => {
    if (!searchValue) return allUserEntries;
    
    return allUserEntries.filter((entry: any) => {
      const searchTerm = searchValue.toLowerCase();
      return (
        entry.name?.toLowerCase().includes(searchTerm) ||
        entry.email?.toLowerCase().includes(searchTerm) ||
        entry.role?.toLowerCase().includes(searchTerm)
      );
    });
  }, [allUserEntries, searchValue]);

  // Invite user mutation
  const inviteUser = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/invitations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      setShowInviteForm(false);
      setInviteForm({ email: '', role: 'user' });
      toast({ title: "Success", description: "Invitation sent successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Resend invitation mutation
  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      return apiRequest('POST', `/api/invitations/${invitationId}/resend`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invitation resent successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete invitation mutation
  const deleteInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      return apiRequest('DELETE', `/api/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      toast({ title: "Success", description: "Invitation deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate(inviteForm);
  };

  const resetInviteForm = () => {
    setShowInviteForm(false);
    setInviteForm({ email: '', role: 'user' });
  };

  const handleResendInvitation = (invitationId: string) => {
    resendInvitation.mutate(invitationId);
  };

  const handleDeleteInvitation = (invitationId: string) => {
    if (confirm('Are you sure you want to delete this invitation?')) {
      deleteInvitation.mutate(invitationId);
    }
  };

  // Define table columns
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: 'Name/Email',
      minWidth: '250px',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 flex-shrink-0" />
          <div>
            <div className="font-medium">{entry.name || entry.email}</div>
            {entry.name && entry.email && (
              <div className="text-sm text-muted-foreground">{entry.email}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      minWidth: '120px',
      render: (entry) => (
        <Badge variant={entry.role === 'super_admin' ? 'destructive' : entry.role === 'admin' ? 'default' : 'secondary'}>
          {entry.role === 'super_admin' ? 'Super Admin' : entry.role === 'admin' ? 'Admin' : 'User'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '120px',
      render: (entry) => (
        <Badge variant={entry.status === 'active' ? 'default' : 'outline'}>
          {entry.status === 'active' ? (
            <>
              <UserCheck className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <UserX className="h-3 w-3 mr-1" />
              Pending
            </>
          )}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      minWidth: '150px',
      render: (entry) => (
        <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '-'}</span>
      )
    }
  ];

  // Define table actions
  const actions: DataTableAction[] = [
    {
      label: 'Resend',
      icon: <Send className="h-4 w-4" />,
      onClick: (entry) => handleResendInvitation(entry.id),
      variant: 'outline'
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (entry) => entry.type === 'invitation' ? handleDeleteInvitation(entry.id) : null,
      variant: 'outline'
    }
  ];

  // Calculate stats
  const activeUsers = allUserEntries.filter((entry: any) => entry.status === 'active').length;
  const pendingInvitations = allUserEntries.filter((entry: any) => entry.status === 'pending').length;
  const adminUsers = allUserEntries.filter((entry: any) => entry.role === 'admin' || entry.role === 'super_admin').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and organization access
          </p>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUserEntries.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} active, {pendingInvitations} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {adminUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin level access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invite User Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New User</CardTitle>
            <CardDescription>
              Send an invitation to join your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value: 'user' | 'admin' | 'super_admin') => 
                      setInviteForm({ ...inviteForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetInviteForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteUser.isPending}>
                  Send Invitation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-slate-800">Users & Invitations</CardTitle>
              <CardDescription>
                Manage user accounts and pending invitations
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
              data={filteredUsers}
              columns={columns}
              actions={actions}
              height="60vh"
              stickyActions={true}
              configurableColumns={false}
              storageKey="usersColumnPreferences"
              showColumnConfig={false}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search users and invitations..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}