import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  clients, employees, paymentSources, categories, 
  income, spending, subscriptions,
  insertClientSchema, insertEmployeeSchema, insertPaymentSourceSchema,
  insertCategorySchema, insertIncomeSchema, insertSpendingSchema,
  insertSubscriptionSchema
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// Mock authentication middleware (replace with actual auth)
const requireAuth = (req: any, res: any, next: any) => {
  // Mock organization ID for development
  req.user = { 
    organizationId: "550e8400-e29b-41d4-a716-446655440000",
    type: "internal"
  };
  next();
};

const requireClientAuth = (req: any, res: any, next: any) => {
  if (req.user?.type === "client") {
    req.isClientUser = true;
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // CLIENTS ROUTES
  app.get("/api/clients", requireAuth, async (req: any, res) => {
    try {
      const clientsList = await db.select()
        .from(clients)
        .where(eq(clients.organizationId, req.user.organizationId))
        .orderBy(desc(clients.createdAt));
      
      res.json(clientsList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertClientSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      const [newClient] = await db.insert(clients)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClientSchema.partial().parse(req.body);
      
      const [updatedClient] = await db.update(clients)
        .set(validatedData)
        .where(and(
          eq(clients.id, id),
          eq(clients.organizationId, req.user.organizationId)
        ))
        .returning();
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(clients)
        .where(and(
          eq(clients.id, id),
          eq(clients.organizationId, req.user.organizationId)
        ));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // EMPLOYEES ROUTES
  app.get("/api/employees", requireAuth, async (req: any, res) => {
    try {
      const employeesList = await db.select()
        .from(employees)
        .where(eq(employees.organizationId, req.user.organizationId))
        .orderBy(desc(employees.createdAt));
      
      res.json(employeesList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      const [newEmployee] = await db.insert(employees)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newEmployee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // PAYMENT SOURCES ROUTES
  app.get("/api/payment-sources", requireAuth, async (req: any, res) => {
    try {
      const sources = await db.select()
        .from(paymentSources)
        .where(eq(paymentSources.organizationId, req.user.organizationId))
        .orderBy(desc(paymentSources.createdAt));
      
      res.json(sources);
    } catch (error) {
      console.error("Error fetching payment sources:", error);
      res.status(500).json({ message: "Failed to fetch payment sources" });
    }
  });

  app.post("/api/payment-sources", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertPaymentSourceSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      const [newSource] = await db.insert(paymentSources)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newSource);
    } catch (error) {
      console.error("Error creating payment source:", error);
      res.status(500).json({ message: "Failed to create payment source" });
    }
  });

  // CATEGORIES ROUTES
  app.get("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const categoriesList = await db.select()
        .from(categories)
        .where(eq(categories.organizationId, req.user.organizationId))
        .orderBy(desc(categories.createdAt));
      
      res.json(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.parse({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      const [newCategory] = await db.insert(categories)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // INCOME ROUTES
  app.get("/api/income", requireAuth, requireClientAuth, async (req: any, res) => {
    try {
      let query = db.select({
        id: income.id,
        amount: income.amount,
        date: income.date,
        description: income.description,
        isRecurring: income.isRecurring,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email
        },
        paymentSource: {
          id: paymentSources.id,
          name: paymentSources.name,
          type: paymentSources.type
        },
        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type
        }
      })
      .from(income)
      .leftJoin(clients, eq(income.clientId, clients.id))
      .leftJoin(paymentSources, eq(income.paymentSourceId, paymentSources.id))
      .leftJoin(categories, eq(income.categoryId, categories.id))
      .where(eq(income.organizationId, req.user.organizationId));

      // If client user, filter by their client_id
      if (req.isClientUser && req.user.clientId) {
        query = query.where(eq(income.clientId, req.user.clientId));
      }

      const incomeList = await query.orderBy(desc(income.date));
      
      res.json(incomeList);
    } catch (error) {
      console.error("Error fetching income:", error);
      res.status(500).json({ message: "Failed to fetch income" });
    }
  });

  app.post("/api/income", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertIncomeSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      const [newIncome] = await db.insert(income)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newIncome);
    } catch (error) {
      console.error("Error creating income:", error);
      res.status(500).json({ message: "Failed to create income" });
    }
  });

  // SPENDING ROUTES
  app.get("/api/spending", requireAuth, requireClientAuth, async (req: any, res) => {
    try {
      let query = db.select({
        id: spending.id,
        amount: spending.amount,
        date: spending.date,
        notes: spending.notes,
        employee: {
          id: employees.id,
          name: employees.name,
          jobTitle: employees.jobTitle
        },
        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type
        }
      })
      .from(spending)
      .leftJoin(employees, eq(spending.employeeId, employees.id))
      .leftJoin(categories, eq(spending.categoryId, categories.id))
      .where(eq(spending.organizationId, req.user.organizationId));

      // Client users see limited spending data
      if (req.isClientUser) {
        // Could filter spending related to client projects, etc.
      }

      const spendingList = await query.orderBy(desc(spending.date));
      
      res.json(spendingList);
    } catch (error) {
      console.error("Error fetching spending:", error);
      res.status(500).json({ message: "Failed to fetch spending" });
    }
  });

  app.post("/api/spending", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertSpendingSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      const [newSpending] = await db.insert(spending)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newSpending);
    } catch (error) {
      console.error("Error creating spending:", error);
      res.status(500).json({ message: "Failed to create spending" });
    }
  });

  // SUBSCRIPTIONS ROUTES
  app.get("/api/subscriptions", requireAuth, async (req: any, res) => {
    try {
      const subscriptionsList = await db.select({
        id: subscriptions.id,
        name: subscriptions.name,
        amount: subscriptions.amount,
        billingCycle: subscriptions.billingCycle,
        nextDueDate: subscriptions.nextDueDate,
        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type
        }
      })
      .from(subscriptions)
      .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
      .where(eq(subscriptions.organizationId, req.user.organizationId))
      .orderBy(desc(subscriptions.nextDueDate));
      
      res.json(subscriptionsList);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      const [newSubscription] = await db.insert(subscriptions)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // DASHBOARD STATS
  app.get("/api/dashboard/stats", requireAuth, requireClientAuth, async (req: any, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Get income stats
      let incomeQuery = db.select()
        .from(income)
        .where(eq(income.organizationId, req.user.organizationId));
      
      if (req.isClientUser && req.user.clientId) {
        incomeQuery = incomeQuery.where(eq(income.clientId, req.user.clientId));
      }
      
      const incomeData = await incomeQuery;
      
      // Get spending stats  
      const spendingData = await db.select()
        .from(spending)
        .where(eq(spending.organizationId, req.user.organizationId));
      
      // Calculate totals
      const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const totalSpending = spendingData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const monthlyIncome = incomeData
        .filter(item => item.date.startsWith(currentMonth))
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const monthlySpending = spendingData
        .filter(item => item.date.startsWith(currentMonth))
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);
      
      res.json({
        totalIncome,
        totalSpending,
        monthlyIncome,
        monthlySpending,
        netIncome: totalIncome - totalSpending,
        monthlyNet: monthlyIncome - monthlySpending
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}