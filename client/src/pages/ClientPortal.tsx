import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Mail, CheckCircle, AlertCircle, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ClientPortal() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [hasTokenInUrl, setHasTokenInUrl] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { toast } = useToast();

  // Check for token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setHasTokenInUrl(true);
    }
  }, []);

  const requestTokenMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("/api/client-auth/request-by-email", "POST", { email });
    },
    onSuccess: () => {
      setRequestSent(true);
      toast({
        title: "Request Sent",
        description: "Check your email for the access token. It will expire in 24 hours.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Please check your email address or contact support.",
        variant: "destructive",
      });
    },
  });

  const accessDashboardMutation = useMutation({
    mutationFn: async (token: string) => {
      return await apiRequest("/api/client-auth/verify", "POST", { token });
    },
    onSuccess: (data) => {
      // Redirect to client dashboard with the validated data
      window.location.href = `/client-dashboard?token=${token}`;
    },
    onError: (error: any) => {
      toast({
        title: "Access Failed",
        description: error.message || "Invalid or expired token. Please request a new one.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasTokenInUrl) {
      // Handle token access
      if (!token) {
        toast({
          title: "Token Required",
          description: "Please enter your access token.",
          variant: "destructive",
        });
        return;
      }
      accessDashboardMutation.mutate(token);
    } else {
      // Handle email request
      if (!email) {
        toast({
          title: "Email Required",
          description: "Please enter your email address.",
          variant: "destructive",
        });
        return;
      }
      requestTokenMutation.mutate(email);
    }
  };

  if (requestSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-600">Request Sent!</CardTitle>
            <CardDescription>
              We've sent an access token to your email address. Check your inbox and use the token to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong><br/>
                1. Check your email for the access token<br/>
                2. Copy the token<br/>
                3. Use it on the client dashboard page<br/>
                4. Token expires in 24 hours
              </p>
            </div>
            <Button 
              onClick={() => {
                setRequestSent(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Request Another Token
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <CardDescription>
            {hasTokenInUrl 
              ? "Your access token has been detected. Click below to access your dashboard."
              : "Enter your email address to request access to your financial dashboard"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {hasTokenInUrl ? (
              <div className="space-y-2">
                <Label htmlFor="token">Access Token</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="token"
                    type="text"
                    placeholder="Your access token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={requestTokenMutation.isPending || accessDashboardMutation.isPending}
            >
              {hasTokenInUrl 
                ? (accessDashboardMutation.isPending ? "Accessing Dashboard..." : "Access Dashboard")
                : (requestTokenMutation.isPending ? "Sending Request..." : "Request Access Token")
              }
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <p>Only registered clients can request access tokens. If you don't receive an email within 5 minutes, please contact your account manager.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}