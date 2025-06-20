import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parentId: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface CategorySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  type: 'income' | 'expense';
  placeholder?: string;
  allowParentSelection?: boolean;
}

export function CategorySelect({ 
  value, 
  onValueChange, 
  type, 
  placeholder = "Select category",
  allowParentSelection = false 
}: CategorySelectProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Filter categories by type and organize hierarchically
  const filteredCategories = categories.filter(cat => cat.type === type);
  
  // Create hierarchy structure
  const categoryMap = new Map();
  const rootCategories: Category[] = [];
  
  // First pass: create map and find root categories
  filteredCategories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
    if (!cat.parentId) {
      rootCategories.push(cat);
    }
  });
  
  // Second pass: build parent-child relationships
  filteredCategories.forEach(cat => {
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId).children.push(cat);
    }
  });

  // Recursive function to render categories with indentation
  const renderCategoryOptions = (cats: Category[], level: number = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];
    
    cats.forEach(cat => {
      const categoryData = categoryMap.get(cat.id);
      const hasChildren = categoryData.children.length > 0;
      const indent = '  '.repeat(level);
      
      // Show parent categories only if allowParentSelection is true or they have no children
      if (allowParentSelection || !hasChildren) {
        options.push(
          <SelectItem key={cat.id} value={cat.id}>
            {indent}{cat.name}
            {hasChildren && !allowParentSelection ? ' (has subcategories)' : ''}
          </SelectItem>
        );
      }
      
      // Recursively render children
      if (hasChildren) {
        options.push(...renderCategoryOptions(categoryData.children, level + 1));
      }
    });
    
    return options;
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {rootCategories.length > 0 ? (
          renderCategoryOptions(rootCategories)
        ) : (
          <SelectItem value="" disabled>
            No {type} categories available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}