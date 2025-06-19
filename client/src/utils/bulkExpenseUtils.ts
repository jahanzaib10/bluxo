
import { supabase } from '@/integrations/supabase/client';

export interface BulkExpenseData {
  categoryName: string;
  amount: number;
  date: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency?: string;
}

export async function bulkAddExpenseForAllEmployees(expenseData: BulkExpenseData) {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // First, check if the category exists, if not create it
    let { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', expenseData.categoryName)
      .eq('type', 'expense')
      .maybeSingle();

    if (!category) {
      const { data: newCategory, error: categoryError } = await supabase
        .from('categories')
        .insert([{
          name: expenseData.categoryName,
          type: 'expense',
          created_by: currentUser.id
        }])
        .select('id')
        .single();

      if (categoryError) {
        throw new Error(`Error creating category: ${categoryError.message}`);
      }
      category = newCategory;
    }

    // Get all active employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, worker_full_name')
      .eq('archived', false);

    if (employeesError) {
      throw new Error(`Error fetching employees: ${employeesError.message}`);
    }

    if (!employees || employees.length === 0) {
      throw new Error('No active employees found');
    }

    // Create expense records for all employees
    const expenseRecords = employees.map(employee => ({
      amount: expenseData.amount,
      category_id: category.id,
      employee_id: employee.id,
      date: expenseData.date,
      description: expenseData.description,
      is_recurring: expenseData.isRecurring,
      recurring_frequency: expenseData.recurringFrequency || null,
      created_by: currentUser.id
    }));

    const { error: expenseError } = await supabase
      .from('spending')
      .insert(expenseRecords);

    if (expenseError) {
      throw new Error(`Error creating expenses: ${expenseError.message}`);
    }

    return {
      success: true,
      message: `Successfully added ${employees.length} expense records for all employees`,
      employeeCount: employees.length
    };

  } catch (error: any) {
    throw new Error(error.message || 'Failed to bulk add expenses');
  }
}
