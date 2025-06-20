import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema for accepting invitation
const acceptInvitationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInvitationForm = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify invitation token
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["/api/invitations/verify", token],
    queryFn: () => apiRequest(`/api/invitations/verify/${token}`, "GET"),
    retry: false,
  });

  const invitation = response?.invitation;

  const form = useForm<AcceptInvitationForm>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: async (data: AcceptInvitationForm) => {
      return await apiRequest(`/api/invitations/accept/${token}`, "POST", {
        name: data.name,
        password: data.password,
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome to DartNox!",
        description: "Your account has been created successfully. You can now log in.",
      });
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    },
  });

  const handleAcceptInvitation = (data: AcceptInvitationForm) => {
    setIsSubmitting(true);
    acceptInvitationMutation.mutate(data);
    setIsSubmitting(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin": return "default";
      case "admin": return "destructive";
      case "manager": return "default";
      case "editor": return "secondary";
      case "viewer": return "outline";
      case "client": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-600";
    switch (status) {
      case "pending": return "text-yellow-600";
      case "expired": return "text-red-600";
      case "accepted": return "text-green-600";
      case "cancelled": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-5 w-5 text-yellow-500" />;
      case "expired": return <XCircle className="h-5 w-5 text-red-500" />;
      case "accepted": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled": return <XCircle className="h-5 w-5 text-gray-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-lg">Verifying invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invalid Invitation</CardTitle>
            <CardDescription className="text-red-700">
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
              variant="outline"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation && invitation.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              {getStatusIcon(invitation?.status || 'pending')}
            </div>
            <CardTitle className={getStatusColor(invitation?.status)}>
              Invitation {invitation?.status ? invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1) : 'Loading...'}
            </CardTitle>
            <CardDescription>
              This invitation is no longer available for acceptance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
              variant="outline"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <UserPlus className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Join DartNox
          </CardTitle>
          <CardDescription>
            You've been invited to join our team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Email:</span>
              <span className="text-sm text-gray-900">{invitation.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <Badge variant={getRoleBadgeVariant(invitation.role)}>
                {invitation.role.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <span className="text-sm text-gray-900 capitalize">{invitation.type}</span>
            </div>
          </div>

          {/* Accept Invitation Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAcceptInvitation)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Create a password" 
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Confirm your password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || acceptInvitationMutation.isPending}
              >
                {isSubmitting || acceptInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Accept Invitation & Create Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-gray-500">
            By accepting this invitation, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}