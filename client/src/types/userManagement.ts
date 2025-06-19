
import type { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];

export interface EnhancedUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
  role: UserRole;
  status: string; // Changed from union type to string to match database
  created_at: string;
  last_login_at: string | null;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  email: string;
  account_id: string;
}

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  granted?: boolean; // Made optional since it's not always present
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: string | null; // Changed from string to string | null
  user_agent: string | null;
  created_at: string;
  created_by: string | null;
  user_name?: string;
}

export interface EnhancedUserInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  message: string | null;
  resent_count: number;
  last_resent_at: string | null;
}
