import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  orgId: string;
  role: string;
  email: string;
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Store user info from token for use in routes
  req.user = {
    id: payload.userId,
    orgId: payload.orgId,
    role: payload.role,
    email: payload.email,
  } as User;

  next();
}

export function authorize(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  employee: 2,
  viewer: 1,
};

export function hasPermission(userRole: string, requiredRole: string): boolean {
  return ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] >= 
         ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY];
}

export function requireRole(requiredRole: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasPermission(req.user.role, requiredRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}