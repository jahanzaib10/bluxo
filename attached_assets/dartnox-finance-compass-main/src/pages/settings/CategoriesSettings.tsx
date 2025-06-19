
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function CategoriesSettings() {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense'
  });

  const queryClient = useQueryClient();

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

  // Handler functions
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      type: category.type
    });
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory.mutate({ ...categoryForm, id: editingCategory.id });
    } else {
      createCategory.mutate(categoryForm);
    }
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', type: 'expense' });
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

  return (
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
  );
}
