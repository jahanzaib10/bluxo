import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, CalendarDays, DollarSign, Repeat, Building2, User, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertSubscriptionSchema, type Subscription, type InsertSubscription } from "@shared/schema";

export default function Subscriptions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["/api/subscriptions"],
  });

  // Fetch related data for form dropdowns
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: paymentSources = [] } = useQuery({
    queryKey: ["/api/payment-sources"],
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertSubscription) => apiRequest("/api/subscriptions", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Subscription created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create subscription: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertSubscription> }) =>
      apiRequest(`/api/subscriptions/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      setEditingSubscription(null);
      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update subscription: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete subscription mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/subscriptions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete subscription: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertSubscription>({
    resolver: zodResolver(insertSubscriptionSchema),
    defaultValues: {
      name: "",
      amount: "",
      billingCycle: "monthly",
      subscriptionType: "self",
      reconciled: false,
    },
  });

  const onSubmit = (data: InsertSubscription) => {
    if (editingSubscription) {
      updateMutation.mutate({ id: editingSubscription.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    form.reset({
      name: subscription.name,
      amount: subscription.amount,
      billingCycle: subscription.billingCycle as "monthly" | "yearly" | "quarterly" | "bi-annual",
      nextDueDate: subscription.nextDueDate || undefined,
      description: subscription.description || undefined,
      reconciled: subscription.reconciled,
      subscriptionType: subscription.subscriptionType as "self" | "client",
      clientId: subscription.clientId || undefined,
      employeeId: subscription.employeeId || undefined,
      categoryId: subscription.categoryId || undefined,
      paymentSourceId: subscription.paymentSourceId || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this subscription?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : `$${num.toLocaleString()}`;
  };

  const getBillingCycleBadge = (cycle: string) => {
    const colors = {
      monthly: "bg-blue-100 text-blue-800",
      quarterly: "bg-green-100 text-green-800",
      "bi-annual": "bg-yellow-100 text-yellow-800",
      yearly: "bg-purple-100 text-purple-800",
    };
    return colors[cycle as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    return type === "client" 
      ? "bg-indigo-100 text-indigo-800" 
      : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-gray-600">Manage internal and client-billed recurring expenses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Subscription</DialogTitle>
            </DialogHeader>
            <SubscriptionForm 
              form={form} 
              onSubmit={onSubmit} 
              clients={clients}
              employees={employees}
              categories={categories}
              paymentSources={paymentSources}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${subscriptions
                .filter(s => s.billingCycle === 'monthly' && s.subscriptionType === 'client')
                .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Subscriptions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.subscriptionType === 'client').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internal Subscriptions</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.subscriptionType === 'self').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription: any) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(subscription.subscriptionType)}>
                        {subscription.subscriptionType === 'client' ? 'Client' : 'Internal'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatAmount(subscription.amount)}</TableCell>
                    <TableCell>
                      <Badge className={getBillingCycleBadge(subscription.billingCycle)}>
                        {subscription.billingCycle}
                      </Badge>
                    </TableCell>
                    <TableCell>{subscription.clientName || '-'}</TableCell>
                    <TableCell>{subscription.categoryName || '-'}</TableCell>
                    <TableCell>{subscription.nextDueDate || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={subscription.reconciled ? "default" : "secondary"}>
                        {subscription.reconciled ? "Reconciled" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(subscription)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subscription.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSubscription && (
        <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
            </DialogHeader>
            <SubscriptionForm 
              form={form} 
              onSubmit={onSubmit} 
              clients={clients}
              employees={employees}
              categories={categories}
              paymentSources={paymentSources}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SubscriptionForm({ 
  form, 
  onSubmit, 
  clients, 
  employees, 
  categories, 
  paymentSources, 
  isLoading 
}: {
  form: any;
  onSubmit: (data: InsertSubscription) => void;
  clients: any[];
  employees: any[];
  categories: any[];
  paymentSources: any[];
  isLoading: boolean;
}) {
  const subscriptionType = form.watch("subscriptionType");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Adobe Creative Suite" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="subscriptionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="self">Internal</SelectItem>
                    <SelectItem value="client">Client-Billed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billingCycle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Cycle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="bi-annual">Bi-Annual</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nextDueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Due Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {subscriptionType === "client" && (
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Employee</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paymentSourceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Source</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentSources.map((source: any) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reconciled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Reconciled</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Mark as reconciled when payment is confirmed
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Subscription"}
          </Button>
        </div>
      </form>
    </Form>
  );
}