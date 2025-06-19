import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { authenticate, authorize, requireRole, generateToken, hashPassword, verifyPassword, type AuthRequest } from "./auth";
import { 
  loginSchema, 
  signupSchema, 
  inviteUserSchema, 
  acceptInviteSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());

  // Public auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user || !await verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.status !== "active") {
        return res.status(401).json({ message: "Account is not active" });
      }

      const token = generateToken(user);
      
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          orgId: user.orgId 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password, organizationName } = signupSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = await hashPassword(password);

      // Create organization first
      const org = await storage.createOrganization({
        name: organizationName,
      });

      // Create user as admin of the organization
      const user = await storage.createUser({
        orgId: org.id,
        name,
        email,
        passwordHash,
        role: "admin",
        status: "active",
        emailVerified: true,
      });

      // Update organization's created_by field
      await storage.updateOrganization(org.id, { createdBy: user.id });

      const token = generateToken(user);
      
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          orgId: user.orgId 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth_token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        orgId: user.orgId 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User invitation routes
  app.post("/api/users/invite", authenticate, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { email, role } = inviteUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const invitation = await storage.createInvitation({
        orgId: req.user!.orgId,
        email,
        role,
        invitedBy: req.user!.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.status(201).json({ invitation });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      
      if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      res.json({ 
        email: invitation.email, 
        role: invitation.role, 
        orgId: invitation.orgId 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post("/api/invitations/:token/accept", async (req, res) => {
    try {
      const { name, password } = acceptInviteSchema.parse(req.body);
      
      const invitation = await storage.getInvitationByToken(req.params.token);
      if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      const passwordHash = await hashPassword(password);

      const user = await storage.createUser({
        orgId: invitation.orgId,
        name,
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        status: "active",
        emailVerified: true,
      });

      await storage.acceptInvitation(req.params.token);

      const token = generateToken(user);
      
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          orgId: user.orgId 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // User management routes
  app.get("/api/users", authenticate, requireRole("manager"), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getUsersByOrganization(req.user!.orgId);
      res.json(users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/invitations", authenticate, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const invitations = await storage.getInvitationsByOrganization(req.user!.orgId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Protected business data routes with organization filtering
  app.get("/api/categories", authenticate, async (req: AuthRequest, res) => {
    try {
      const categories = await storage.getCategories(req.user!.orgId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticate, requireRole("manager"), async (req: AuthRequest, res) => {
    try {
      const category = await storage.createCategory({
        ...req.body,
        createdBy: req.user!.orgId,
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.get("/api/clients", authenticate, async (req: AuthRequest, res) => {
    try {
      const clients = await storage.getClients(req.user!.orgId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", authenticate, requireRole("manager"), async (req: AuthRequest, res) => {
    try {
      const client = await storage.createClient({
        ...req.body,
        createdBy: req.user!.orgId,
      });
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: "Failed to create client" });
    }
  });

  app.get("/api/employees", authenticate, async (req: AuthRequest, res) => {
    try {
      const employees = await storage.getEmployees(req.user!.orgId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", authenticate, requireRole("manager"), async (req: AuthRequest, res) => {
    try {
      const employee = await storage.createEmployee({
        ...req.body,
        createdBy: req.user!.orgId,
      });
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.get("/api/developers", authenticate, async (req: AuthRequest, res) => {
    try {
      const developers = await storage.getDevelopers(req.user!.orgId);
      res.json(developers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch developers" });
    }
  });

  app.post("/api/developers", authenticate, requireRole("manager"), async (req: AuthRequest, res) => {
    try {
      const developer = await storage.createDeveloper({
        ...req.body,
        createdBy: req.user!.orgId,
      });
      res.status(201).json(developer);
    } catch (error) {
      res.status(400).json({ message: "Failed to create developer" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}