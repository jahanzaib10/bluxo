
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Edit } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function GeneralSettings() {
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  
  const [accountForm, setAccountForm] = useState({
    companyName: '',
    companyUrl: '',
    currency: 'EUR'
  });

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

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch current user's profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
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
        email: '',
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
      if (!account?.id) throw new Error('Account ID is missing');

      const { error } = await supabase
        .from('accounts')
        .update({
          company_name: data.companyName,
          company_url: data.companyUrl,
          currency: data.currency
        })
        .eq('id', account.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-account'] });
      setIsEditingAccount(false);
      toast({ title: "Success", description: "Account settings updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Profile update mutation
  const updateProfile = useMutation({
    mutationFn: async (data: typeof personalForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditingPersonal(false);
      toast({ title: "Success", description: "Personal details updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    updateProfile.mutate(personalForm);
  };

  if (accountLoading || profileLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!account) {
    return <div className="p-6">No account found. Please contact support.</div>;
  }

  return (
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
  );
}
