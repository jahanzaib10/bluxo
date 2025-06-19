
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchInvitationByToken, 
  InvitationError,
  generateInvitationLink
} from '../invitationUtils';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

const mockSupabase = supabase as any;

describe('invitationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchInvitationByToken', () => {
    it('should fetch valid invitation successfully', async () => {
      const mockInvitation = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        account_id: 'acc-123',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        token: 'valid-token'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockInvitation,
                error: null
              })
            })
          })
        })
      });

      const result = await fetchInvitationByToken('valid-token');
      expect(result).toEqual(mockInvitation);
    });

    it('should throw error for invalid token', async () => {
      await expect(fetchInvitationByToken('')).rejects.toThrow(InvitationError);
      await expect(fetchInvitationByToken('   ')).rejects.toThrow(InvitationError);
    });

    it('should throw error for expired invitation', async () => {
      const expiredInvitation = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        account_id: 'acc-123',
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        token: 'expired-token'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expiredInvitation,
                error: null
              })
            })
          })
        })
      });

      await expect(fetchInvitationByToken('expired-token')).rejects.toThrow('expired');
    });

    it('should handle already accepted invitation', async () => {
      // First call returns PGRST116 (not found for pending)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      });

      // Second call finds the accepted invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '123', accepted_at: '2023-01-01' },
              error: null
            })
          })
        })
      });

      await expect(fetchInvitationByToken('already-accepted')).rejects.toThrow('already been accepted');
    });
  });

  describe('generateInvitationLink', () => {
    it('should generate correct invitation link', () => {
      const token = 'test-token-123';
      const expectedLink = 'https://fin.dartnox.com/invite/test-token-123';
      
      const result = generateInvitationLink(token);
      expect(result).toBe(expectedLink);
    });

    it('should handle special characters in token', () => {
      const token = 'test-token-with-special-chars!@#';
      const expectedLink = 'https://fin.dartnox.com/invite/test-token-with-special-chars!@#';
      
      const result = generateInvitationLink(token);
      expect(result).toBe(expectedLink);
    });
  });

  describe('InvitationError', () => {
    it('should create error with message and code', () => {
      const error = new InvitationError('Test message', 'TEST_CODE');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('InvitationError');
      expect(error instanceof Error).toBe(true);
    });
  });
});
