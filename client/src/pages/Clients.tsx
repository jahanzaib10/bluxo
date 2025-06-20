import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Mail, Phone, Globe, Building, User, Settings, Eye, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertClientSchema, insertClientPermissionsSchema, type Client, type ClientPermissions } from "@shared/schema";
import { z } from "zod";

const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

const permissionsFormSchema = insertClientPermissionsSchema.omit({
  id: true,
  clientId: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
});

type ClientFormData = z.infer<typeof clientFormSchema>;
type PermissionsFormData = z.infer<typeof permissionsFormSchema>;

export default function Clients() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [authToken, setAuthToken] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: clientPermissions } = useQuery<ClientPermissions>({
    queryKey: ["/api/client-permissions", selectedClient?.id],
    enabled: !!selectedClient?.id,
  });

  const addClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => apiRequest("/api/clients", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: PermissionsFormData) => 
      apiRequest(`/api/client-permissions/${selectedClient?.id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-permissions", selectedClient?.id] });
      setIsPermissionsModalOpen(false);
      toast({
        title: "Success",
        description: "Client permissions updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateAuthTokenMutation = useMutation({
    mutationFn: (email: string) => apiRequest("/api/client-auth/request", "POST", { email }),
    onSuccess: (data) => {
      setAuthToken(data.token);
      toast({
        title: "Success",
        description: "Authentication token generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => apiRequest(`/api/clients/${clientId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      industry: "",
      contactName: "",
      contactEmail: "",
    },
  });

  const permissionsForm = useForm<PermissionsFormData>({
    resolver: zodResolver(permissionsFormSchema),
    defaultValues: {
      showIncomeGraph: true,
      showCategoryBreakdown: true,
      showPaymentHistory: true,
      showInvoices: false,
    },
  });

  const handleAddClient = (data: ClientFormData) => {
    addClientMutation.mutate(data);
  };

  const handleUpdatePermissions = (data: PermissionsFormData) => {
    updatePermissionsMutation.mutate(data);
  };

  const handleGenerateAuthToken = (client: Client) => {
    generateAuthTokenMutation.mutate(client.email);
  };

  const openPermissionsModal = (client: Client) => {
    setSelectedClient(client);
    setIsPermissionsModalOpen(true);
    // Reset form with current permissions
    if (clientPermissions) {
      permissionsForm.reset({
        showIncomeGraph: clientPermissions.showIncomeGraph,
        showCategoryBreakdown: clientPermissions.showCategoryBreakdown,
        showPaymentHistory: clientPermissions.showPaymentHistory,
        showInvoices: clientPermissions.showInvoices,
      });
    }
  };

  const openProfileModal = (client: Client) => {
    setSelectedClient(client);
    setIsProfileModalOpen(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteClient = () => {
    if (selectedClient) {
      deleteClientMutation.mutate(selectedClient.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your clients and their dashboard access</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <Form {...clientForm}>
              <form onSubmit={clientForm.handleSubmit(handleAddClient)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={clientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={clientForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter website URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={clientForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={clientForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter industry" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={clientForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter contact email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addClientMutation.isPending}>
                    {addClientMutation.isPending ? "Adding..." : "Add Client"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openProfileModal(client)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {client.name}
                  </CardTitle>
                  <CardDescription>{client.industry}</CardDescription>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPermissionsModal(client)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Permissions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAuthToken(client)}
                    disabled={generateAuthTokenMutation.isPending}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {generateAuthTokenMutation.isPending ? "Generating..." : "Generate Access"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.website}</span>
                  </div>
                )}
                {client.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.contactName}</span>
                  </div>
                )}
              </div>
              {client.address && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">{client.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Modal */}
      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Dashboard Permissions</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Configure what {selectedClient?.name} can see in their dashboard
            </p>
          </DialogHeader>
          <Form {...permissionsForm}>
            <form onSubmit={permissionsForm.handleSubmit(handleUpdatePermissions)} className="space-y-4">
              <FormField
                control={permissionsForm.control}
                name="showIncomeGraph"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Income Graph</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Show revenue trends and income analytics
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={permissionsForm.control}
                name="showCategoryBreakdown"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Category Breakdown</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Show spending by category analysis
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={permissionsForm.control}
                name="showPaymentHistory"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Payment History</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Show transaction history and payment records
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={permissionsForm.control}
                name="showInvoices"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Invoices</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Show invoice management and billing details
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsPermissionsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePermissionsMutation.isPending}>
                  {updatePermissionsMutation.isPending ? "Updating..." : "Update Permissions"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Auth Token Display */}
      {authToken && (
        <Dialog open={!!authToken} onOpenChange={() => setAuthToken("")}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Client Access Token</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Share this token with your client to access their dashboard
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono break-all">{authToken}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Expires in 10 minutes</Badge>
                <span>•</span>
                <span>Single use only</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(authToken);
                    toast({
                      title: "Copied",
                      description: "Token copied to clipboard",
                    });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Copy Token
                </Button>
                <Button
                  onClick={() => {
                    const clientPortalUrl = `/client-portal?token=${authToken}`;
                    window.open(clientPortalUrl, '_blank');
                  }}
                  className="flex-1"
                >
                  Open Dashboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Client Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedClient?.name} - Client Profile
            </DialogTitle>
            <DialogDescription>
              Detailed insights and financial data for this client
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Industry:</span>
                      <span>{selectedClient.industry || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Website:</span>
                        <span>{selectedClient.website}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="pt-2 border-t">
                        <span className="font-medium">Address:</span>
                        <p className="text-sm text-muted-foreground mt-1">{selectedClient.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedClient.contactName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Contact Person:</span>
                        <span>{selectedClient.contactName}</span>
                      </div>
                    )}
                    {selectedClient.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Contact Email:</span>
                        <span>{selectedClient.contactEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Client Since:</span>
                      <span>{new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">$0</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">$0</div>
                      <div className="text-sm text-muted-foreground">Average Transaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Client Dashboard Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleGenerateAuthToken(selectedClient)}
                      disabled={generateAuthTokenMutation.isPending}
                      className="flex-1"
                    >
                      {generateAuthTokenMutation.isPending ? "Generating..." : "Generate Access Token"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openPermissionsModal(selectedClient)}
                      className="flex-1"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Permissions
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generate a secure token to give this client access to their personalized dashboard
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}