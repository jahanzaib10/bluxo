import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Settings, Search, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SettingsTab() {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showPaymentSourceForm, setShowPaymentSourceForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingPaymentSource, setEditingPaymentSource] = useState<any>(null);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense'
  });

  const [paymentSourceForm, setPaymentSourceForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    details: ''
  });

  // Account settings form state - now connected to database
  const [accountForm, setAccountForm] = useState({
    companyName: '',
    companyUrl: '',
    currency: 'EUR'
  });

  // Personal details form state - now connected to database
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const queryClient = useQueryClient();

  // Fetch current user's account
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['user-account'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Fetching account for user:', user.id);

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .single();
      
      if (error) {
        console.error('Account fetch error:', error);
        throw error;
      }
      
      console.log('Account data:', data);
      return data;
    },
  });

  // Fetch current user's profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Fetching profile for user:', user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      console.log('Profile data:', data);
      return data;
    },
  });

  // Update forms when data is loaded
  useEffect(() => {
    if (account) {
      setAccountForm({
        companyName: account.company_name || '',
        companyUrl: account.company_url || '',
        currency: account.currency || 'EUR'
      });
    }
  }, [account]);

  useEffect(() => {
    if (userProfile) {
      setPersonalForm({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        email: '', // Email comes from auth.users, we'll fetch it separately
        phone: userProfile.phone || ''
      });
    }
  }, [userProfile]);

  // Fetch user email from auth
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setPersonalForm(prev => ({ ...prev, email: user.email || '' }));
      }
    };
    fetchUserEmail();
  }, []);

  // Account update mutation
  const updateAccount = useMutation({
    mutationFn: async (data: typeof accountForm) => {
      if (!account?.id) {
        throw new Error('Account ID is missing');
      }

      console.log('Updating account:', account.id, 'with data:', data);

      const { error } = await supabase
        .from('accounts')
        .update({
          company_name: data.companyName,
          company_url: data.companyUrl,
          currency: data.currency
        })
        .eq('id', account.id);
      
      if (error) {
        console.error('Account update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-account'] });
      setIsEditingAccount(false);
      toast({ title: "Success", description: "Account settings updated successfully." });
    },
    onError: (error: any) => {
      console.error('Account update mutation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Profile update mutation
  const updateProfile = useMutation({
    mutationFn: async (data: typeof personalForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Updating profile for user:', user.id, 'with data:', data);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditingPersonal(false);
      toast({ title: "Success", description: "Personal details updated successfully." });
    },
    onError: (error: any) => {
      console.error('Profile update mutation error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Mock users data for the User Management tab
  const mockUsers = [
    {
      id: 1,
      fullName: 'Alex R',
      email: 'ale******@setting-mastery.com',
      role: 'Setters',
      avatar: 'AR'
    },
    {
      id: 2,
      fullName: 'Ben Mth',
      email: 'ben***@setting-mastery.com',
      role: 'Super Admin',
      avatar: 'BM'
    },
    {
      id: 3,
      fullName: 'Benjamin Nourtier',
      email: 'ben*****@setting-mastery.com',
      role: 'Closer',
      avatar: 'BN'
    },
    {
      id: 4,
      fullName: 'Bryan Delhaye ruand',
      email: 'bry***@closing-mastery.com',
      role: 'Setters',
      avatar: 'BD'
    }
  ];

  // Filter users based on search
  const filteredUsers = mockUsers.filter(user => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // Categories queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentSources = [] } = useQuery({
    queryKey: ['payment-sources-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_sources')
        .select('*')
        .eq('archived', false)
        .order('type', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Category mutations
  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('categories')
        .insert([{ ...data, created_by: (await supabase.auth.getUser()).data.user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCategoryForm(false);
      setCategoryForm({ name: '', type: 'expense' });
      toast({ title: "Success", description: "Category created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      setCategoryForm({ name: '', type: 'expense' });
      toast({ title: "Success", description: "Category updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: "Success", description: "Category deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Payment source mutations
  const createPaymentSource = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('payment_sources')
        .insert([{ 
          ...data, 
          details: data.details ? JSON.parse(data.details) : null,
          created_by: (await supabase.auth.getUser()).data.user?.id 
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-sources-all'] });
      setShowPaymentSourceForm(false);
      setPaymentSourceForm({ name: '', type: 'income', details: '' });
      toast({ title: "Success", description: "Payment source created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePaymentSource = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('payment_sources')
        .update({
          ...data,
          details: data.details ? JSON.parse(data.details) : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-sources-all'] });
      setEditingPaymentSource(null);
      setPaymentSourceForm({ name: '', type: 'income', details: '' });
      toast({ title: "Success", description: "Payment source updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePaymentSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_sources')
        .update({ archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-sources-all'] });
      toast({ title: "Success", description: "Payment source archived successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handler functions
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      type: category.type
    });
    setShowCategoryForm(true);
  };

  const handleEditPaymentSource = (paymentSource: any) => {
    setEditingPaymentSource(paymentSource);
    setPaymentSourceForm({
      name: paymentSource.name,
      type: paymentSource.type,
      details: paymentSource.details ? JSON.stringify(paymentSource.details) : ''
    });
    setShowPaymentSourceForm(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory.mutate({ ...categoryForm, id: editingCategory.id });
    } else {
      createCategory.mutate(categoryForm);
    }
  };

  const handlePaymentSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPaymentSource) {
      updatePaymentSource.mutate({ ...paymentSourceForm, id: editingPaymentSource.id });
    } else {
      createPaymentSource.mutate(paymentSourceForm);
    }
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', type: 'expense' });
  };

  const resetPaymentSourceForm = () => {
    setShowPaymentSourceForm(false);
    setEditingPaymentSource(null);
    setPaymentSourceForm({ name: '', type: 'income', details: '' });
  };

  // Account settings handlers
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Account form submitted:', accountForm);
    console.log('Current account:', account);
    
    if (!account?.id) {
      toast({ 
        title: "Error", 
        description: "Account information is not loaded yet. Please try again.", 
        variant: "destructive" 
      });
      return;
    }
    
    updateAccount.mutate(accountForm);
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Personal form submitted:', personalForm);
    updateProfile.mutate(personalForm);
  };

  // Define table columns for categories
  const categoryColumns: DataTableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      minWidth: '200px',
      render: (category) => (
        <span className="font-medium">{category.name}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      minWidth: '120px',
      render: (category) => (
        <span className={`capitalize px-2 py-1 rounded-full text-xs ${
          category.type === 'income' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {category.type}
        </span>
      )
    }
  ];

  // Define table actions for categories
  const categoryActions: DataTableAction[] = [
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditCategory,
      variant: 'outline'
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (category) => deleteCategory.mutate(category.id),
      variant: 'outline'
    }
  ];

  // Define table columns for users
  const userColumns: DataTableColumn[] = [
    {
      key: 'fullName',
      label: 'FULL NAME',
      minWidth: '200px',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
              {user.avatar}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.fullName}</span>
        </div>
      )
    },
    {
      key: 'email',
      label: 'EMAIL',
      minWidth: '250px',
      render: (user) => (
        <span className="text-muted-foreground">{user.email}</span>
      )
    },
    {
      key: 'role',
      label: 'ROLE',
      minWidth: '150px',
      render: (user) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          user.role === 'Super Admin' 
            ? 'bg-purple-100 text-purple-700' 
            : user.role === 'Closer'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {user.role}
        </span>
      )
    }
  ];

  // Define table actions for users
  const userActions: DataTableAction[] = [
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (user) => {
        toast({ title: "Edit User", description: `Editing ${user.fullName}` });
      },
      variant: 'outline'
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (user) => {
        toast({ title: "Delete User", description: `Deleting ${user.fullName}` });
      },
      variant: 'outline'
    }
  ];

  if (accountLoading || profileLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!account) {
    return <div className="p-6">No account found. Please contact support.</div>;
  }

  return (
    <div className="w-full max-w-full h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="payment-sources">Payment Sources</TabsTrigger>
              <TabsTrigger value="user-management">User Management</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="space-y-8">
                {/* Account Settings */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Account Settings</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingAccount(!isEditingAccount)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditingAccount ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditingAccount ? (
                      <form onSubmit={handleAccountSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                              id="companyName"
                              value={accountForm.companyName}
                              onChange={(e) => setAccountForm({ ...accountForm, companyName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="companyUrl">Company URL</Label>
                            <Input
                              id="companyUrl"
                              value={accountForm.companyUrl}
                              onChange={(e) => setAccountForm({ ...accountForm, companyUrl: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={accountForm.currency} onValueChange={(value) => setAccountForm({ ...accountForm, currency: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                                <SelectItem value="USD">$ USD (Dollar)</SelectItem>
                                <SelectItem value="GBP">£ GBP (Pound)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={updateAccount.isPending}>
                            {updateAccount.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsEditingAccount(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Company Name</Label>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-orange-100 text-orange-600">
                                  {accountForm.companyName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{accountForm.companyName}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Company URL</Label>
                            <p className="text-sm">{accountForm.companyUrl || 'Not set'}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Currency</Label>
                            <p className="text-sm">
                              {accountForm.currency === 'EUR' && '€ EUR (Euro)'}
                              {accountForm.currency === 'USD' && '$ USD (Dollar)'}
                              {accountForm.currency === 'GBP' && '£ GBP (Pound)'}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Personal Details */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Personal Details</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditingPersonal ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditingPersonal ? (
                      <form onSubmit={handlePersonalSubmit} className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-slate-100">
                              {personalForm.firstName.slice(0, 1)}{personalForm.lastName.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <Button variant="outline" size="sm">Change Avatar</Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={personalForm.firstName}
                              onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={personalForm.lastName}
                              onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={personalForm.email}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={personalForm.phone}
                              onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button type="submit" disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsEditingPersonal(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-slate-100">
                              {personalForm.firstName.slice(0, 1)}{personalForm.lastName.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{personalForm.firstName} {personalForm.lastName}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">First Name</Label>
                            <p className="text-sm">{personalForm.firstName}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Last Name</Label>
                            <p className="text-sm">{personalForm.lastName}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Email Address</Label>
                            <p className="text-sm">{personalForm.email}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Phone Number</Label>
                            <p className="text-sm">{personalForm.phone || 'Not set'}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Password */}
                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Keep your account safe by resetting your password every few months.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Reset Password
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories">
              <div className="space-y-6">
                {showCategoryForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
                      <CardDescription>
                        {editingCategory ? 'Update category information' : 'Create a new category for organizing income/expenses'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="categoryName">Name</Label>
                          <Input
                            id="categoryName"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="categoryType">Type</Label>
                          <Select value={categoryForm.type} onValueChange={(value: 'income' | 'expense') => setCategoryForm({ ...categoryForm, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">
                            {editingCategory ? 'Update' : 'Create'} Category
                          </Button>
                          <Button type="button" variant="outline" onClick={resetCategoryForm}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-slate-800">Categories</CardTitle>
                        <CardDescription>
                          Manage your income and expense categories
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setShowCategoryForm(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Category
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="mx-6 mt-6 mb-6">
                      <DataTable
                        data={categories}
                        columns={categoryColumns}
                        actions={categoryActions}
                        height="40vh"
                        stickyActions={true}
                        configurableColumns={false}
                        storageKey="categoriesColumnPreferences"
                        showColumnConfig={false}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payment-sources">
              <div className="space-y-6">
                {showPaymentSourceForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingPaymentSource ? 'Edit Payment Source' : 'Add New Payment Source'}</CardTitle>
                      <CardDescription>
                        {editingPaymentSource ? 'Update payment source information' : 'Create a new payment source (bank account, credit card, etc.)'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePaymentSourceSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentSourceName">Name</Label>
                          <Input
                            id="paymentSourceName"
                            value={paymentSourceForm.name}
                            onChange={(e) => setPaymentSourceForm({ ...paymentSourceForm, name: e.target.value })}
                            placeholder="e.g., Business Checking Account"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentSourceType">Type</Label>
                          <Select value={paymentSourceForm.type} onValueChange={(value: 'income' | 'expense') => setPaymentSourceForm({ ...paymentSourceForm, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentSourceDetails">Details (JSON)</Label>
                          <Input
                            id="paymentSourceDetails"
                            value={paymentSourceForm.details}
                            onChange={(e) => setPaymentSourceForm({ ...paymentSourceForm, details: e.target.value })}
                            placeholder='{"account_number": "****1234", "bank": "Example Bank"}'
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">
                            {editingPaymentSource ? 'Update' : 'Create'} Payment Source
                          </Button>
                          <Button type="button" variant="outline" onClick={resetPaymentSourceForm}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-slate-800">Payment Sources</CardTitle>
                        <CardDescription>
                          Manage your payment methods (bank accounts, credit cards, etc.)
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setShowPaymentSourceForm(true)} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Payment Source
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {paymentSources.map((source) => (
                        <Card key={source.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{source.name}</h3>
                                <p className="text-sm text-gray-600 capitalize">{source.type}</p>
                                {source.details && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {JSON.stringify(source.details)}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleEditPaymentSource(source)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => deletePaymentSource.mutate(source.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="user-management">
              <div className="space-y-6">
                <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-slate-800">User Management</CardTitle>
                        <CardDescription>
                          Manage users, roles, and permissions
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Learn more
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          <User className="h-4 w-4 mr-1" />
                          Add User
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="mx-6 mt-6 mb-6">
                      <DataTable
                        data={filteredUsers}
                        columns={userColumns}
                        actions={userActions}
                        height="50vh"
                        stickyActions={true}
                        configurableColumns={false}
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        searchPlaceholder="Search user"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
