import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { 
  authenticateToken, 
  type AuthRequest, 
  login, 
  signup, 
  logout, 
  getCurrentUser
} from "./enterprise-auth";
import { db } from "./db";
import { 
  categories, 
  clients, 
  employees
} from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Authentication routes (unprotected)
  app.post("/api/auth/login", login);
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/logout", logout);

  // Protected authentication routes
  app.get("/api/auth/user", authenticateToken, getCurrentUser);

  // Basic protected routes for testing
  app.get("/api/categories", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allCategories = await db.select().from(categories).limit(10);
      res.json(allCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/clients", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allClients = await db.select().from(clients).limit(10);
      res.json(allClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/employees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allEmployees = await db.select().from(employees).limit(10);
      res.json(allEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}