import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Percent } from 'lucide-react';

type TaxRule = {
  id: string;
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  country: string;
  description: string | null;
  isDefault: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

type CreateTaxRulePayload = {
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  country: string;
  description: string;
  isDefault: boolean;
};

const EMPTY_FORM: CreateTaxRulePayload = {
  name: '',
  rate: 0,
  type: 'exclusive',
  country: '',
  description: '',
  isDefault: false,
};

export default function TaxRulesSettings() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateTaxRulePayload>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateTaxRulePayload, string>>>({});

  const { data: taxRules, isLoading } = useQuery<TaxRule[]>({
    queryKey: ['/api/tax-rules'],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaxRulePayload) => apiRequest('/api/tax-rules', 'POST', data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Tax rule created successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tax-rules'] });
      setIsDialogOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tax rule.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tax-rules/${id}`, 'DELETE'),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Tax rule deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tax-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tax rule.',
        variant: 'destructive',
      });
    },
  });

  const validate = (): boolean => {
    const errors: Partial<Record<keyof CreateTaxRulePayload, string>> = {};

    if (!form.name.trim()) {
      errors.name = 'Name is required.';
    }
    if (form.rate < 0 || form.rate > 100) {
      errors.rate = 'Rate must be between 0 and 100.';
    }
    if (!form.country.trim()) {
      errors.country = 'Country code is required.';
    } else if (form.country.trim().length > 3) {
      errors.country = 'Country code must be 2–3 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate({
      ...form,
      country: form.country.trim().toUpperCase(),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tax rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const openDialog = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Tax Rules</h3>
          <p className="text-sm text-muted-foreground">
            Manage tax rates for your organization.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tax Rule
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Add New Tax Rule
              </DialogTitle>
              <DialogDescription>
                Define a tax rate and its behaviour for your organization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="tax-name">Name</Label>
                <Input
                  id="tax-name"
                  placeholder="e.g. VAT 20%"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>

              {/* Rate */}
              <div className="space-y-1">
                <Label htmlFor="tax-rate">Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="e.g. 20"
                  value={form.rate}
                  onChange={(e) =>
                    setForm({ ...form, rate: parseFloat(e.target.value) || 0 })
                  }
                />
                {formErrors.rate && (
                  <p className="text-xs text-destructive">{formErrors.rate}</p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label htmlFor="tax-type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value: 'inclusive' | 'exclusive') =>
                    setForm({ ...form, type: value })
                  }
                >
                  <SelectTrigger id="tax-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Exclusive (tax added on top)</SelectItem>
                    <SelectItem value="inclusive">Inclusive (tax included in price)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Country */}
              <div className="space-y-1">
                <Label htmlFor="tax-country">Country Code</Label>
                <Input
                  id="tax-country"
                  placeholder="e.g. US, GB, AUS"
                  maxLength={3}
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
                {formErrors.country && (
                  <p className="text-xs text-destructive">{formErrors.country}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="tax-description">Description</Label>
                <Input
                  id="tax-description"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Is Default */}
              <div className="flex items-center gap-3">
                <Switch
                  id="tax-is-default"
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                />
                <Label htmlFor="tax-is-default">Set as default tax rule</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            All Tax Rules
          </CardTitle>
          <CardDescription>
            Tax rates applied to transactions in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading tax rules...</div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate (%)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxRules?.length ? (
                    taxRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{rule.name}</div>
                            {rule.description && (
                              <div className="text-xs text-muted-foreground">{rule.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{rule.rate}%</TableCell>
                        <TableCell>
                          <Badge variant={rule.type === 'inclusive' ? 'default' : 'secondary'}>
                            {rule.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{rule.country}</span>
                        </TableCell>
                        <TableCell>
                          {rule.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                            className="flex items-center gap-1 text-destructive hover:text-destructive ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No tax rules found. Add your first tax rule to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
