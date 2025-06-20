import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Eye, Settings, Mail, Phone, Globe, MapPin, Building, User, Calendar, DollarSign, Key, Upload, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client, InsertClient, ClientPermissions, InsertClientPermissions } from "@shared/schema";

const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

const permissionsFormSchema = z.object({
  showIncomeGraph: z.boolean().default(true),
  showCategoryBreakdown: z.boolean().default(true),
  showPaymentHistory: z.boolean().default(true),
  showInvoices: z.boolean().default(false),
});

type ClientFormData = z.infer<typeof clientFormSchema>;
type PermissionsFormData = z.infer<typeof permissionsFormSchema>;

export default function Clients() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<ClientFormData>({
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

  const addClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => apiRequest("/api/clients", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsAddModalOpen(false);
      form.reset();
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

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientFormData> }) =>
      apiRequest(`/api/clients/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsEditModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Client updated successfully",
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
    mutationFn: (id: string) => apiRequest(`/api/clients/${id}`, "DELETE"),
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

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: PermissionsFormData) => 
      apiRequest(`/api/clients/${selectedClient?.id}/permissions`, "PUT", data),
    onSuccess: () => {
      setIsPermissionsModalOpen(false);
      toast({
        title: "Success",
        description: "Permissions updated successfully",
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
    mutationFn: (clientId: string) => apiRequest(`/api/clients/${clientId}/auth-token`, "POST"),
    onSuccess: (response: any) => {
      setAuthToken(response.token);
      toast({
        title: "Success",
        description: "Access token generated successfully",
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

  const importClientsMutation = useMutation({
    mutationFn: (data: { clients: any[] }) => apiRequest("/api/clients/import", "POST", data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsImportOpen(false);
      setCsvFile(null);
      setCsvData([]);
      setImportErrors([]);
      toast({
        title: "Success",
        description: response.message,
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

  const handleAddClient = (data: ClientFormData) => {
    addClientMutation.mutate(data);
  };

  const handleEditClient = (data: ClientFormData) => {
    if (selectedClient) {
      updateClientMutation.mutate({ id: selectedClient.id, data });
    }
  };

  const handleDeleteClient = () => {
    if (selectedClient) {
      deleteClientMutation.mutate(selectedClient.id);
    }
  };

  const handleUpdatePermissions = (data: PermissionsFormData) => {
    updatePermissionsMutation.mutate(data);
  };

  const handleGenerateAuthToken = (client: Client) => {
    generateAuthTokenMutation.mutate(client.id);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    form.reset({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      website: client.website || "",
      address: client.address || "",
      industry: client.industry || "",
      contactName: client.contactName || "",
      contactEmail: client.contactEmail || "",
    });
    setIsEditModalOpen(true);
  };

  const openPermissionsModal = (client: Client) => {
    setSelectedClient(client);
    setIsPermissionsModalOpen(true);
  };

  const openProfileModal = (client: Client) => {
    setSelectedClient(client);
    setIsProfileModalOpen(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const downloadTemplate = () => {
    const headers = ["name", "email", "phone", "website", "address", "industry", "contact_name", "contact_email"];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Error",
          description: "CSV file must contain at least a header row and one data row",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
        const row: any = {};
        headers.forEach((header, index) => {
          const normalizedHeader = header.toLowerCase().replace(/\s+/g, "");
          let fieldName = normalizedHeader;
          
          // Map CSV headers to expected field names
          if (normalizedHeader === "contactname" || normalizedHeader === "contact_name") fieldName = "contactName";
          if (normalizedHeader === "contactemail" || normalizedHeader === "contact_email") fieldName = "contactEmail";
          
          row[fieldName] = values[index] || "";
        });
        return row;
      });

      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvData.length === 0) {
      toast({
        title: "Error",
        description: "No data to import",
        variant: "destructive",
      });
      return;
    }

    importClientsMutation.mutate({ clients: csvData });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
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
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Clients from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to import client data. Preview and verify the data before importing.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Preview ({csvData.length} records)</h3>
                      <Button onClick={handleImport} disabled={importClientsMutation.isPending}>
                        {importClientsMutation.isPending ? "Importing..." : "Import Clients"}
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Phone</th>
                            <th className="p-2 text-left">Website</th>
                            <th className="p-2 text-left">Industry</th>
                            <th className="p-2 text-left">Contact Name</th>
                            <th className="p-2 text-left">Contact Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 10).map((row, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{row.name || "-"}</td>
                              <td className="p-2">{row.email || "-"}</td>
                              <td className="p-2">{row.phone || "-"}</td>
                              <td className="p-2">{row.website || "-"}</td>
                              <td className="p-2">{row.industry || "-"}</td>
                              <td className="p-2">{row.contactName || "-"}</td>
                              <td className="p-2">{row.contactEmail || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvData.length > 10 && (
                        <div className="p-2 text-center text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800">
                          ... and {csvData.length - 10} more records
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Create a new client record and set up their dashboard access.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddClient)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openProfileModal(client)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteModal(client)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.industry && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span>{client.industry}</span>
                </div>
              )}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateAuthToken(client)}
                  disabled={generateAuthTokenMutation.isPending}
                  className="w-full"
                >
                  <Key className="h-3 w-3 mr-2" />
                  Generate Access Token
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Client Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditClient)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateClientMutation.isPending}>
                  {updateClientMutation.isPending ? "Updating..." : "Update Client"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Client Permissions</DialogTitle>
            <DialogDescription>
              Set what information this client can view in their dashboard.
            </DialogDescription>
          </DialogHeader>
          <Form {...permissionsForm}>
            <form onSubmit={permissionsForm.handleSubmit(handleUpdatePermissions)} className="space-y-6">
              <FormField
                control={permissionsForm.control}
                name="showIncomeGraph"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Income Overview</FormLabel>
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
                        Show spending breakdown by categories
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
              <DialogDescription>
                Share this secure token with your client to access their dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-mono break-all">{authToken}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(authToken);
                    toast({
                      title: "Success",
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedClient?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed client information and dashboard access controls.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Name:</span>
                      <span>{selectedClient.name}</span>
                    </div>
                    {selectedClient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{selectedClient.email}</span>
                      </div>
                    )}
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
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Address:</span>
                        <span>{selectedClient.address}</span>
                      </div>
                    )}
                    {selectedClient.industry && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Industry:</span>
                        <span>{selectedClient.industry}</span>
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

      {/* Client Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Client
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the client and all related data.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm">
                  <strong>Client:</strong> {selectedClient.name}
                </p>
                {selectedClient.email && (
                  <p className="text-sm">
                    <strong>Email:</strong> {selectedClient.email}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDeleteClient}
                  disabled={deleteClientMutation.isPending}
                >
                  {deleteClientMutation.isPending ? "Deleting..." : "Delete Client"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}