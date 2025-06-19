
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText } from 'lucide-react';

interface CSVRow {
  'Worker ID': string;
  'Worker Full Name': string;
  'Country of Residence': string;
  'Group': string;
  'Start Date': string;
  'Personal Email': string;
  'Birth date': string;
  'Job Title': string;
  'Seniority': string;
  'End Date': string;
  'Payment Amount': string;
  'Direct Manager Name': string;
  'Comments': string;
}

export function CSVImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }
    
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);
    
    const parsedRows = dataLines.map((line) => {
      // Better CSV parsing that handles quoted values with commas
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Don't forget the last value
      
      const row: any = {};
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        row[header] = value;
      });
      
      return row as CSVRow;
    });
    
    return parsedRows;
  };

  const findManagerByName = async (managerName: string, createdEmployees: Map<string, string>): Promise<string | null> => {
    if (!managerName || !managerName.trim()) {
      const { data: defaultManager } = await supabase
        .from('employees')
        .select('id')
        .eq('worker_id', 1)
        .eq('archived', false)
        .maybeSingle();
      
      return defaultManager?.id || null;
    }
    
    // First check in already created employees from this import session
    for (const [name, id] of createdEmployees.entries()) {
      if (name.toLowerCase() === managerName.toLowerCase()) {
        return id;
      }
    }
    
    // Then check in existing database
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('worker_full_name', managerName)
      .eq('archived', false)
      .maybeSingle();
    
    if (existingEmployee?.id) {
      return existingEmployee.id;
    }
    
    // If manager not found, find worker ID 1 as default
    const { data: defaultManager } = await supabase
      .from('employees')
      .select('id')
      .eq('worker_id', 1)
      .eq('archived', false)
      .maybeSingle();
    
    return defaultManager?.id || null;
  };

  const findSalaryCategory = async (): Promise<string> => {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Salaries')
      .eq('type', 'expense')
      .maybeSingle();
    
    if (category) {
      return category.id;
    }
    
    // Create Salaries category if it doesn't exist
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([{
        name: 'Salaries',
        type: 'expense',
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select('id')
      .single();
    
    if (error) {
      throw error;
    }
    
    return newCategory.id;
  };

  // Fixed payment amount parser - converts "4,850.00" to 4850
  const parsePaymentAmount = (paymentString: string): number | null => {
    if (!paymentString || typeof paymentString !== 'string') {
      return null;
    }
    
    // Remove all non-numeric characters except dots and commas
    let cleanedString = paymentString.replace(/[^\d.,]/g, '');
    
    // Remove commas (thousand separators)
    cleanedString = cleanedString.replace(/,/g, '');
    
    // Parse as float and then convert to integer (removing decimals)
    const parsed = parseFloat(cleanedString);
    const result = isNaN(parsed) ? null : Math.floor(parsed);
    
    return result;
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      const csvText = await file.text();
      const rows = parseCSV(csvText);
      
      const createdEmployees = new Map<string, string>(); // name -> id mapping
      const salaryCategoyId = await findSalaryCategory();
      const currentUser = (await supabase.auth.getUser()).data.user;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Parse payment amount with improved formatting
        const paymentAmount = parsePaymentAmount(row['Payment Amount']);

        // Prepare employee data
        const employeeData = {
          worker_full_name: row['Worker Full Name'],
          country_of_residence: row['Country of Residence'] || null,
          group_name: row['Group'] || null,
          start_date: row['Start Date'] ? new Date(row['Start Date']).toISOString().split('T')[0] : null,
          personal_email: row['Personal Email'] || null,
          birth_date: row['Birth date'] ? new Date(row['Birth date']).toISOString().split('T')[0] : null,
          job_title: row['Job Title'] || null,
          seniority: row['Seniority'] || null,
          end_date: row['End Date'] ? new Date(row['End Date']).toISOString().split('T')[0] : null,
          payment_amount: paymentAmount,
          direct_manager_id: null, // Will be set after finding manager
          comments: row['Comments'] || null,
          created_by: currentUser.id
        };

        // Create employee first
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .insert([employeeData])
          .select('id, worker_full_name, worker_id')
          .single();

        if (employeeError) {
          throw new Error(`Error creating employee ${row['Worker Full Name']}: ${employeeError.message}`);
        }

        // Store in our mapping for future manager references
        createdEmployees.set(employee.worker_full_name, employee.id);

        // Create salary expense if payment amount exists
        if (paymentAmount && paymentAmount > 0) {
          const expenseData = {
            amount: paymentAmount,
            category_id: salaryCategoyId,
            employee_id: employee.id,
            date: '2025-05-30',
            description: `Monthly salary for ${employee.worker_full_name}`,
            is_recurring: true,
            recurring_frequency: 'monthly',
            created_by: currentUser.id
          };

          const { error: expenseError } = await supabase
            .from('spending')
            .insert([expenseData]);

          if (expenseError) {
            console.error(`Error creating expense for ${employee.worker_full_name}:`, expenseError);
          }
        }

        // Update progress
        const progressPercent = ((i + 1) / rows.length) * 100;
        setProgress(progressPercent);
      }

      // Second pass: Update manager relationships
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const employeeName = row['Worker Full Name'];
        const managerName = row['Direct Manager Name'];
        
        // Find manager ID by matching the name
        const directManagerId = await findManagerByName(managerName, createdEmployees);
        
        if (directManagerId) {
          // Update employee with manager ID
          const employeeId = createdEmployees.get(employeeName);
          
          if (employeeId) {
            const { error: updateError } = await supabase
              .from('employees')
              .update({ direct_manager_id: directManagerId })
              .eq('id', employeeId);

            if (updateError) {
              console.error(`Error updating manager for ${employeeName}:`, updateError);
            }
          }
        }
      }
      
      toast({
        title: "Success",
        description: `Successfully imported ${rows.length} employees with their salary expenses and manager relationships.`
      });

      setIsOpen(false);
      setFile(null);
      
      // Refresh the page to show new data
      window.location.reload();

    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message || "Failed to import CSV file",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Employees from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with employee data. The CSV should include columns: Worker ID, Worker Full Name, Country of Residence, Group, Start Date, Personal Email, Birth date, Job Title, Seniority, End Date, Payment Amount, Direct Manager Name, Comments. Manager relationships will be automatically linked by matching names. If no manager is found, worker ID 1 will be assigned as the default manager.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>
          
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <Label>Import Progress</Label>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleImport} 
              disabled={!file || isImporting}
              className="flex-1"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
