
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedUserProfile, UserPermission } from '@/types/userManagement';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EnhancedUserProfile | null;
  onUpdate: () => void;
}

export function UserPermissionsDialog({ open, onOpenChange, user, onUpdate }: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchPermissions();
      fetchUserPermissions();
    }
  }, [open, user]);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      
      // Transform data to include granted property
      const transformedPermissions: UserPermission[] = (data || []).map(perm => ({
        id: perm.id,
        name: perm.name,
        description: perm.description || '',
        category: perm.category,
        granted: false // Default value
      }));
      
      setPermissions(transformedPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch permissions",
        variant: "destructive"
      });
    }
  };

  const fetchUserPermissions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_permissions', {
        p_user_id: user.user_id
      });

      if (error) throw error;
      
      const permissionsMap: Record<string, boolean> = {};
      (data || []).forEach((perm: any) => {
        permissionsMap[perm.permission_name] = perm.granted;
      });
      
      setUserPermissions(permissionsMap);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermission = async (permissionId: string, granted: boolean) => {
    if (!user) return;

    try {
      setSaving(true);
      
      if (granted) {
        // Grant permission
        const { error } = await supabase
          .from('user_permissions')
          .upsert({
            user_id: user.user_id,
            permission_id: permissionId,
            granted: true
          });
        
        if (error) throw error;
      } else {
        // Revoke permission or set to false
        const { error } = await supabase
          .from('user_permissions')
          .upsert({
            user_id: user.user_id,
            permission_id: permissionId,
            granted: false
          });
        
        if (error) throw error;
      }

      // Log activity
      await supabase.rpc('log_user_activity', {
        p_user_id: user.user_id,
        p_action: granted ? 'permission_granted' : 'permission_revoked',
        p_details: { permission_id: permissionId }
      });

      toast({
        title: "Success",
        description: `Permission ${granted ? 'granted' : 'revoked'} successfully`,
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, UserPermission[]>);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {user.first_name} {user.last_name}</DialogTitle>
          <DialogDescription>
            Control what this user can access and do in the application.
            <br />
            <Badge variant="outline" className="mt-2">
              Role: {user.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium capitalize">{category}</h4>
                <div className="space-y-2">
                  {categoryPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{permission.description}</div>
                        <div className="text-sm text-muted-foreground">{permission.name}</div>
                      </div>
                      <Switch
                        checked={userPermissions[permission.name] || false}
                        onCheckedChange={(checked) => updateUserPermission(permission.id, checked)}
                        disabled={saving || loading}
                      />
                    </div>
                  ))}
                </div>
                {category !== Object.keys(groupedPermissions)[Object.keys(groupedPermissions).length - 1] && (
                  <Separator />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
