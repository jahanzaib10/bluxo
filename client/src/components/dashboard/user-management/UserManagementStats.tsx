
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Mail } from 'lucide-react';
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

interface UserManagementStatsProps {
  users: UserProfile[];
  invitations: UserInvitation[];
}

export function UserManagementStats({ users, invitations }: UserManagementStatsProps) {
  const adminCount = users.filter(user => user.role === 'admin' || user.role === 'super_admin').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">{adminCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
