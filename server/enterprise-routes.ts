import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { 
  authenticateToken, 
  requireRole,
  type AuthRequest, 
  login, 
  signup, 
  logout, 
  getCurrentUser,
  inviteUser,
  acceptInvitation
} from "./enterprise-auth";
import { db } from "./db";
import { 
  organizations, 
  users, 
  userInvitations,
  categories, 
  clients, 
  employees, 
  developers,
  income,
  spending,
  subscriptions,
  paymentSources
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Authentication routes (unprotected)
  app.post("/api/auth/login", login);
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/logout", logout);
  app.post("/api/auth/accept-invitation", acceptInvitation);

  // Protected authentication routes
  app.get("/api/auth/me", authenticateToken, getCurrentUser);
  app.post("/api/auth/invite", authenticateToken, requireRole("admin", "super_admin"), inviteUser);

  // User management routes
  app.get("/api/users", authenticateToken, requireRole("admin", "super_admin"), async (req: AuthRequest, res) => {
    try {
      const organizationUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.organizationId, req.user!.organizationId));

      res.json(organizationUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/invitations", authenticateToken, requireRole("admin", "super_admin"), async (req: AuthRequest, res) => {
    try {
      const invitations = await db
        .select()
        .from(userInvitations)
        .where(eq(userInvitations.organizationId, req.user!.organizationId));

      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Organization management routes
  app.get("/api/organization", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, req.user!.organizationId));

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Categories routes - filtered by organization
  app.get("/api/categories", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.organizationId, req.user!.organizationId));

      res.json(orgCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, type, parentId } = req.body;

      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }

      const [category] = await db
        .insert(categories)
        .values({
          organizationId: req.user!.organizationId,
          name,
          type,
          parentId: parentId || null,
          createdBy: req.user!.id,
        })
        .returning();

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Clients routes - filtered by organization
  app.get("/api/clients", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgClients = await db
        .select()
        .from(clients)
        .where(eq(clients.organizationId, req.user!.organizationId));

      res.json(orgClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      const [client] = await db
        .insert(clients)
        .values({
          organizationId: req.user!.organizationId,
          name,
          email,
          archived: false,
          createdBy: req.user!.id,
        })
        .returning();

      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Employees routes - filtered by organization
  app.get("/api/employees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgEmployees = await db
        .select()
        .from(employees)
        .where(eq(employees.organizationId, req.user!.organizationId));

      res.json(orgEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, birthDate, jobTitle, seniority, paymentAmount } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const [employee] = await db
        .insert(employees)
        .values({
          organizationId: req.user!.organizationId,
          name,
          birthDate: birthDate ? new Date(birthDate) : null,
          jobTitle,
          seniority,
          paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null,
          archived: false,
          createdBy: req.user!.id,
        })
        .returning();

      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Income routes - filtered by organization
  app.get("/api/income", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgIncome = await db
        .select()
        .from(income)
        .where(eq(income.organizationId, req.user!.organizationId));

      res.json(orgIncome);
    } catch (error) {
      console.error("Error fetching income:", error);
      res.status(500).json({ message: "Failed to fetch income" });
    }
  });

  // Spending routes - filtered by organization
  app.get("/api/spending", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgSpending = await db
        .select()
        .from(spending)
        .where(eq(spending.organizationId, req.user!.organizationId));

      res.json(orgSpending);
    } catch (error) {
      console.error("Error fetching spending:", error);
      res.status(500).json({ message: "Failed to fetch spending" });
    }
  });

  // Subscriptions routes - filtered by organization
  app.get("/api/subscriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, req.user!.organizationId));

      res.json(orgSubscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Payment Sources routes - filtered by organization
  app.get("/api/payment-sources", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgPaymentSources = await db
        .select()
        .from(paymentSources)
        .where(eq(paymentSources.organizationId, req.user!.organizationId));

      res.json(orgPaymentSources);
    } catch (error) {
      console.error("Error fetching payment sources:", error);
      res.status(500).json({ message: "Failed to fetch payment sources" });
    }
  });

  app.post("/api/payment-sources", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, type, details } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const [paymentSource] = await db
        .insert(paymentSources)
        .values({
          organizationId: req.user!.organizationId,
          name,
          type: type || null,
          details: details || null,
          archived: false,
          createdBy: req.user!.id,
        })
        .returning();

      res.status(201).json(paymentSource);
    } catch (error) {
      console.error("Error creating payment source:", error);
      res.status(500).json({ message: "Failed to create payment source" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}