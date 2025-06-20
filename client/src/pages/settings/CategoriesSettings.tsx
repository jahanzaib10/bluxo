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
import { Tag, Plus, Pencil, Trash2, Save, Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Please select a category type',
  }),
  parentId: z.string().optional(),
});

type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parentId: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

type ImportCategory = {
  name: string;
  type: 'income' | 'expense';
  parent_name?: string;
};

export default function CategoriesSettings() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportCategory[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Organize categories hierarchically
  const organizeHierarchically = (categories: Category[]) => {
    if (!categories) return [];
    
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const organized: (Category & { level: number; children?: Category[] })[] = [];
    
    // First, add all top-level categories (no parent)
    const topLevel = categories.filter(cat => !cat.parentId);
    
    const addCategoryWithChildren = (category: Category, level: number = 0) => {
      const categoryWithLevel = { ...category, level, children: [] };
      organized.push(categoryWithLevel);
      
      // Find and add children
      const children = categories.filter(cat => cat.parentId === category.id);
      children.forEach(child => addCategoryWithChildren(child, level + 1));
    };
    
    topLevel.forEach(cat => addCategoryWithChildren(cat));
    
    return organized;
  };

  const hierarchicalCategories = organizeHierarchically(categories || []);

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense' as const,
    },
  });

  React.useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        type: editingCategory.type,
      });
    } else {
      form.reset({
        name: '',
        type: 'expense',
      });
    }
  }, [editingCategory, form]);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema>) => {
      return await apiRequest('/api/categories', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema>) => {
      return await apiRequest(`/api/categories/${editingCategory?.id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const importCategoriesMutation = useMutation({
    mutationFn: async (data: ImportCategory[]) => {
      return await apiRequest('/api/categories/import', 'POST', { data });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.imported} of ${result.total} categories`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsImportDialogOpen(false);
      setCsvFile(null);
      setImportData([]);
      setImportErrors([]);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import categories",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof categorySchema>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate(data);
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const openImportDialog = () => {
    setIsImportDialogOpen(true);
    setCsvFile(null);
    setImportData([]);
    setImportErrors([]);
  };

  const parseCSV = (text: string): ImportCategory[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.findIndex(h => h.includes('name') && !h.includes('parent'));
    const typeIndex = headers.findIndex(h => h.includes('type'));
    const parentIndex = headers.findIndex(h => h.includes('parent') && h.includes('name'));

    if (nameIndex === -1 || typeIndex === -1) {
      throw new Error('CSV must contain "name" and "type" columns');
    }

    const data: ImportCategory[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < Math.max(nameIndex, typeIndex) + 1) continue;

      const name = values[nameIndex];
      const type = values[typeIndex]?.toLowerCase();
      const parentName = parentIndex !== -1 && values[parentIndex] ? values[parentIndex] : undefined;

      if (name && (type === 'income' || type === 'expense')) {
        data.push({
          name: name,
          type: type as 'income' | 'expense',
          parent_name: parentName
        });
      }
    }

    return data;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setImportData(parsed);
        setImportErrors([]);
      } catch (error) {
        setImportErrors([error instanceof Error ? error.message : 'Failed to parse CSV']);
        setImportData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (importData.length > 0) {
      importCategoriesMutation.mutate(importData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage income and expense categories for your organization.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openImportDialog} variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import Categories from CSV
                </DialogTitle>
                <DialogDescription>
                  Upload a CSV file with category data. Expected format: name, type (income or expense), parent_name (optional for hierarchical categories)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label htmlFor="csv-upload" className="block text-sm font-medium mb-2">
                    Select CSV File
                  </label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>

                {csvFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected file: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}

                {importErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {importErrors.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {importData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Preview ({importData.length} categories found)</h4>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Parent Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importData.slice(0, 10).map((category, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell>
                                <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                                  {category.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {category.parent_name || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {importData.length > 10 && (
                        <div className="p-3 text-sm text-muted-foreground text-center border-t">
                          And {importData.length - 10} more categories...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importData.length === 0 || importCategoriesMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {importCategoriesMutation.isPending 
                    ? "Importing..." 
                    : `Import ${importData.length} Categories`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Update the category details below.'
                    : 'Create a new category for organizing your income and expenses.'
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
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category name" {...field} />
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
                              <SelectValue placeholder="Select category type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
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
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            All Categories
          </CardTitle>
          <CardDescription>
            Manage your income and expense categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading categories...</div>
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
                {hierarchicalCategories?.length ? (
                  hierarchicalCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {/* Indentation for hierarchy */}
                          {category.level > 0 && (
                            <div 
                              className="border-l border-muted-foreground/20 mr-2" 
                              style={{ marginLeft: `${category.level * 16}px`, width: '2px', height: '20px' }} 
                            />
                          )}
                          <span style={{ paddingLeft: `${category.level * 16}px` }}>
                            {category.level > 0 && "└─ "}
                            {category.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                          {category.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
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
                      No categories found. Create your first category to get started.
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