
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, DollarSign } from 'lucide-react';

export function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold text-gray-900">Bluxo</span>
          </div>
          <div className="flex items-center space-x-4">
            {isSignedIn && (
              <>
                <span className="text-sm text-gray-700">{user?.primaryEmailAddress?.emailAddress}</span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
