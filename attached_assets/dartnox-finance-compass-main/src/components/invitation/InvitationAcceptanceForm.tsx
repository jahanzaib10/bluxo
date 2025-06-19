
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types/userManagement';

interface InvitationDetails {
  email: string;
  role: UserRole;
  message?: string;
}

interface InvitationAcceptanceFormProps {
  invitation: InvitationDetails;
  isLoggedIn: boolean;
  onAccept: (data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    confirmPassword?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function InvitationAcceptanceForm({
  invitation,
  isLoggedIn,
  onAccept,
  isLoading
}: InvitationAcceptanceFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!isLoggedIn) {
      if (!firstName.trim()) errors.push('First name is required');
      if (!lastName.trim()) errors.push('Last name is required');
      if (!password) errors.push('Password is required');
      if (password !== confirmPassword) errors.push('Passwords do not match');
      if (password && password.length < 6) errors.push('Password must be at least 6 characters');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors([]);
    
    await onAccept({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      password: password || undefined,
      confirmPassword: confirmPassword || undefined
    });
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      case 'user': return 'User';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          You're invited to join as a <strong>{getRoleDisplayName(invitation.role)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={invitation.email} disabled />
          </div>
          
          {invitation.message && (
            <div>
              <Label>Message</Label>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {invitation.message}
              </p>
            </div>
          )}

          {!isLoggedIn && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Create Your Account</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {formErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
              <ul className="text-sm text-destructive space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <Button 
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
