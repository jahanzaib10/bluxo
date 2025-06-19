
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkAddExpenseForAllEmployees } from '@/utils/bulkExpenseUtils';
import { Users, Plus } from 'lucide-react';

export function BulkExpenseButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkAddMutation = useMutation({
    mutationFn: bulkAddExpenseForAllEmployees,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: result.message
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bulk expenses",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleBulkAdd = async () => {
    setIsLoading(true);
    
    const expenseData = {
      categoryName: "Benefits & Health Insurance",
      amount: 40,
      date: "2025-05-30",
      description: "Family Care & Medical Allowance",
      isRecurring: true,
      recurringFrequency: "monthly"
    };

    bulkAddMutation.mutate(expenseData);
  };

  return (
    <Button 
      onClick={handleBulkAdd}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 border-green-200"
    >
      <Users className="h-4 w-4 mr-2" />
      {isLoading ? 'Adding...' : 'Add Benefits for All'}
    </Button>
  );
}
