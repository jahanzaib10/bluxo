import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus } from 'lucide-react';
import { UsersTab } from './user-management/UsersTab';
import { PendingInvitationsTab } from './user-management/PendingInvitationsTab';
import { UserManagementStats } from './user-management/UserManagementStats';
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
  last_login_at?: string;
  status?: string;
}

interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  message?: string;
}

// Use custom domain for invitation links
const getBaseUrl = () => {
  return 'https://fin.dartnox.com';
};

export default function EnhancedUserManagementTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('user');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUserRole();
    fetchUsers();
    fetchInvitations();
  }, []);

  const fetchCurrentUserRole = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.session.user.id)
        .single();

      if (profile) {
        setCurrentUserRole(profile.role);
      }
    } catch (error) {
      console.error('Error fetching current user role:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching user profiles...');
      
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

      const { data: currentUserProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('account_id, role')
        .eq('user_id', session.session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching current user profile:', profileError);
        throw profileError;
      }

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

      // Get real email addresses - for super admins show a note about email availability
      const usersWithEmails: UserProfile[] = [];
      
      if (profiles) {
        for (const profile of profiles) {
          let userEmail = '';
          
          // For the current user, always use their session email
          if (profile.user_id === session.session.user.id) {
            userEmail = session.session.user.email || '';
          } else {
            // For other users, show a note about email privacy
            if (currentUserProfile.role === 'super_admin') {
              // Even super admins can't access other users' emails through the client SDK
              // This would require server-side admin access
              userEmail = `Email not available (admin access required)`;
            } else {
              userEmail = `${profile.first_name} ${profile.last_name} (Email Hidden)`;
            }
          }

          usersWithEmails.push({
            ...profile,
            email: userEmail
          });
        }
      }

      console.log('Users with emails:', usersWithEmails);
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
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data: currentUserProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('account_id')
        .eq('user_id', session.session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile for invitations:', profileError);
        return;
      }

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

      setInvitations(data || []);
    } catch (error) {
      console.error('Error in fetchInvitations:', error);
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
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('No authenticated user');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('account_id')
        .eq('user_id', currentUser.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const invitationData = {
        email: inviteEmail,
        role: inviteRole,
        token,
        expires_at: expiresAt.toISOString(),
        account_id: userProfile.account_id,
        invited_by: currentUser.user.id,
        message: inviteMessage || null
      };

      const { data: insertResult, error } = await supabase
        .from('user_invitations')
        .insert(invitationData)
        .select();

      if (error) {
        throw error;
      }

      const inviteLink = generateInvitationLink(token);
      
      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}. Link: ${inviteLink}`,
      });

      setInviteEmail('');
      setInviteRole('user');
      setInviteMessage('');
      setShowInviteDialog(false);
      
      setTimeout(() => {
        fetchInvitations();
      }, 1000);
      
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
            <p className="text-sm text-muted-foreground">Comprehensive user and permission management</p>
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
              <div>
                <label className="text-sm font-medium">Message (Optional)</label>
                <Textarea
                  placeholder="Add a personal message to the invitation..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
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
      <UserManagementStats users={users} invitations={invitations} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersTab users={users} onRefreshUsers={fetchUsers} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingInvitationsTab invitations={invitations} onRefreshInvitations={fetchInvitations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
