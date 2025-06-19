
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Shield, 
  UserX, 
  Trash2, 
  Key, 
  Activity,
  Edit 
} from 'lucide-react';
import { EnhancedUserProfile } from '@/types/userManagement';

interface UserCardProps {
  user: EnhancedUserProfile;
  onEdit: (user: EnhancedUserProfile) => void;
  onManagePermissions: (user: EnhancedUserProfile) => void;
  onSuspend: (user: EnhancedUserProfile) => void;
  onDelete: (user: EnhancedUserProfile) => void;
  onResetPassword: (user: EnhancedUserProfile) => void;
  onViewActivity: (user: EnhancedUserProfile) => void;
}

export function UserCard({ 
  user, 
  onEdit, 
  onManagePermissions, 
  onSuspend, 
  onDelete, 
  onResetPassword, 
  onViewActivity 
}: UserCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'suspended':
        return 'destructive' as const;
      case 'pending':
        return 'secondary' as const;
      case 'inactive':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-medium text-blue-600">
              {getInitials(user.first_name, user.last_name)}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {user.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManagePermissions(user)}>
                <Shield className="h-4 w-4 mr-2" />
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewActivity(user)}>
                <Activity className="h-4 w-4 mr-2" />
                View Activity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSuspend(user)}>
                <UserX className="h-4 w-4 mr-2" />
                {user.status === 'suspended' ? 'Activate' : 'Suspend'} User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(user)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Joined:</span>
            <div>{new Date(user.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Last Login:</span>
            <div>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
