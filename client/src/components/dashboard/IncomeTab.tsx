import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign, Calendar, User, Settings } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { apiRequest } from '@/lib/queryClient';

export function IncomeTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: '',
    clientId: '',
    paymentReceiverId: '',
    isRecurring: false,
    recurringFrequency: '',
    recurringEndDate: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: income = [] } = useQuery({
    queryKey: ['/api/income'],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: paymentSources = [] } = useQuery({
    queryKey: ['/api/payment-sources'],
  });

  const createIncome = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/income', {
        ...data,
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      setShowForm(false);
      resetFormData();
      toast({ title: "Success", description: "Income record created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateIncome = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest('PUT', `/api/income/${id}`, {
        ...data,
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      setShowForm(false);
      setEditingIncome(null);
      resetFormData();
      toast({ title: "Success", description: "Income record updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteIncome = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/income/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      toast({ title: "Success", description: "Income record deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetFormData = () => {
    setFormData({
      amount: '',
      description: '',
      date: '',
      clientId: '',
      paymentReceiverId: '',
      isRecurring: false,
      recurringFrequency: '',
      recurringEndDate: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIncome) {
      updateIncome.mutate({ id: editingIncome.id, ...formData });
    } else {
      createIncome.mutate(formData);
    }
  };

  const handleEdit = (incomeRecord: any) => {
    setEditingIncome(incomeRecord);
    setFormData({
      amount: incomeRecord.amount?.toString() || '',
      description: incomeRecord.description || '',
      date: incomeRecord.date || '',
      clientId: incomeRecord.clientId || '',
      paymentReceiverId: incomeRecord.paymentReceiverId || '',
      isRecurring: incomeRecord.isRecurring || false,
      recurringFrequency: incomeRecord.recurringFrequency || '',
      recurringEndDate: incomeRecord.recurringEndDate || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      deleteIncome.mutate(id);
    }
  };

  const getClientName = (clientId: string) => {
    const client = Array.isArray(clients) ? clients.find((c: any) => c.id === clientId) : null;
    return client?.name || 'Unknown Client';
  };

  const getPaymentSourceName = (paymentSourceId: string) => {
    const paymentSource = Array.isArray(paymentSources) ? paymentSources.find((ps: any) => ps.id === paymentSourceId) : null;
    return paymentSource?.name || 'Unknown Payment Source';
  };

  const filteredIncome = useMemo(() => {
    if (!Array.isArray(income)) return [];
    return income.filter((record: any) => 
      record.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      getClientName(record.clientId).toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [income, searchValue, clients]);

  const totalIncome = Array.isArray(income) ? income.reduce((sum: number, record: any) => sum + parseFloat(record.amount || 0), 0) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {Array.isArray(income) ? income.length : 0} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredIncome.filter((record: any) => {
                const recordDate = new Date(record.date);
                const currentDate = new Date();
                return recordDate.getMonth() === currentDate.getMonth() && 
                       recordDate.getFullYear() === currentDate.getFullYear();
              }).reduce((sum: number, record: any) => sum + parseFloat(record.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Array.isArray(income) && income.length > 0 ? (totalIncome / income.length).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per income record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search income records..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Income Records */}
      <Card>
        <CardHeader>
          <CardTitle>Income Records</CardTitle>
          <CardDescription>Manage your income entries and track revenue sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIncome.map((record: any) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{record.description || 'Income Entry'}</h3>
                    <span className="text-sm text-green-600 font-semibold">
                      ${parseFloat(record.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Date: {new Date(record.date).toLocaleDateString()}</span>
                    {record.clientId && (
                      <span>Client: {getClientName(record.clientId)}</span>
                    )}
                    {record.paymentReceiverId && (
                      <span>Payment: {getPaymentSourceName(record.paymentReceiverId)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredIncome.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No income records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingIncome ? 'Edit Income' : 'Add New Income'}</CardTitle>
            <CardDescription>
              {editingIncome ? 'Update income record details' : 'Enter details for the new income record'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter income description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(clients) && clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentSource">Payment Source</Label>
                  <Select
                    value={formData.paymentReceiverId}
                    onValueChange={(value) => setFormData({ ...formData, paymentReceiverId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment source" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(paymentSources) && paymentSources.map((source: any) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
                />
                <Label htmlFor="recurring">Recurring Income</Label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.recurringFrequency}
                      onValueChange={(value) => setFormData({ ...formData, recurringFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingIncome(null);
                  resetFormData();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createIncome.isPending || updateIncome.isPending}>
                  {editingIncome ? 'Update' : 'Create'} Income
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}