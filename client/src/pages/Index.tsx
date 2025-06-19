
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while determining auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 shadow-lg animate-pulse">
              <span className="text-white font-bold text-2xl transform -rotate-3">F</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-xs">$</span>
            </div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading FIN...</p>
        </div>
      </div>
    );
  }

  return null; // This won't render since useEffect handles navigation
}
