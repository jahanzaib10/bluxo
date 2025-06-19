import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/signup", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      
      toast({
        title: "Success",
        description: "Account created successfully. Please sign in.",
      });
      
      // Redirect to login page
      window.location.href = "/auth/login";
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo and Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">$</span>
                </div>
              </div>
              <span className="text-2xl font-bold">FIN</span>
            </div>
            
            <div className="max-w-md">
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                Join the future of enterprise finance,
              </h1>
              <h2 className="text-3xl font-light mb-6 leading-tight opacity-90">
                where innovation meets financial excellence
              </h2>
            </div>
          </div>

          {/* 3D Illustration Area */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              {/* Stylized 3D elements representing finance/dashboard */}
              <div className="w-64 h-80 relative">
                {/* Main phone/dashboard mockup */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl backdrop-blur-sm border border-white/20 transform rotate-6 shadow-2xl">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-white/30 rounded-lg"></div>
                      <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="h-3 bg-white/40 rounded-full w-3/4"></div>
                      <div className="h-3 bg-white/30 rounded-full w-1/2"></div>
                      <div className="h-16 bg-white/20 rounded-xl mt-4"></div>
                      <div className="h-3 bg-white/30 rounded-full w-2/3"></div>
                    </div>
                  </div>
                </div>
                
                {/* Floating cards */}
                <div className="absolute -left-8 top-16 w-16 h-12 bg-gradient-to-r from-pink-400 to-red-400 rounded-xl transform -rotate-12 shadow-lg"></div>
                <div className="absolute -right-6 bottom-20 w-14 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg transform rotate-12 shadow-lg"></div>
                <div className="absolute left-4 -bottom-4 w-12 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg transform -rotate-6 shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Support info */}
          <div className="text-sm opacity-75">
            <p className="mb-1">experiencing issues?</p>
            <p>get assistance via support@fin.com</p>
          </div>
        </div>
        
        {/* Background patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 via-purple-600/50 to-blue-700/50"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">$</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">FIN</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">sign up</h1>
            <p className="text-gray-600">create your account to get started with FIN.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        className="mt-1 h-12 px-4 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john.doe@company.com" 
                        className="mt-1 h-12 px-4 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••••" 
                        className="mt-1 h-12 px-4 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••••" 
                        className="mt-1 h-12 px-4 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm" 
                disabled={isLoading}
              >
                {isLoading ? "creating account..." : "create account"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/auth/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}