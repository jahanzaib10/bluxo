import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SignupForm } from '@/components/auth/SignupForm';
import { DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SignupPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <DollarSign className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Finance Compass</h1>
          </div>
          <h2 className="text-xl text-gray-600">Create your account</h2>
          <p className="text-sm text-gray-500 mt-2">
            Start managing your finances today
          </p>
        </div>
        
        <SignupForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/auth/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}