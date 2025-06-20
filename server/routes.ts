import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  clients, 
  employees, 
  categories, 
  income, 
  expenses, 
  subscriptions,
  paymentSources,
  users,
  userInvitations,
  insertIncomeSchema,
  insertExpenseSchema,
  insertPaymentSourceSchema,
  insertClientPermissionsSchema,
  clientAuthRequestSchema,
  insertSubscriptionSchema,
  insertUserInvitationSchema,
  updateUserRoleSchema,
  updateUserStatusSchema
} from "@shared/schema";
import { storage } from "./storage";
import { eq, sum, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendInvitationEmail } from "./emailService";

// Mock auth middleware for now
function mockAuth(req: any, res: any, next: any) {
  req.user = { 
    id: "owner-user-id",
    email: "jay@dartnox.com",
    organizationId: "2723d846-8be7-4d00-9892-ea199b74d73d" 
  };
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
      name: ['name', 'fullname', 'employeename', 'workerfullname'],
      email: ['email', 'emailaddress', 'personalemail'],
      position: ['position', 'jobtitle', 'title', 'role'],
      country: ['country', 'location', 'region', 'countryofresidence'],
      startDate: ['startdate', 'startdt', 'hiredate', 'joiningdate'],
      endDate: ['enddate', 'enddt', 'terminationdate', 'leavingdate'],
      birthDate: ['birthdate', 'dateofbirth', 'dob'],
      seniorityLevel: ['senioritylevel', 'level', 'grade', 'seniority'],
      paymentAmount: ['paymentamount', 'salary', 'compensation', 'pay', 'amount', 'payment'],
      directManagerName: ['directmanagername', 'manager', 'supervisor', 'directmanager', 'managername'],
      groupName: ['groupname', 'group', 'department', 'team', 'division'],
      status: ['status', 'employmentstatus', 'state']
    };
    
    // Normalize row keys for case-insensitive matching
    const normalizedRow: any = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');
      normalizedRow[normalizedKey] = row[key];
    });
    
    // Map fields using variations
    Object.entries(fieldMappings).forEach(([targetField, variations]) => {
      for (const variation of variations) {
        const normalizedVariation = variation.toLowerCase().replace(/[_\s-]/g, '');
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
        
        // Set default start date if missing (not strictly required for import)
        if (!processedEmployee.startDate) {
          processedEmployee.startDate = new Date().toISOString().split('T')[0]; // Default to today
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

  // Client CSV Import endpoint
  app.post("/api/clients/import", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const { clients: clientData } = req.body;
      
      if (!Array.isArray(clientData) || clientData.length === 0) {
        return res.status(400).json({ 
          message: "Invalid client data",
          details: "Expected an array of client records"
        });
      }
      
      const processedClients = [];
      const errors = [];
      
      for (let i = 0; i < clientData.length; i++) {
        const rawRow = clientData[i];
        
        // Validate required fields
        const name = rawRow.name?.toString().trim();
        
        if (!name) {
          errors.push(`Row ${i + 1}: Missing required field 'name'`);
          continue;
        }
        
        // Check for duplicates by name + email combination
        const email = rawRow.email?.toString().trim() || "";
        const existingClient = await storage.getClientByEmail(email);
        
        if (existingClient && existingClient.name.toLowerCase() === name.toLowerCase()) {
          errors.push(`Row ${i + 1}: Client '${name}' with email '${email}' already exists`);
          continue;
        }
        
        try {
          // Sanitize and prepare client data
          const clientRecord = {
            name: name,
            email: email || "",
            phone: rawRow.phone?.toString().trim() || "",
            website: rawRow.website?.toString().trim() || "",
            address: rawRow.address?.toString().trim() || "",
            industry: rawRow.industry?.toString().trim() || "",
            contactName: rawRow.contactName?.toString().trim() || "",
            contactEmail: rawRow.contactEmail?.toString().trim() || "",
            organizationId: organizationId,
          };
          
          const newClient = await storage.createClient(clientRecord);
          processedClients.push(newClient);
          
          // Create default permissions for the client
          await storage.upsertClientPermissions({
            clientId: newClient.id,
            showIncomeGraph: true,
            showCategoryBreakdown: true,
            showPaymentHistory: true,
            showInvoices: false,
            organizationId: organizationId,
          });
          
        } catch (insertError) {
          console.error(`Error inserting client ${name}:`, insertError);
          errors.push(`Row ${i + 1}: Failed to create client '${name}' - ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
        }
      }
      
      res.status(200).json({
        message: `Successfully imported ${processedClients.length} of ${clientData.length} clients`,
        imported: processedClients.length,
        total: clientData.length,
        errors: errors.length > 0 ? errors : undefined,
        clients: processedClients
      });
      
    } catch (error) {
      console.error("Error importing clients:", error);
      res.status(500).json({ 
        message: "Failed to import clients",
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

  // Income routes
  app.get("/api/income", mockAuth, async (req: any, res) => {
    try {
      const incomeRecords = await storage.getIncome();
      const clientsData = await storage.getClients();
      const paymentSourcesData = await storage.getPaymentSources();
      const categoriesData = await storage.getCategories();

      const enrichedIncome = incomeRecords.map(record => ({
        ...record,
        clientName: clientsData.find(c => c.id === record.clientId)?.name || 'Unknown',
        paymentSourceName: paymentSourcesData.find(p => p.id === record.paymentSourceId)?.name || 'Unknown',
        categoryName: categoriesData.find(c => c.id === record.categoryId)?.name || 'Unknown'
      }));

      res.json(enrichedIncome);
    } catch (error) {
      console.error("Error fetching income:", error);
      res.status(500).json({ message: "Failed to fetch income" });
    }
  });

  app.post("/api/income", mockAuth, async (req: any, res) => {
    try {
      const validatedData = insertIncomeSchema.parse(req.body);
      const incomeData = {
        ...validatedData,
        amount: validatedData.amount,
        organizationId: req.user.organizationId
      };
      const newIncome = await storage.createIncome(incomeData);
      res.status(201).json(newIncome);
    } catch (error) {
      console.error("Error creating income:", error);
      res.status(500).json({ message: "Failed to create income" });
    }
  });

  app.put("/api/income/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertIncomeSchema.partial().parse(req.body);
      const updatedIncome = await storage.updateIncome(id, validatedData);
      if (!updatedIncome) {
        return res.status(404).json({ message: "Income not found" });
      }
      res.json(updatedIncome);
    } catch (error) {
      console.error("Error updating income:", error);
      res.status(500).json({ message: "Failed to update income" });
    }
  });

  app.delete("/api/income/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteIncome(id);
      if (!deleted) {
        return res.status(404).json({ message: "Income not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting income:", error);
      res.status(500).json({ message: "Failed to delete income" });
    }
  });

  // Income CSV Import endpoint
  app.post("/api/income/import", mockAuth, async (req: any, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }

      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must contain headers and at least one data row" });
      }

      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
      const dataLines = lines.slice(1);

      let imported = 0;
      let errors = 0;
      const errorMessages: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map((v: string) => v.trim());
          const row: any = {};

          headers.forEach((header: string, index: number) => {
            const value = values[index] || '';
            row[header] = value;
          });

          // Helper function to parse boolean values
          function parseBooleanValue(value: string | boolean): boolean {
            if (typeof value === 'boolean') return value;
            if (!value) return false;
            
            const normalized = value.toString().toLowerCase().trim();
            return ['true', 't', 'yes', 'y', '1', 'on'].includes(normalized);
          }

          // Map CSV fields to database fields
          const incomeData: any = {
            organizationId: req.user.organizationId,
            amount: sanitizePaymentAmount(row.amount || '0'),
            currency: row.currency || 'USD',
            date: parseFlexibleDate(row.date) || new Date().toISOString().split('T')[0],
            description: row.description || '',
            status: ['paid', 'pending', 'failed'].includes(row.status) ? row.status : 'paid',
            isRecurring: parseBooleanValue(row.is_recurring),
            invoiceId: row.invoice_id || null,
            clientId: row.client_id || null,
            paymentSourceId: row.payment_source_id || null,
          };

          // Handle recurring frequency (always include if provided, regardless of isRecurring)
          if (row.recurring_frequency) {
            const validFrequencies = ['weekly', 'monthly', 'quarterly', 'bi-annual', 'yearly'];
            if (validFrequencies.includes(row.recurring_frequency.toLowerCase())) {
              incomeData.recurringFrequency = row.recurring_frequency.toLowerCase();
            }
          }

          // Handle recurring end date (always include if provided)
          if (row.recurring_end_date) {
            const endDate = parseFlexibleDate(row.recurring_end_date);
            if (endDate) {
              incomeData.recurringEndDate = endDate;
            }
          }

          // Find category by name
          if (row.category) {
            const categories = await storage.getCategories();
            const category = categories.find((c: any) => 
              c.name.toLowerCase() === row.category.toLowerCase() && c.type === 'income'
            );
            if (category) {
              incomeData.categoryId = category.id;
            }
          }

          // Find client by name or ID
          if (row.client_id) {
            const clients = await storage.getClients();
            const client = clients.find((c: any) => 
              c.id === row.client_id || c.name.toLowerCase() === row.client_id.toLowerCase()
            );
            if (client) {
              incomeData.clientId = client.id;
            }
          }

          // Find payment source by name or ID
          if (row.payment_source_id) {
            const paymentSources = await storage.getPaymentSources();
            const paymentSource = paymentSources.find((p: any) => 
              p.id === row.payment_source_id || p.name.toLowerCase() === row.payment_source_id.toLowerCase()
            );
            if (paymentSource) {
              incomeData.paymentSourceId = paymentSource.id;
            }
          }

          await storage.createIncome(incomeData);
          imported++;
        } catch (error) {
          errors++;
          errorMessages.push(`Row ${i + 2}: ${error}`);
        }
      }

      res.json({
        imported,
        errors,
        total: dataLines.length,
        errorMessages: errorMessages.slice(0, 10) // Limit error messages
      });
    } catch (error) {
      console.error("Error importing income CSV:", error);
      res.status(500).json({ message: "Failed to import income CSV" });
    }
  });

  app.post("/api/income/import", mockAuth, async (req: any, res) => {
    try {
      const { income: incomeData } = req.body;
      
      if (!Array.isArray(incomeData)) {
        return res.status(400).json({ message: "Income data must be an array" });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < incomeData.length; i++) {
        const row = incomeData[i];
        
        try {
          // Validate required fields
          const amount = sanitizePaymentAmount(row.amount?.toString() || '');
          const date = parseFlexibleDate(row.date?.toString() || '');
          
          if (!amount || amount <= 0) {
            errors.push(`Row ${i + 1}: Invalid amount "${row.amount}"`);
            continue;
          }
          
          if (!date) {
            errors.push(`Row ${i + 1}: Invalid date "${row.date}"`);
            continue;
          }

          // Validate enum fields
          const status = row.status?.toString().toLowerCase();
          const validStatuses = ['pending', 'paid', 'failed'];
          const finalStatus = validStatuses.includes(status) ? status : 'paid';

          const frequency = row.recurringFrequency?.toString().toLowerCase();
          const validFrequencies = ['weekly', 'monthly', 'quarterly', 'bi-annual', 'yearly'];
          const finalFrequency = validFrequencies.includes(frequency) ? frequency : null;

          // Parse recurring end date
          const recurringEndDate = row.recurringEndDate ? parseFlexibleDate(row.recurringEndDate.toString()) : null;

          // Prepare income data
          const incomeRecord = {
            amount: amount.toString(),
            date,
            description: normalizeText(row.description?.toString() || ''),
            status: finalStatus,
            invoiceId: normalizeText(row.invoiceId?.toString() || ''),
            currency: (row.currency?.toString() || 'USD').toUpperCase().slice(0, 3),
            isRecurring: Boolean(row.isRecurring || finalFrequency),
            recurringFrequency: finalFrequency,
            recurringEndDate,
            organizationId: req.user.organizationId
          };

          const created = await storage.createIncome(incomeRecord);
          results.push(created);
          
        } catch (rowError) {
          console.error(`Error processing row ${i + 1}:`, rowError);
          errors.push(`Row ${i + 1}: ${rowError.message}`);
        }
      }

      res.status(201).json({
        message: `Successfully imported ${results.length} of ${incomeData.length} income records`,
        imported: results.length,
        total: incomeData.length,
        errors,
        income: results
      });
      
    } catch (error) {
      console.error("Error importing income:", error);
      res.status(500).json({ message: "Failed to import income" });
    }
  });

  // Income CSV import
  app.post("/api/income/import", mockAuth, async (req: any, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid CSV data" });
      }

      const clients = await storage.getClients();
      const paymentSources = await storage.getPaymentSources();
      const categories = await storage.getCategories();
      const organizationId = req.user.organizationId;

      const results = [];
      const errors = [];

      for (const [index, row] of csvData.entries()) {
        try {
          const amount = sanitizePaymentAmount(row.amount || "0");
          const date = parseFlexibleDate(row.date);
          
          if (!date) {
            errors.push(`Row ${index + 1}: Invalid date format`);
            continue;
          }

          // Find client by name
          const client = clients.find(c => 
            normalizeText(c.name) === normalizeText(row.client_name || row.clientName || "")
          );

          // Find payment source by name
          const paymentSource = paymentSources.find(p => 
            normalizeText(p.name) === normalizeText(row.payment_source_name || row.paymentSourceName || "")
          );

          // Find category by name (income type)
          const category = categories.find(c => 
            c.type === 'income' && 
            normalizeText(c.name) === normalizeText(row.category_name || row.categoryName || "")
          );

          const incomeData = {
            amount: amount.toString(),
            date,
            clientId: client?.id,
            paymentSourceId: paymentSource?.id,
            categoryId: category?.id,
            description: row.description || "",
            isRecurring: row.is_recurring === "true" || row.isRecurring === true,
            organizationId
          };

          const created = await storage.createIncome(incomeData);
          results.push(created);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }

      res.json({ 
        imported: results.length, 
        errors: errors.length,
        errorDetails: errors 
      });
    } catch (error) {
      console.error("Error importing income:", error);
      res.status(500).json({ message: "Failed to import income" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", mockAuth, async (req: any, res) => {
    try {
      const expenseRecords = await storage.getExpenses();
      const employeesData = await storage.getEmployees();
      const categoriesData = await storage.getCategories();

      const enrichedExpenses = expenseRecords.map(record => ({
        ...record,
        employeeName: employeesData.find(e => e.id === record.employeeId)?.name || 'Unknown',
        categoryName: categoriesData.find(c => c.id === record.categoryId)?.name || 'Unknown'
      }));

      res.json(enrichedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", mockAuth, async (req: any, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expenseData = {
        ...validatedData,
        amount: validatedData.amount,
        organizationId: req.user.organizationId
      };
      const newExpense = await storage.createExpense(expenseData);
      res.status(201).json(newExpense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const updatedExpense = await storage.updateExpense(id, validatedData);
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Expenses CSV import
  app.post("/api/expenses/import", mockAuth, async (req: any, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid CSV data" });
      }

      const employees = await storage.getEmployees();
      const categories = await storage.getCategories();
      const organizationId = req.user.organizationId;

      const results = [];
      const errors = [];

      for (const [index, row] of csvData.entries()) {
        try {
          const amount = sanitizePaymentAmount(row.amount || "0");
          const date = parseFlexibleDate(row.date);
          
          if (!date) {
            errors.push(`Row ${index + 1}: Invalid date format`);
            continue;
          }

          // Find employee by name
          const employee = employees.find(e => 
            normalizeText(e.name) === normalizeText(row.employee_name || row.employeeName || "")
          );

          // Find category by name (expense type)
          const category = categories.find(c => 
            c.type === 'expense' && 
            normalizeText(c.name) === normalizeText(row.category_name || row.categoryName || "")
          );

          const expenseData = {
            amount: amount.toString(),
            date,
            employeeId: employee?.id,
            categoryId: category?.id,
            description: row.description || "",
            organizationId
          };

          const created = await storage.createExpense(expenseData);
          results.push(created);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }

      res.json({ 
        imported: results.length, 
        errors: errors.length,
        errorDetails: errors 
      });
    } catch (error) {
      console.error("Error importing expenses:", error);
      res.status(500).json({ message: "Failed to import expenses" });
    }
  });

  // Payment Sources routes
  app.get("/api/payment-sources", mockAuth, async (req: any, res) => {
    try {
      const paymentSources = await storage.getPaymentSources();
      res.json(paymentSources);
    } catch (error) {
      console.error("Error fetching payment sources:", error);
      res.status(500).json({ message: "Failed to fetch payment sources" });
    }
  });

  app.post("/api/payment-sources", mockAuth, async (req: any, res) => {
    try {
      const validatedData = insertPaymentSourceSchema.parse(req.body);
      const paymentSourceData = {
        ...validatedData,
        organizationId: req.user.organizationId
      };
      const newPaymentSource = await storage.createPaymentSource(paymentSourceData);
      res.status(201).json(newPaymentSource);
    } catch (error) {
      console.error("Error creating payment source:", error);
      res.status(500).json({ message: "Failed to create payment source" });
    }
  });

  // Client authentication and dashboard routes
  app.post("/api/client-auth/request", async (req, res) => {
    try {
      const { email } = clientAuthRequestSchema.parse(req.body);
      
      const client = await storage.getClientByEmail(email);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const authToken = await storage.createClientAuthToken(client.id, email);
      
      // In a real application, you would send this token via email
      // For demo purposes, we return it in the response
      res.json({ 
        message: "Authentication token created", 
        token: authToken.token,
        expiresAt: authToken.expiresAt 
      });
    } catch (error) {
      console.error("Error creating client auth token:", error);
      res.status(500).json({ message: "Failed to create authentication token" });
    }
  });

  app.post("/api/client-auth/verify", async (req, res) => {
    try {
      const { token } = req.body;
      
      const client = await storage.getClientByToken(token);
      if (!client) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Don't mark token as used immediately - allow multiple dashboard accesses
      // await storage.markTokenAsUsed(token);
      
      // Get complete dashboard data
      const permissions = await storage.getClientPermissions(client.id);
      const incomeRecords = await storage.getIncome();
      const categories = await storage.getCategories();

      // Filter income records for this client
      const clientIncome = incomeRecords.filter(income => income.clientId === client.id);
      
      // Calculate totals and statistics
      const totalIncome = clientIncome.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const monthlyIncome = clientIncome
        .filter(income => {
          const incomeDate = new Date(income.date);
          const now = new Date();
          return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, income) => sum + parseFloat(income.amount), 0);

      // Calculate category breakdown
      const categoryBreakdown = categories.map(category => {
        const categoryIncome = clientIncome.filter(income => income.categoryId === category.id);
        const amount = categoryIncome.reduce((sum, income) => sum + parseFloat(income.amount), 0);
        const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
        return {
          name: category.name,
          amount,
          percentage: Math.round(percentage * 100) / 100
        };
      }).filter(cat => cat.amount > 0);

      res.json({
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          website: client.website,
          industry: client.industry
        },
        permissions: permissions || {
          showIncomeGraph: true,
          showCategoryBreakdown: true,
          showPaymentHistory: true,
          showInvoices: false
        },
        dashboard: {
          totalIncome,
          monthlyIncome,
          totalTransactions: clientIncome.length,
          categoryBreakdown,
          recentTransactions: clientIncome
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map(income => ({
              id: income.id,
              date: income.date,
              amount: `$${parseFloat(income.amount).toFixed(2)}`,
              description: income.description || 'Income transaction',
              status: income.status || 'paid'
            }))
        }
      });
    } catch (error) {
      console.error("Error verifying client token:", error);
      res.status(500).json({ message: "Failed to verify token" });
    }
  });

  app.get("/api/client-dashboard/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const permissions = await storage.getClientPermissions(clientId);
      const incomeRecords = await storage.getIncome();
      const categories = await storage.getCategories();

      // Filter income records for this client
      const clientIncome = incomeRecords.filter(income => income.clientId === clientId);
      
      // Calculate totals and statistics
      const totalIncome = clientIncome.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const monthlyIncome = clientIncome
        .filter(income => {
          const incomeDate = new Date(income.date);
          const now = new Date();
          return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, income) => sum + parseFloat(income.amount), 0);

      // Category breakdown
      const categoryBreakdown = categories.map(category => {
        const categoryIncome = clientIncome
          .filter(income => income.categoryId === category.id)
          .reduce((sum, income) => sum + parseFloat(income.amount), 0);
        return {
          name: category.name,
          amount: categoryIncome,
          percentage: totalIncome > 0 ? (categoryIncome / totalIncome) * 100 : 0
        };
      }).filter(cat => cat.amount > 0);

      res.json({
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          industry: client.industry
        },
        permissions: permissions || {
          showIncomeGraph: true,
          showCategoryBreakdown: true,
          showPaymentHistory: true,
          showInvoices: false
        },
        dashboard: {
          totalIncome,
          monthlyIncome,
          totalTransactions: clientIncome.length,
          categoryBreakdown,
          recentTransactions: clientIncome
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
        }
      });
    } catch (error) {
      console.error("Error fetching client dashboard:", error);
      res.status(500).json({ message: "Failed to fetch client dashboard" });
    }
  });

  app.put("/api/client-permissions/:clientId", mockAuth, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const permissionsData = insertClientPermissionsSchema.parse(req.body);
      
      const permissions = await storage.upsertClientPermissions({
        ...permissionsData,
        clientId,
        organizationId: req.user.organizationId
      });
      
      res.json(permissions);
    } catch (error) {
      console.error("Error updating client permissions:", error);
      res.status(500).json({ message: "Failed to update client permissions" });
    }
  });

  // Email-based client auth token request
  app.post("/api/client-auth/request-by-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const client = await storage.getClientByEmail(email);
      if (!client) {
        return res.status(404).json({ message: "No client found with this email address" });
      }
      
      const authToken = await storage.createClientAuthToken(client.id, email);
      
      // In a real application, you would send this token via email
      // For demo purposes, we return it in the response
      res.json({ 
        message: "Access token sent to your email", 
        token: authToken.token,
        expiresAt: authToken.expiresAt 
      });
    } catch (error) {
      console.error("Error creating client auth token by email:", error);
      res.status(500).json({ message: "Failed to send access token" });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteClient(id);
      
      if (success) {
        res.json({ message: "Client deleted successfully" });
      } else {
        res.status(404).json({ message: "Client not found" });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Subscription routes
  app.get("/api/subscriptions", mockAuth, async (req: any, res) => {
    try {
      const subscriptionRecords = await storage.getSubscriptions();
      const clientsData = await storage.getClients();
      const employeesData = await storage.getEmployees();
      const categoriesData = await storage.getCategories();
      const paymentSourcesData = await storage.getPaymentSources();

      const enrichedSubscriptions = subscriptionRecords.map(record => ({
        ...record,
        clientName: record.clientId ? clientsData.find(c => c.id === record.clientId)?.name || 'Unknown' : null,
        employeeName: record.employeeId ? employeesData.find(e => e.id === record.employeeId)?.fullName || 'Unknown' : null,
        categoryName: record.categoryId ? categoriesData.find(c => c.id === record.categoryId)?.name || 'Unknown' : null,
        paymentSourceName: record.paymentSourceId ? paymentSourcesData.find(p => p.id === record.paymentSourceId)?.name || 'Unknown' : null
      }));

      res.json(enrichedSubscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", mockAuth, async (req: any, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscriptionData = {
        ...validatedData,
        organizationId: req.user.organizationId
      };
      const newSubscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.put("/api/subscriptions/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSubscriptionSchema.partial().parse(req.body);
      const updatedSubscription = await storage.updateSubscription(id, validatedData);
      if (!updatedSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteSubscription(id);
      
      if (success) {
        res.json({ message: "Subscription deleted successfully" });
      } else {
        res.status(404).json({ message: "Subscription not found" });
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  // Ensure owner user exists
  app.post("/api/users/owner/ensure", mockAuth, async (req: any, res) => {
    try {
      const { id: userId, email, organizationId } = req.user;
      
      // Check if owner already exists
      const existingUser = await storage.getUser(userId);
      if (existingUser) {
        return res.json({ message: "Owner already exists", user: existingUser });
      }
      
      // Create owner user
      const ownerUser = {
        id: userId,
        email: email,
        name: "Jay (Owner)",
        profileImageUrl: "",
        organizationId: organizationId,
        role: "super_admin" as const,
        type: "internal" as const,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };
      
      await db.insert(users).values(ownerUser);
      res.json({ message: "Owner user created", user: ownerUser });
    } catch (error) {
      console.error("Error ensuring owner user:", error);
      res.status(500).json({ message: "Failed to ensure owner user" });
    }
  });

  // User Management API Routes
  app.get("/api/users", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const users = await storage.getUsers(organizationId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users/invite", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const invitedById = req.user.id || "mock-user-id";
      
      const validatedData = insertUserInvitationSchema.parse(req.body);
      
      // Check if user already exists or has pending invitation
      const existingUsers = await storage.getUsers(organizationId);
      const existingInvitations = await storage.getUserInvitations(organizationId);
      
      const emailExists = existingUsers.some(user => user.email === validatedData.email) ||
                         existingInvitations.some(inv => inv.email === validatedData.email && inv.status === 'pending');
      
      if (emailExists) {
        return res.status(400).json({ message: "User with this email already exists or has a pending invitation" });
      }
      
      const invitation = await storage.createUserInvitation(validatedData, invitedById, organizationId);
      
      // Send invitation email
      const emailSent = await sendInvitationEmail(
        validatedData.email,
        "Jay (Owner)", // In real app, get from authenticated user
        validatedData.role,
        validatedData.type,
        invitation.token,
        "DartNox"
      );
      
      if (!emailSent) {
        console.error(`Failed to send email to ${validatedData.email}`);
        // Still return success since invitation was created in database
      }
      
      res.json({ 
        message: emailSent ? "Invitation sent successfully" : "Invitation created but email failed to send", 
        invitation,
        emailSent 
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  app.put("/api/users/:id/role", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserRoleSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserRole(id, validatedData);
      
      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put("/api/users/:id/status", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserStatusSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserStatus(id, validatedData);
      
      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.delete("/api/users/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User Invitations API Routes
  app.get("/api/user-invitations", mockAuth, async (req: any, res) => {
    try {
      const organizationId = req.user.organizationId;
      const invitations = await storage.getUserInvitations(organizationId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/user-invitations/:id/resend", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const organizationId = req.user.organizationId;
      const invitedById = req.user.id || "mock-user-id";
      
      // Get existing invitation
      const invitations = await storage.getUserInvitations(organizationId);
      const existingInvitation = invitations.find(inv => inv.id === id);
      
      if (!existingInvitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Create new invitation with same details
      const newInvitation = await storage.createUserInvitation(
        {
          email: existingInvitation.email,
          role: existingInvitation.role,
          type: existingInvitation.type,
        },
        invitedById,
        organizationId
      );
      
      // Send invitation email
      const emailSent = await sendInvitationEmail(
        existingInvitation.email,
        "Jay (Owner)", // In real app, get from authenticated user
        existingInvitation.role,
        existingInvitation.type,
        newInvitation.token,
        "DartNox"
      );
      
      if (!emailSent) {
        console.error(`Failed to send email to ${existingInvitation.email}`);
      }
      
      // Mark old invitation as cancelled
      await storage.updateInvitationStatus(id, "cancelled");
      
      res.json({ 
        message: emailSent ? "Invitation resent successfully" : "Invitation created but email failed to send", 
        invitation: newInvitation,
        emailSent 
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  app.delete("/api/user-invitations/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteInvitation(id);
      
      if (success) {
        res.json({ message: "Invitation cancelled successfully" });
      } else {
        res.status(404).json({ message: "Invitation not found" });
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  // Accept invitation endpoint (Step 3 of QA)
  app.get("/api/invitations/verify/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invite link" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation already processed" });
      }
      
      if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ message: "Link expired" });
      }
      
      res.json({ invitation: { email: invitation.email, role: invitation.role, type: invitation.type } });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  });

  app.post("/api/invitations/accept/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      const { password, name } = req.body;
      
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invite link" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation already processed" });
      }
      
      if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ message: "Link expired" });
      }
      
      // Create user account
      const userId = randomUUID();
      const newUser = {
        id: userId,
        email: invitation.email,
        name: name || invitation.email.split('@')[0],
        role: invitation.role,
        type: invitation.type,
        status: "active" as const,
        organizationId: invitation.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImageUrl: "",
        lastLoginAt: new Date()
      };
      
      // Insert user into database
      await db.insert(users).values(newUser);
      
      // Mark invitation as accepted
      await storage.updateInvitationStatus(invitation.id, "accepted");
      
      const redirectUrl = invitation.type === "internal" ? "/dashboard" : "/client-dashboard";
      
      res.json({ 
        message: "Account created successfully", 
        user: { id: userId, email: newUser.email, role: newUser.role, type: newUser.type },
        redirectUrl 
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}