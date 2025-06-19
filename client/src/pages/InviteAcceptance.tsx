import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchInvitationByToken, 
  InvitationError,
  type InvitationData 
} from '@/utils/invitationUtils';

export default function InviteAcceptance() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  
  // Form state for new user creation
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - no token provided');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const invitationData = await fetchInvitationByToken(token!);
      setInvitation(invitationData);
    } catch (err) {
      if (err instanceof InvitationError) {
        setError(err.message);
      } else {
        console.error('Unexpected error loading invitation:', err);
        setError('Failed to load invitation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !token) {
      toast({
        title: "Error",
        description: "Invalid invitation",
        variant: "destructive"
      });
      return;
    }

    setAccepting(true);
    
    // Declare currentUser outside try block so it's accessible in catch block
    let currentUser = user;
    
    try {
      // If user is not logged in, create a new account
      if (!currentUser) {
        if (!firstName.trim() || !lastName.trim() || !password || password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Please fill in all fields correctly",
            variant: "destructive"
          });
          setAccepting(false);
          return;
        }

        if (password.length < 6) {
          toast({
            title: "Error", 
            description: "Password must be at least 6 characters",
            variant: "destructive"
          });
          setAccepting(false);
          return;
        }

        console.log('Creating new user account for invitation');
        
        // Create new user account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: invitation.email,
          password: password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              skip_profile_creation: 'true' // Skip automatic profile creation
            }
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          toast({
            title: "Error",
            description: signUpError.message,
            variant: "destructive"
          });
          setAccepting(false);
          return;
        }

        if (!signUpData.user) {
          toast({
            title: "Error",
            description: "Failed to create user account",
            variant: "destructive"
          });
          setAccepting(false);
          return;
        }

        currentUser = signUpData.user;
        console.log('New user created:', currentUser.id);
      }

      // Verify email matches invitation
      if (currentUser.email !== invitation.email) {
        toast({
          title: "Error",
          description: "This invitation is for a different email address",
          variant: "destructive"
        });
        setAccepting(false);
        return;
      }

      // Use a transaction to ensure all operations succeed or fail together
      console.log('Starting transaction for invitation acceptance');
      
      // First, create user profile
      console.log('Creating user profile for account:', invitation.account_id);
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: currentUser.id,
          account_id: invitation.account_id,
          role: invitation.role,
          first_name: firstName.trim() || 'User',
          last_name: lastName.trim() || ''
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // If we created a new user but failed to create profile, we should clean up
        if (!user) {
          console.log('Cleaning up failed user account');
          await supabase.auth.signOut();
        }
        
        toast({
          title: "Error",
          description: `Failed to create profile: ${profileError.message}`,
          variant: "destructive"
        });
        setAccepting(false);
        return;
      }

      // Then, mark invitation as accepted
      console.log('Marking invitation as accepted');
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Failed to mark invitation as accepted:', updateError);
        
        // If we created the profile but failed to mark invitation as accepted,
        // we should clean up the profile
        console.log('Cleaning up profile due to invitation update failure');
        await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', currentUser.id);
          
        // If we created a new user, clean up the account too
        if (!user) {
          console.log('Cleaning up failed user account');
          await supabase.auth.signOut();
        }
        
        toast({
          title: "Error",
          description: `Failed to accept invitation: ${updateError.message}`,
          variant: "destructive"
        });
        setAccepting(false);
        return;
      }

      console.log('Invitation acceptance completed successfully');
      
      toast({
        title: "Success",
        description: "Invitation accepted successfully! Welcome to the team.",
      });

      navigate('/overview');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      
      // If we created a new user but something failed, clean up
      if (!user && currentUser) {
        console.log('Cleaning up failed user account due to unexpected error');
        await supabase.auth.signOut();
      }
      
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <DollarSign className="h-12 w-12 text-destructive" />
          </div>
          <div className="mt-8">
            <Alert variant="destructive">
              <AlertDescription className="text-center">
                <strong>Invalid invitation</strong><br />
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      case 'user': return 'User';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const isExistingUser = !!user;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <DollarSign className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Accept Invitation
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          You've been invited to join Dartnox Finance Logger
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-sm text-gray-900">{invitation.email}</div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1 text-sm text-gray-900">{getRoleDisplayName(invitation.role)}</div>
          </div>
          
          {invitation.message && (
            <div>
              <label className="text-sm font-medium text-gray-700">Message</label>
              <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {invitation.message}
              </div>
            </div>
          )}

          {/* Show form for new users to create account */}
          {!isExistingUser && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Create Your Account</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={accepting}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={accepting}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={accepting}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={accepting}
                  required
                />
              </div>
            </div>
          )}

          {/* Show email mismatch warning for existing users */}
          {isExistingUser && user.email !== invitation.email && (
            <Alert variant="destructive">
              <AlertDescription>
                This invitation is for {invitation.email}, but you're logged in as {user.email}. 
                Please log out and use the correct email address.
              </AlertDescription>
            </Alert>
          )}

          {/* Login prompt for existing users with wrong email */}
          {isExistingUser && user.email !== invitation.email && (
            <div className="text-center">
              <Button variant="outline" onClick={() => navigate('/login')}>
                Log in with correct email
              </Button>
            </div>
          )}

          {/* Accept button */}
          <Button 
            onClick={handleAcceptInvitation}
            className="w-full"
            disabled={
              accepting || 
              (isExistingUser && user.email !== invitation.email) ||
              (!isExistingUser && (!firstName.trim() || !lastName.trim() || !password || password !== confirmPassword))
            }
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isExistingUser ? 'Accepting...' : 'Creating Account...'}
              </>
            ) : (
              isExistingUser ? 'Accept Invitation' : 'Create Account & Accept'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
