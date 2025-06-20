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
import { eq, sum, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

// Mock auth middleware for now
function mockAuth(req: any, res: any, next: any) {
  req.user = { organizationId: "test-org-id" };
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
      const { name, email, position } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const [newEmployee] = await db
        .insert(employees)
        .values({
          name,
          email: email || null,
          position: position || null,
          organizationId,
        })
        .returning();
      
      res.status(201).json(newEmployee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
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
          id: randomUUID(),
          name,
          amount,
          billingCycle,
          nextDueDate,
          organizationId,
          createdAt: new Date(),
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