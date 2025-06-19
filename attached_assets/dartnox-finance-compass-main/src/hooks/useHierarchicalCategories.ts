
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  children?: Category[];
}

export function useHierarchicalCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ['hierarchical-categories', type],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Categories fetch error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Build hierarchical structure
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];
      
      // First pass: create all categories
      data.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      // Second pass: build hierarchy
      data.forEach(cat => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children!.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });
      
      return rootCategories;
    },
  });
}

export function useFlatCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ['flat-categories', type],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Category[];
    },
  });
}
