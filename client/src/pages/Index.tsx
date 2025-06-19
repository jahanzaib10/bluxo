import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { DollarSign, TrendingUp, Users, Calculator, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">Finance Compass</span>
            </div>
            <div className="space-x-4">
              <Link 
                to="/auth/login" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/auth/signup" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Manage Your Business Finances with Confidence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Take control of your business finances with our comprehensive finance management platform. 
            Track income, expenses, manage clients, and get insights to grow your business.
          </p>
          <div className="space-x-4">
            <Link 
              to="/auth/signup" 
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors inline-block"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/auth/login" 
              className="text-indigo-600 border border-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition-colors inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <TrendingUp className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Income & Expenses</h3>
            <p className="text-gray-600">Monitor your cash flow with detailed income and expense tracking</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Management</h3>
            <p className="text-gray-600">Keep track of your clients and their projects in one place</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Calculator className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Reports</h3>
            <p className="text-gray-600">Generate comprehensive financial reports and insights</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <BarChart3 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Visualize your financial data with powerful analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
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
    return null; // Will redirect to dashboard
  }

  return <LandingPage />;
}