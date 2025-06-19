
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';

export function CategoriesDebug() {
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const { data: expenseCategories, isLoading, error } = useHierarchicalCategories('expense');

  const addDebugResult = (test: string, result: any) => {
    console.log(`🧪 ${test}:`, result);
    setDebugResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setDebugResults([]);
    
    try {
      // Test 1: Check auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      addDebugResult('Auth Status', { user: authData?.user?.id, error: authError?.message });

      // Test 2: Direct query without filters
      const { data: allData, error: allError } = await supabase
        .from('categories')
        .select('*');
      addDebugResult('All Categories Query', { count: allData?.length, error: allError?.message });

      // Test 3: Query with expense filter
      const { data: expenseData, error: expenseError } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'expense');
      addDebugResult('Expense Categories Query', { count: expenseData?.length, error: expenseError?.message });

      // Test 4: Manual fetch with direct API
      const response = await fetch('https://fqlkmzaptmnuazogiznq.supabase.co/rest/v1/categories?select=*&type=eq.expense', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbGttemFwdG1udWF6b2dpem5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MjMxMDAsImV4cCI6MjA2NDM5OTEwMH0.IZ_BGrZpz4gu7xJpNNhuP9QI-_nP-a1aQsDAYDpFqcM',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbGttemFwdG1udWF6b2dpem5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MjMxMDAsImV4cCI6MjA2NDM5OTEwMH0.IZ_BGrZpz4gu7xJpNNhuP9QI-_nP-a1aQsDAYDpFqcM',
          'Content-Type': 'application/json'
        }
      });
      const fetchData = await response.json();
      addDebugResult('Direct API Fetch', { 
        status: response.status, 
        count: Array.isArray(fetchData) ? fetchData.length : 'Not array',
        data: fetchData 
      });

    } catch (error) {
      addDebugResult('Error in diagnostics', { error: error.message });
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Categories API Debug Console</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Hook Results</h3>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {error ? error.message : 'None'}</p>
            <p>Categories Count: {expenseCategories?.length || 0}</p>
          </div>
          <div>
            <Button onClick={runDiagnostics}>Re-run Diagnostics</Button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <h3 className="font-semibold">Debug Results:</h3>
          {debugResults.map((result, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded text-sm">
              <strong>{result.test}:</strong>
              <pre className="mt-1 whitespace-pre-wrap">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
