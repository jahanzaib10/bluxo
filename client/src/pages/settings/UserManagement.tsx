import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  UserPlus, 
  MoreHorizontal, 
  Shield, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Trash2,
  Edit,
  UserCheck,
  UserX
} from "lucide-react";
import { insertUserInvitationSchema, updateUserRoleSchema, updateUserStatusSchema } from "@shared/schema";
import type { User, UserInvitation, InsertUserInvitation, UpdateUserRole, UpdateUserStatus } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

export default function UserManagement() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("users");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  // Current logged-in user ID and email from actual auth
  const CURRENT_USER_ID = currentUser?.id;
  const CURRENT_USER_EMAIL = currentUser?.email;

  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user-invitations"] });
  }, [queryClient]);

  // Fetch users with aggressive cache busting
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users", Date.now()], // Add timestamp to force fresh requests
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Add console logging to debug the data received
  useEffect(() => {
    console.log("[DEBUG] Users data received:", users);
    console.log("[DEBUG] Users count:", users.length);
    console.log("[DEBUG] Current user:", currentUser);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`[DEBUG] User ${index}:`, { id: user.id, email: user.email, name: user.name });
      });
    }
  }, [users, currentUser]);

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<UserInvitation[]>({
    queryKey: ["/api/user-invitations"],
    staleTime: 0, // Always refetch fresh data
    refetchOnMount: true,
  });

  // Invite user form
  const inviteForm = useForm<InsertUserInvitation>({
    resolver: zodResolver(insertUserInvitationSchema),
    defaultValues: {
      email: "",
      role: "viewer",
      type: "internal",
    },
  });

  // Mutations
  const inviteUserMutation = useMutation({
    mutationFn: async (data: InsertUserInvitation) => {
      return await apiRequest("/api/users/invite", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "User invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-invitations"] });
      setInviteDialogOpen(false);
      inviteForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return await apiRequest(`/api/users/${id}/role`, "PUT", { role });
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest(`/api/users/${id}/status`, "PUT", { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "User status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/users/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "User removed",
        description: "User has been removed from the organization.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user",
        variant: "destructive",
      });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/user-invitations/${id}/resend`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Invitation resent",
        description: "Invitation has been resent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/user-invitations/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "Invitation has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      });
    },
  });

  const handleInviteUser = (data: InsertUserInvitation) => {
    inviteUserMutation.mutate(data);
  };

  const handleUpdateUserRole = (id: string, role: string) => {
    updateUserRoleMutation.mutate({ id, role });
  };

  const handleUpdateUserStatus = (id: string, status: string) => {
    updateUserStatusMutation.mutate({ id, status });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to remove this user from the organization?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleResendInvitation = (id: string) => {
    resendInvitationMutation.mutate(id);
  };

  const handleCancelInvitation = (id: string) => {
    if (confirm("Are you sure you want to cancel this invitation?")) {
      cancelInvitationMutation.mutate(id);
    }
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "suspended": return "destructive";
      default: return "outline";
    }
  };

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expired": return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Use only actual users from API, no hardcoded data
  const allUsers = users.filter(user => user.role !== "client");

  // Stats calculations (include owner in totals)
  const activeUsers = allUsers.filter(user => user.status === "active").length;
  const pendingInvitations = invitations.filter(inv => inv.status === "pending").length;
  const totalUsers = allUsers.length;
  const adminUsers = allUsers.filter(user => user.role === "admin" || user.role === "super_admin").length;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and permissions
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new team member to your organization.
              </DialogDescription>
            </DialogHeader>
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(handleInviteUser)} className="space-y-4">
                <FormField
                  control={inviteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="user@example.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal">Internal Team Member</SelectItem>
                          <SelectItem value="client">Client User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={inviteUserMutation.isPending}
                  >
                    {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvitations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Team Members</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your organization's team members and their permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading users...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start building your team by inviting new members.
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite First User
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {user.name || user.email}
                                {user.id === CURRENT_USER_ID && (
                                  <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role || "viewer")}>
                            {user.role || "viewer"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.department || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status || "active")}>
                            {user.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.lastLoginAt 
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : "Never"
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.id === CURRENT_USER_ID ? (
                            <div className="text-sm text-muted-foreground px-3 py-2">
                              Owner (Cannot edit self)
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleUpdateUserRole(user.id, user.role === "admin" ? "viewer" : "admin")}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateUserStatus(user.id, user.status === "active" ? "inactive" : "active")}
                                >
                                  {user.status === "active" ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage invitations sent to potential team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading invitations...</div>
                </div>
              ) : invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending invitations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    All invitations have been processed or none have been sent yet.
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invitation
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div className="text-sm font-medium">{invitation.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(invitation.role)}>
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{invitation.type.replace("_", " ")}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getInvitationStatusIcon(invitation.status)}
                            <span className="text-sm capitalize">{invitation.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(invitation.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {invitation.expiresAt 
                              ? new Date(invitation.expiresAt).toLocaleDateString()
                              : "—"
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {invitation.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => handleResendInvitation(invitation.id)}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Resend Invitation
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}