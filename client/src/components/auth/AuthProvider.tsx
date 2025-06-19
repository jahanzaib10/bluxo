import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, LoginInput, SignupInput } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Token exists, the query will validate it
      setIsInitialized(true);
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Query to get current user and validate session
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    enabled: isInitialized,
  });

  // Handle authentication errors (expired/invalid tokens)
  useEffect(() => {
    if (error && !isLoading) {
      const errorMessage = error.message;
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Access token required')) {
        // Clear invalid token
        localStorage.removeItem('auth_token');
        setUser(null);
        
        // Only show toast if user was previously authenticated or tried to access a protected resource
        const currentPath = window.location.pathname;
        if (currentPath !== '/auth/login' && currentPath !== '/auth/signup' && currentPath !== '/') {
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 500);
        }
      }
    }
  }, [error, isLoading, toast]);

  useEffect(() => {
    if (userData) {
      setUser(userData as User);
    } else if (!isLoading && isInitialized) {
      setUser(null);
    }
  }, [userData, isLoading, isInitialized]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Redirect to dashboard after successful login
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupInput) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Redirect to dashboard after successful signup
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      setUser(null);
      queryClient.clear();
      window.location.href = "/auth/login";
    },
    onError: () => {
      // Even if logout fails, clear local state
      localStorage.removeItem('auth_token');
      setUser(null);
      queryClient.clear();
      window.location.href = "/auth/login";
    },
  });

  const login = async (data: LoginInput) => {
    await loginMutation.mutateAsync(data);
  };

  const signup = async (data: SignupInput) => {
    await signupMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}