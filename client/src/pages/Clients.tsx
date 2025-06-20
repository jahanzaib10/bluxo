import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Mail, Phone, Globe, Building, User, Settings, Eye, Calendar, DollarSign, Trash2, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [authToken, setAuthToken] = useState<string>("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const importMutation = useMutation({
    mutationFn: async (clientData: any[]) => {
      return await apiRequest("/api/clients/import", "POST", { clients: clientData });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: `Successfully imported ${variables.length} clients` });
      setIsImportOpen(false);
      setCsvData([]);
      setCsvPreview([]);
      setShowPreview(false);
    },
    onError: () => {
      toast({ title: "Failed to import clients", variant: "destructive" });
    },
  });

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };
    
    const headers = parseCSVLine(lines[0]);
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '');
        let fieldName = '';
        
        // Map CSV headers to expected field names
        switch (normalizedHeader) {
          case 'name':
            fieldName = 'name';
            break;
          case 'email':
            fieldName = 'email';
            break;
          case 'phone':
            fieldName = 'phone';
            break;
          case 'website':
            fieldName = 'website';
            break;
          case 'address':
            fieldName = 'address';
            break;
          case 'industry':
            fieldName = 'industry';
            break;
          case 'contactname':
            fieldName = 'contactName';
            break;
          case 'contactemail':
            fieldName = 'contactEmail';
            break;
          default:
            fieldName = header;
        }
        
        row[fieldName] = values[index] || '';
      });
      
      // Only add rows with required name field
      if (row.name && row.name.trim()) {
        data.push(row);
      }
    }
    
    return { headers, data };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const { headers, data } = parseCSV(csvText);
      
      setCsvData(data);
      setCsvPreview(data.slice(0, 10)); // Show first 10 rows for preview
      setCsvHeaders(headers);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = "name,email,phone,website,address,industry,contact_name,contact_email\nTechCorp Solutions,admin@techcorp.com,+1-555-0123,https://techcorp.com,123 Tech Street,Technology,John Smith,john@techcorp.com\nDigital Marketing Pro,info@digitalmarketing.com,+1-555-0456,https://digitalmarketing.com,456 Marketing Ave,Marketing,Jane Doe,jane@digitalmarketing.com\nGreen Energy Co,contact@greenenergy.com,+1-555-0789,https://greenenergy.com,789 Energy Blvd,Energy,Bob Johnson,bob@greenenergy.com";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    importMutation.mutate(csvData);
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
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="csv-import-description">
              <DialogHeader>
                <DialogTitle>Import Clients from CSV</DialogTitle>
                <div id="csv-import-description" className="text-sm text-gray-600">
                  Upload a CSV file to import client data. Preview and verify the data before importing.
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose CSV File
                  </Button>
                </div>
                
                {showPreview && csvPreview.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Preview ({csvData.length} total records)</h3>
                    <div className="text-xs text-gray-600 mb-2">
                      CSV Headers: {csvHeaders.join(", ")}
                    </div>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table className="min-w-max">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Contact Name</TableHead>
                            <TableHead>Contact Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell className="whitespace-nowrap">{row.name || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{row.email || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{row.phone || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{row.website || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{row.address || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{row.industry || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{row.contactName || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">{row.contactEmail || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => {setCsvData([]); setCsvPreview([]); setShowPreview(false);}}>
                        Cancel
                      </Button>
                      <Button onClick={handleImport} disabled={importMutation.isPending}>
                        {importMutation.isPending ? "Importing..." : `Import ${csvData.length} Clients`}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(client)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800">You are about to delete:</h3>
                <p className="text-red-700 mt-1">
                  <strong>{selectedClient.name}</strong>
                  {selectedClient.email && ` (${selectedClient.email})`}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>This will also remove:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>All client permissions and access tokens</li>
                  <li>All income records linked to this client</li>
                  <li>All financial data associated with this client</li>
                </ul>
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
    </div>
  );
}