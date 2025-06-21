import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { CreditCard, Plus, Pencil, Trash2, Save } from 'lucide-react';

const paymentSourceSchema = z.object({
  name: z.string().min(1, 'Payment source name is required'),
  type: z.string().min(1, 'Payment source type is required'),
});

type PaymentSource = {
  id: string;
  name: string;
  type: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export default function PaymentSourcesSettings() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentSource, setEditingPaymentSource] = useState<PaymentSource | null>(null);

  const { data: paymentSources, isLoading } = useQuery<PaymentSource[]>({
    queryKey: ['/api/payment-sources'],
  });

  const form = useForm({
    resolver: zodResolver(paymentSourceSchema),
    defaultValues: {
      name: '',
      type: '',
    },
  });

  React.useEffect(() => {
    if (editingPaymentSource) {
      form.reset({
        name: editingPaymentSource.name,
        type: editingPaymentSource.type,
      });
    } else {
      form.reset({
        name: '',
        type: '',
      });
    }
  }, [editingPaymentSource, form]);

  const createPaymentSourceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSourceSchema>) => {
      return await apiRequest('/api/payment-sources', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment source created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-sources'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment source",
        variant: "destructive",
      });
    },
  });

  const updatePaymentSourceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSourceSchema>) => {
      return await apiRequest(`/api/payment-sources/${editingPaymentSource?.id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment source updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-sources'] });
      setIsDialogOpen(false);
      setEditingPaymentSource(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment source",
        variant: "destructive",
      });
    },
  });

  const deletePaymentSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/payment-sources/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment source deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-sources'] });
      queryClient.refetchQueries({ queryKey: ['/api/payment-sources'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment source",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof paymentSourceSchema>) => {
    if (editingPaymentSource) {
      updatePaymentSourceMutation.mutate(data);
    } else {
      createPaymentSourceMutation.mutate(data);
    }
  };

  const handleEdit = (paymentSource: PaymentSource) => {
    setEditingPaymentSource(paymentSource);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment source?')) {
      deletePaymentSourceMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingPaymentSource(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Payment Sources</h3>
          <p className="text-sm text-muted-foreground">
            Manage payment methods and financial accounts for your organization.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Payment Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {editingPaymentSource ? 'Edit Payment Source' : 'Add New Payment Source'}
              </DialogTitle>
              <DialogDescription>
                {editingPaymentSource 
                  ? 'Update the payment source details below.'
                  : 'Create a new payment source for tracking financial transactions.'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Source Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter payment source name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment source type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bank Account">Bank Account</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Debit Card">Debit Card</SelectItem>
                          <SelectItem value="Digital Wallet">Digital Wallet</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Check">Check</SelectItem>
                          <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPaymentSourceMutation.isPending || updatePaymentSourceMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingPaymentSource ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            All Payment Sources
          </CardTitle>
          <CardDescription>
            Manage your organization's payment methods and accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading payment sources...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentSources?.length ? (
                  paymentSources.map((paymentSource) => (
                    <TableRow key={paymentSource.id}>
                      <TableCell className="font-medium">{paymentSource.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {paymentSource.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(paymentSource.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(paymentSource)}
                            className="flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(paymentSource.id)}
                            className="flex items-center gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No payment sources found. Create your first payment source to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}