
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/overview');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <AuthScreen />;
}

function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <DollarSign className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Dartnox Finance Logger
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Track your business income and expenses with ease
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border">
          {isSignUp ? (
            <SignUpForm onToggleMode={() => setIsSignUp(false)} />
          ) : (
            <LoginForm onToggleMode={() => setIsSignUp(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  return <AuthenticatedApp />;
};

export default Index;
