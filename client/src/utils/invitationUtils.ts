
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/userManagement';

export interface InvitationData {
  id: string;
  email: string;
  role: UserRole;
  account_id: string;
  expires_at: string;
  message?: string;
  token: string;
}

export class InvitationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'InvitationError';
  }
}

// Use custom domain for invitation links
const getBaseUrl = () => {
  return 'https://fin.dartnox.com';
};

export const fetchInvitationByToken = async (token: string): Promise<InvitationData | null> => {
  console.log('[INVITATION_FETCH] Looking up token:', token);
  
  if (!token?.trim()) {
    throw new InvitationError('Invalid invitation token', 'INVALID_TOKEN');
  }

  const cleanToken = token.trim();
  
  const { data, error } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('token', cleanToken)
    .is('accepted_at', null)
    .single();

  if (error) {
    console.error('[INVITATION_FETCH] Database error:', error);
    
    if (error.code === 'PGRST116') {
      // Check if invitation exists but was already accepted
      const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', cleanToken)
        .single();
        
      if (existingInvitation) {
        throw new InvitationError('This invitation has already been accepted', 'ALREADY_ACCEPTED');
      } else {
        throw new InvitationError('Invalid or expired invitation link', 'NOT_FOUND');
      }
    }
    
    throw new InvitationError(`Database error: ${error.message}`, 'DATABASE_ERROR');
  }

  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    throw new InvitationError('This invitation has expired', 'EXPIRED');
  }

  console.log('[INVITATION_FETCH] Found valid invitation:', data);
  return data;
};

// Export function to generate invitation links with custom domain
export const generateInvitationLink = (token: string) => {
  return `${getBaseUrl()}/invite/${token}`;
};
