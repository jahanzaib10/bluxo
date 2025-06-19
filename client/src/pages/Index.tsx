

import { LoginForm } from '@/components/auth/LoginForm';
import { DollarSign } from 'lucide-react';

export default function Index() {
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
          Enterprise finance management platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
