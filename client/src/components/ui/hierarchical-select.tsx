
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '@/hooks/useHierarchicalCategories';

interface HierarchicalSelectProps {
  categories: Category[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showOnlyChildren?: boolean;
}

export function HierarchicalSelect({ 
  categories, 
  value, 
  onValueChange, 
  placeholder = "Select category",
  showOnlyChildren = false
}: HierarchicalSelectProps) {
  console.log('HierarchicalSelect received categories:', categories);
  console.log('Categories length:', categories.length);
  console.log('Show only children:', showOnlyChildren);

  // Debug: Log each category structure
  categories.forEach(cat => {
    console.log(`Category: ${cat.name}, ID: ${cat.id}, Children:`, cat.children?.length || 0);
  });

  const renderCategory = (category: Category, level = 0) => {
    const items = [];
    const hasChildren = category.children && category.children.length > 0;
    
    console.log(`Rendering category: ${category.name}, hasChildren: ${hasChildren}, level: ${level}`);
    
    // Show parent categories as disabled (not selectable) unless showOnlyChildren is true
    if (!showOnlyChildren || !hasChildren) {
      items.push(
        <SelectItem 
          key={category.id} 
          value={category.id}
          disabled={hasChildren && !showOnlyChildren} 
          className={hasChildren ? "font-semibold text-muted-foreground" : ""}
        >
          {'  '.repeat(level)}{category.name}
        </SelectItem>
      );
    }
    
    // Add children with indentation to show hierarchy
    if (hasChildren) {
      category.children.forEach(child => {
        console.log(`Adding child: ${child.name} under ${category.name}`);
        items.push(
          <SelectItem key={child.id} value={child.id} className="pl-6">
            {'  '.repeat(level + 1)}{child.name}
          </SelectItem>
        );
      });
    }
    
    return items;
  };

  // Get all categories and render them hierarchically
  const allItems = categories.flatMap(category => renderCategory(category));
  
  console.log('Total items to render:', allItems.length);

  if (categories.length === 0) {
    console.warn('No categories provided to HierarchicalSelect');
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto bg-white border shadow-md z-50">
        <SelectItem value="all-categories">All Categories</SelectItem>
        {allItems.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            {categories.length === 0 ? 'No categories available - check database connection' : 'No items to display'}
          </div>
        ) : (
          allItems
        )}
      </SelectContent>
    </Select>
  );
}
