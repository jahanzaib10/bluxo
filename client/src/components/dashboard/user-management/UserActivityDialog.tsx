
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedUserProfile, UserActivityLog } from '@/types/userManagement';

interface UserActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EnhancedUserProfile | null;
}

export function UserActivityDialog({ open, onOpenChange, user }: UserActivityDialogProps) {
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchUserActivities();
    }
  }, [open, user]);

  const fetchUserActivities = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Simplified query without the problematic join
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform the data to match our expected type
      const transformedData: UserActivityLog[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        action: item.action,
        details: item.details,
        ip_address: item.ip_address as string | null,
        user_agent: item.user_agent,
        created_at: item.created_at,
        created_by: item.created_by
      }));
      
      setActivities(transformedData);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'bg-green-100 text-green-800';
    if (action.includes('permission')) return 'bg-blue-100 text-blue-800';
    if (action.includes('suspended')) return 'bg-red-100 text-red-800';
    if (action.includes('role')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Activity - {user.first_name} {user.last_name}</DialogTitle>
          <DialogDescription>
            Recent activity and changes for this user account.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No activities found for this user.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(activity.action)}>
                          {activity.action.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {activity.details && (
                        <div className="text-sm">
                          <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-2 rounded">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {activity.ip_address && (
                        <div className="text-xs text-muted-foreground">
                          IP: {activity.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
