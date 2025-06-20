import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  clients, 
  employees, 
  categories, 
  income, 
  expenses, 
  subscriptions
} from "@shared/schema";
import { eq, sum, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// Mock auth middleware for now
function mockAuth(req: any, res: any, next: any) {
  req.user = { organizationId: "2723d846-8be7-4d00-9892-ea199b74d73d" };
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard analytics endpoint
  app.get("/api/dashboard/analytics", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      
      // Get total income
      const incomeResult = await db
        .select({ total: sum(income.amount) })
        .from(income)
        .where(eq(income.organizationId, organizationId));
      
      // Get total expenses
      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(eq(expenses.organizationId, organizationId));
      
      const totalIncome = parseFloat(incomeResult[0]?.total || "0");
      const totalExpenses = parseFloat(expenseResult[0]?.total || "0");
      const netIncome = totalIncome - totalExpenses;
      
      res.json({
        totalIncome,
        totalSpending: totalExpenses,
        netIncome,
        monthlyNet: netIncome
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Clients endpoints
  app.get("/api/clients", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const result = await db
        .select()
        .from(clients)
        .where(eq(clients.organizationId, organizationId))
        .orderBy(desc(clients.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { name, email } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const [newClient] = await db
        .insert(clients)
        .values({
          name,
          email: email || null,
          organizationId,
        })
        .returning();
      
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Employees endpoints
  app.get("/api/employees", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const result = await db
        .select()
        .from(employees)
        .where(eq(employees.organizationId, organizationId))
        .orderBy(desc(employees.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { name, email, position, country, startDate, endDate, status } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const [newEmployee] = await db
        .insert(employees)
        .values({
          name,
          email: email || null,
          position: position || null,
          country: country || null,
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || 'active',
          organizationId,
        })
        .returning();
      
      res.status(201).json(newEmployee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { id } = req.params;
      const { name, email, position, country, startDate, endDate, status } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const [updatedEmployee] = await db
        .update(employees)
        .set({
          name,
          email: email || null,
          position: position || null,
          country: country || null,
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || 'active',
        })
        .where(and(eq(employees.id, id), eq(employees.organizationId, organizationId)))
        .returning();
      
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { id } = req.params;
      
      const [deletedEmployee] = await db
        .delete(employees)
        .where(and(eq(employees.id, id), eq(employees.organizationId, organizationId)))
        .returning();
      
      if (!deletedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Enhanced CSV import with data sanitization and validation
  function sanitizePaymentAmount(value: string): number | null {
    if (!value || typeof value !== 'string') return null;
    
    // Remove currency symbols, commas, percentages, and normalize
    const cleaned = value
      .trim()
      .replace(/[PKR$£€¥₹,\s%]/g, '')
      .replace(/\.+$/, ''); // Remove trailing dots
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  function parseFlexibleDate(dateStr: string): string | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    const trimmed = dateStr.trim();
    if (!trimmed) return null;
    
    // Try different date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];
    
    try {
      // Handle MM/DD/YYYY format
      if (formats[1].test(trimmed)) {
        const [month, day, year] = trimmed.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle DD/MM/YYYY format (common international format)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('/');
        // If day > 12, assume DD/MM/YYYY format
        if (parseInt(parts[0]) > 12) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Otherwise treat as MM/DD/YYYY
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle MM-DD-YYYY format
      if (formats[2].test(trimmed)) {
        const [month, day, year] = trimmed.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle YYYY-MM-DD format (already correct)
      if (formats[0].test(trimmed)) {
        return trimmed;
      }
      
      // Try parsing with Date constructor as fallback
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn(`Invalid date format: ${trimmed}`);
    }
    
    return null;
  }

  function normalizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase();
  }

  function mapCsvFields(row: any): any {
    const mapped: any = {};
    
    // Map common field variations
    const fieldMappings = {
      name: ['name', 'full_name', 'employee_name', 'full name', 'employee name'],
      email: ['email', 'email_address', 'e-mail', 'email address'],
      position: ['position', 'job_title', 'title', 'role', 'job title', 'job_title'],
      country: ['country', 'location', 'region'],
      startDate: ['start_date', 'start_dt', 'hire_date', 'joining_date', 'start date', 'hire date'],
      endDate: ['end_date', 'end_dt', 'termination_date', 'leaving_date', 'end date', 'termination date'],
      birthDate: ['birth_date', 'date_of_birth', 'dob', 'birth date', 'date of birth'],
      seniorityLevel: ['seniority_level', 'level', 'grade', 'seniority', 'seniority level'],
      paymentAmount: ['payment_amount', 'salary', 'compensation', 'pay', 'amount', 'payment'],
      directManagerName: ['direct_manager_name', 'manager', 'supervisor', 'direct_manager', 'manager_name', 'direct manager', 'manager name'],
      groupName: ['group_name', 'group', 'department', 'team', 'division', 'group name'],
      status: ['status', 'employment_status', 'state', 'employment status']
    };
    
    // Normalize row keys for case-insensitive matching
    const normalizedRow: any = {};
    Object.keys(row).forEach(key => {
      normalizedRow[key.toLowerCase().replace(/[_\s]/g, '_')] = row[key];
    });
    
    // Map fields using variations
    Object.entries(fieldMappings).forEach(([targetField, variations]) => {
      for (const variation of variations) {
        const normalizedVariation = variation.toLowerCase().replace(/[_\s]/g, '_');
        if (normalizedRow[normalizedVariation] !== undefined) {
          mapped[targetField] = normalizedRow[normalizedVariation];
          break;
        }
      }
    });
    
    return mapped;
  }

  app.post("/api/employees/import", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { employees: employeeData } = req.body;
      
      if (!Array.isArray(employeeData) || employeeData.length === 0) {
        return res.status(400).json({ 
          message: "Invalid employee data",
          details: "Expected an array of employee records"
        });
      }
      
      // First, get existing employees to create name-to-ID mapping for manager resolution
      const existingEmployees = await db
        .select({ id: employees.id, name: employees.name })
        .from(employees)
        .where(eq(employees.organizationId, organizationId));
      
      const employeeNameMap = new Map<string, string>();
      existingEmployees.forEach(emp => {
        employeeNameMap.set(emp.name.toLowerCase().trim(), emp.id);
      });
      
      const processedEmployees = [];
      const errors = [];
      
      // First pass: Process all employees without manager references
      for (let i = 0; i < employeeData.length; i++) {
        const rawRow = employeeData[i];
        const row = mapCsvFields(rawRow);
        
        // Validate required fields
        const name = row.name?.toString().trim();
        const email = row.email?.toString().trim();
        const position = row.position?.toString().trim();
        
        if (!name) {
          errors.push(`Row ${i + 1}: Missing required field 'name'`);
          continue;
        }
        
        if (!email) {
          errors.push(`Row ${i + 1}: Missing required field 'email'`);
          continue;
        }
        
        if (!position) {
          errors.push(`Row ${i + 1}: Missing required field 'position'`);
          continue;
        }
        
        // Process and sanitize data
        const processedEmployee = {
          name,
          email,
          position,
          country: row.country?.toString().trim() || null,
          startDate: parseFlexibleDate(row.startDate?.toString()),
          endDate: parseFlexibleDate(row.endDate?.toString()),
          birthDate: parseFlexibleDate(row.birthDate?.toString()),
          seniorityLevel: row.seniorityLevel?.toString().trim() || null,
          paymentAmount: sanitizePaymentAmount(row.paymentAmount?.toString()),
          groupName: row.groupName?.toString().trim() || null,
          status: normalizeText(row.status?.toString()) || 'active',
          organizationId,
          directManagerId: null, // Will be resolved in second pass
          managerName: row.directManagerName?.toString().trim() || null, // Store for resolution
        };
        
        // Validate start_date if provided (required field in schema)
        if (!processedEmployee.startDate) {
          errors.push(`Row ${i + 1}: Missing or invalid required field 'start_date'`);
          continue;
        }
        
        processedEmployees.push(processedEmployee);
        
        // Add to name map for potential manager references within the same batch
        employeeNameMap.set(name.toLowerCase().trim(), 'pending');
      }
      
      // Return errors if any critical validation failed
      if (errors.length > 0 && processedEmployees.length === 0) {
        return res.status(400).json({
          message: "Import failed due to validation errors",
          errors,
          processed: 0,
          total: employeeData.length
        });
      }
      
      // Insert employees without manager references first
      let insertedEmployees = [];
      const employeesWithoutManagers = processedEmployees.map(emp => {
        const { managerName, ...employeeData } = emp;
        return employeeData;
      });
      
      if (employeesWithoutManagers.length > 0) {
        insertedEmployees = await db
          .insert(employees)
          .values(employeesWithoutManagers)
          .returning();
      }
      
      // Second pass: Update manager references
      const managerUpdates = [];
      for (let i = 0; i < processedEmployees.length; i++) {
        const processedEmp = processedEmployees[i];
        const insertedEmp = insertedEmployees[i];
        
        if (processedEmp.managerName && insertedEmp) {
          const managerName = processedEmp.managerName.toLowerCase().trim();
          
          // Try to find manager in existing employees first
          let managerId = employeeNameMap.get(managerName);
          
          // If not found in existing, try to find in current batch
          if (!managerId || managerId === 'pending') {
            const managerInBatch = insertedEmployees.find(emp => 
              emp.name.toLowerCase().trim() === managerName
            );
            if (managerInBatch) {
              managerId = managerInBatch.id;
            }
          }
          
          if (managerId && managerId !== 'pending') {
            managerUpdates.push({
              employeeId: insertedEmp.id,
              managerId: managerId
            });
          } else {
            errors.push(`Row ${i + 1}: Manager '${processedEmp.managerName}' not found`);
          }
        }
      }
      
      // Apply manager updates
      for (const update of managerUpdates) {
        await db
          .update(employees)
          .set({ directManagerId: update.managerId })
          .where(eq(employees.id, update.employeeId));
      }
      
      // Return comprehensive response
      res.status(201).json({
        message: `Successfully imported ${insertedEmployees.length} of ${employeeData.length} employees`,
        imported: insertedEmployees.length,
        total: employeeData.length,
        errors: errors.length > 0 ? errors : undefined,
        employees: insertedEmployees
      });
      
    } catch (error) {
      console.error("Error importing employees:", error);
      res.status(500).json({ 
        message: "Failed to import employees",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Categories endpoints
  app.get("/api/categories", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.organizationId, organizationId))
        .orderBy(desc(categories.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { name, type } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }
      
      const [newCategory] = await db
        .insert(categories)
        .values({
          name,
          type,
          organizationId,
        })
        .returning();
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Income endpoints
  app.get("/api/income", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const result = await db
        .select()
        .from(income)
        .where(eq(income.organizationId, organizationId))
        .orderBy(desc(income.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching income:", error);
      res.status(500).json({ message: "Failed to fetch income" });
    }
  });

  app.post("/api/income", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { amount, description, date, clientId, categoryId } = req.body;
      
      if (!amount || !date) {
        return res.status(400).json({ message: "Amount and date are required" });
      }
      
      const [newIncome] = await db
        .insert(income)
        .values({
          amount,
          description: description || null,
          date,
          clientId: clientId || null,
          categoryId: categoryId || null,
          organizationId,
        })
        .returning();
      
      res.status(201).json(newIncome);
    } catch (error) {
      console.error("Error creating income:", error);
      res.status(500).json({ message: "Failed to create income" });
    }
  });

  // Expenses endpoints
  app.get("/api/expenses", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const result = await db
        .select()
        .from(expenses)
        .where(eq(expenses.organizationId, organizationId))
        .orderBy(desc(expenses.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { amount, description, date, employeeId, categoryId } = req.body;
      
      if (!amount || !date) {
        return res.status(400).json({ message: "Amount and date are required" });
      }
      
      const [newExpense] = await db
        .insert(expenses)
        .values({
          amount,
          description: description || null,
          date,
          employeeId: employeeId || null,
          categoryId: categoryId || null,
          organizationId,
        })
        .returning();
      
      res.status(201).json(newExpense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Subscriptions endpoints
  app.get("/api/subscriptions", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const result = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, organizationId))
        .orderBy(desc(subscriptions.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { name, amount, billingCycle, nextDueDate } = req.body;
      
      if (!name || !amount || !billingCycle || !nextDueDate) {
        return res.status(400).json({ message: "Name, amount, billing cycle, and next due date are required" });
      }
      
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          name,
          amount,
          billingCycle,
          nextDueDate,
          organizationId,
        })
        .returning();
      
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}