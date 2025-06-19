import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Copy, Trash2, Edit, Mail, Users, UserPlus } from 'lucide-react';
import { generateInvitationLink } from '@/utils/invitationUtils';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  email: string;
  account_id: string;
}

interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

// Use custom domain for invitation links
const getBaseUrl = () => {
  return 'https://fin.dartnox.com';
};

export default function UserManagementTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('user');
  const [sendingInvite, setSendingInvite] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching user profiles...');
      
      // Get current user's session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session.session) {
        console.error('No active session');
        setLoading(false);
        return;
      }

      console.log('Current user ID:', session.session.user.id);

      // Get current user's profile to find their account_id
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('account_id')
        .eq('user_id', session.session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching current user profile:', profileError);
        throw profileError;
      }

      console.log('Current user account ID:', currentUserProfile.account_id);

      // Fetch all user profiles from the same account
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('account_id', currentUserProfile.account_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      console.log('Fetched profiles:', profiles);

      // Get user emails from auth metadata using admin API
      const usersWithEmails: UserProfile[] = [];
      
      for (const profile of profiles || []) {
        try {
          // Try to get user metadata from Supabase auth
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
          
          const email = authUser.user?.email || `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@company.com`;
          
          usersWithEmails.push({
            ...profile,
            email: email
          });
        } catch (error) {
          // Fallback if admin API is not available
          console.log('Admin API not available, using fallback email');
          usersWithEmails.push({
            ...profile,
            email: `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@company.com`
          });
        }
      }

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please check your permissions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      console.log('Fetching invitations...');
      
      // Get current user's account_id first
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data: currentUserProfile } = await supabase
        .from('user_profiles')
        .select('account_id')
        .eq('user_id', session.session.user.id)
        .single();

      if (!currentUserProfile) return;

      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('account_id', currentUserProfile.account_id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }

      console.log('Fetched invitations:', data);
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invitations.",
        variant: "destructive"
      });
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setSendingInvite(true);
    try {
      console.log('Sending invite to:', inviteEmail, 'with role:', inviteRole);
      
      const token = crypto.randomUUID();
      console.log('Generated token:', token);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
      console.log('Expires at:', expiresAt.toISOString());

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('No authenticated user');
      }

      console.log('Current user:', currentUser.user.id);

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('account_id')
        .eq('user_id', currentUser.user.id)
        .single();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      console.log('User account ID:', userProfile.account_id);

      const invitationData = {
        email: inviteEmail,
        role: inviteRole,
        token,
        expires_at: expiresAt.toISOString(),
        account_id: userProfile.account_id,
        invited_by: currentUser.user.id
      };

      console.log('Invitation data to insert:', invitationData);

      const { data: insertResult, error } = await supabase
        .from('user_invitations')
        .insert(invitationData)
        .select(); // Add select to return the inserted data

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      console.log('Invitation created successfully:', insertResult);
      
      // Generate and log the invite link using custom domain
      const inviteLink = generateInvitationLink(token);
      console.log('Generated invite link:', inviteLink);
      
      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}. Link: ${inviteLink}`,
      });

      setInviteEmail('');
      setInviteRole('user');
      setShowInviteDialog(false);
      await fetchInvitations();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteLink = generateInvitationLink(token);
    console.log('Copying invite link:', inviteLink);
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Success",
      description: "Invite link copied to clipboard",
    });
  };

  const deleteInvitation = async (id: string) => {
    try {
      console.log('Deleting invitation:', id);
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting invitation:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Invitation deleted successfully",
      });
      await fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive"
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      console.log('Updating user role:', userId, 'to:', newRole);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      case 'manager':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'user':
        return 'User';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userColumns = [
    {
      key: 'user',
      label: 'USER',
      render: (user: UserProfile) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
            {getInitials(user.first_name, user.last_name)}
          </div>
          <div>
            <div className="font-medium">{user.first_name} {user.last_name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'ROLE',
      render: (user: UserProfile) => (
        <Select 
          value={user.role} 
          onValueChange={(value: UserRole) => updateUserRole(user.user_id, value)}
        >
          <SelectTrigger className="w-32">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleDisplayName(user.role)}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: 'created_at',
      label: 'JOINED',
      render: (user: UserProfile) => (
        <span className="text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to a new user to join your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendInvite} disabled={sendingInvite}>
                {sendingInvite ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold">{invitations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your team members and their roles</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={filteredUsers}
            columns={userColumns}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search users..."
            height="400px"
          />
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Users who have been invited but haven't accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                      {invitation.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Role: {getRoleDisplayName(invitation.role)} • 
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(invitation.token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInvitation(invitation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
