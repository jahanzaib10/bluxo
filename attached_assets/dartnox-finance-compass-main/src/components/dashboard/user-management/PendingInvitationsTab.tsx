
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

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

interface PendingInvitationsTabProps {
  invitations: UserInvitation[];
  onRefreshInvitations: () => void;
}

export function PendingInvitationsTab({ invitations, onRefreshInvitations }: PendingInvitationsTabProps) {
  const { toast } = useToast();

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

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Success",
      description: "Invite link copied to clipboard",
    });
  };

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Invitation deleted successfully",
      });
      onRefreshInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Users who have been invited but haven't accepted yet</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefreshInvitations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
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
                  {invitation.message && (
                    <p className="text-sm text-muted-foreground italic">
                      Message: {invitation.message}
                    </p>
                  )}
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
          {invitations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
