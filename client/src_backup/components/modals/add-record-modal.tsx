import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const recordTypeSchema = z.object({
  type: z.enum(["account", "category", "client", "developer", "employee"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  currency: z.string().optional(),
  hourlyRate: z.string().optional(),
  clientId: z.string().optional(),
});

type RecordType = z.infer<typeof recordTypeSchema>;

interface AddRecordModalProps {
  children?: React.ReactNode;
}

export default function AddRecordModal({ children }: AddRecordModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RecordType>({
    resolver: zodResolver(recordTypeSchema),
    defaultValues: {
      type: "account",
      name: "",
      email: "",
      currency: "USD",
      hourlyRate: "",
      clientId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RecordType) => {
      const { type, name, email, currency, hourlyRate, clientId } = data;
      
      let payload: any = {
        name,
        created_by: "00000000-0000-0000-0000-000000000000", // Default user ID
      };

      switch (type) {
        case "account":
          payload = {
            company_name: name,
            currency: currency || "USD",
            created_by: "00000000-0000-0000-0000-000000000000",
          };
          break;
        case "category":
          payload = {
            name,
            type: "expense",
            created_by: "00000000-0000-0000-0000-000000000000",
          };
          break;
        case "client":
          payload = {
            name,
            email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            created_by: "00000000-0000-0000-0000-000000000000",
          };
          break;
        case "developer":
          payload = {
            name,
            hourly_rate: hourlyRate || "50.00",
            client_id: clientId || "00000000-0000-0000-0000-000000000000",
            created_by: "00000000-0000-0000-0000-000000000000",
          };
          break;
        case "employee":
          payload = {
            name,
            created_by: "00000000-0000-0000-0000-000000000000",
          };
          break;
      }

      return apiRequest("POST", `/api/${type}s`, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.type}s`] });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: `${variables.type} created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RecordType) => {
    createMutation.mutate(data);
  };

  const recordType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary-dark">
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Record</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Record Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {recordType === "client" && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {recordType === "account" && (
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {recordType === "developer" && (
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary-dark">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
