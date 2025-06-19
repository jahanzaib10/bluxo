import { Link } from "react-router-dom";
import { LoginForm } from '@/components/auth/LoginForm';

const FinLogo = () => (
  <div className="flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 shadow-lg">
        <span className="text-white font-bold text-2xl transform -rotate-3">F</span>
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-xs">$</span>
      </div>
    </div>
  </div>
);

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <FinLogo />
        <h2 className="mt-6 text-center text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          FIN
        </h2>
        <p className="mt-2 text-center text-lg text-muted-foreground">
          Enterprise Finance Management
        </p>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg py-10 px-6 shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50">
          <LoginForm />
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">New to FIN?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link 
                to="/auth/signup" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}