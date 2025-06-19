import { Link } from "wouter";
import { LoginForm } from '@/components/auth/LoginForm';
import { DollarSign } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <DollarSign className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Finance Compass
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border">
          <LoginForm />
          
          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-primary hover:text-primary/80 underline"
                >
                  Sign up
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}