import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, organizations } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

export interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Authentication middleware
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
}

// Role-based authorization middleware
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

// Login endpoint
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({ message: "Account is not active" });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    });

    // Create session record
    await db.insert(userSessions).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.json({
      token,
      user: {
        id: user.id,
        organizationId: user.organizationId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Register/Signup endpoint
export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({ 
        message: "Name, email, password, and organization name are required" 
      });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create organization
    const [organization] = await db
      .insert(organizations)
      .values({
        name: organizationName,
      })
      .returning();

    // Create user as admin of the new organization
    const [newUser] = await db
      .insert(users)
      .values({
        organizationId: organization.id,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
        status: "active",
        emailVerified: false,
      })
      .returning();

    // Update organization with created_by
    await db
      .update(organizations)
      .set({ createdBy: newUser.id })
      .where(eq(organizations.id, organization.id));

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      organizationId: newUser.organizationId,
      role: newUser.role,
      email: newUser.email,
    });

    // Create session record
    await db.insert(userSessions).values({
      userId: newUser.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        organizationId: newUser.organizationId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Logout endpoint
export async function logout(req: AuthRequest, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      // Remove session from database
      await db
        .delete(userSessions)
        .where(eq(userSessions.token, token));
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get current user endpoint
export async function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  res.json(req.user);
}

// Invite user endpoint
export async function inviteUser(req: AuthRequest, res: Response) {
  try {
    const { email, role } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user has permission to invite (admin or super_admin)
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Check if invitation already exists
    const [existingInvitation] = await db
      .select()
      .from(userInvitations)
      .where(
        and(
          eq(userInvitations.email, email.toLowerCase()),
          eq(userInvitations.organizationId, req.user.organizationId)
        )
      );

    if (existingInvitation && !existingInvitation.acceptedAt) {
      return res.status(409).json({ message: "Invitation already sent" });
    }

    // Create invitation
    const [invitation] = await db
      .insert(userInvitations)
      .values({
        organizationId: req.user.organizationId,
        email: email.toLowerCase(),
        role,
        invitedBy: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .returning();

    res.status(201).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Invite user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Accept invitation endpoint
export async function acceptInvitation(req: Request, res: Response) {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return res.status(400).json({ 
        message: "Token, name, and password are required" 
      });
    }

    // Find invitation
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token));

    if (!invitation) {
      return res.status(404).json({ message: "Invalid invitation token" });
    }

    // Check if invitation is still valid
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invitation has expired" });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ message: "Invitation already accepted" });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email));

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        organizationId: invitation.organizationId,
        name,
        email: invitation.email,
        password: hashedPassword,
        role: invitation.role,
        status: "active",
        emailVerified: true,
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.id, invitation.id));

    // Generate JWT token
    const jwtToken = generateToken({
      userId: newUser.id,
      organizationId: newUser.organizationId,
      role: newUser.role,
      email: newUser.email,
    });

    // Create session record
    await db.insert(userSessions).values({
      userId: newUser.id,
      token: jwtToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.status(201).json({
      token: jwtToken,
      user: {
        id: newUser.id,
        organizationId: newUser.organizationId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}