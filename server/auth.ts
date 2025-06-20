import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    type: string;
    organizationId: string;
  };
}

// Generate JWT token with enhanced user data
export function generateToken(payload: { 
  id: string; 
  username: string; 
  email: string; 
  role: string; 
  type: string; 
  organizationId: string; 
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): { 
  id: string; 
  username: string; 
  email: string; 
  role: string; 
  type: string; 
  organizationId: string; 
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { 
      id: string; 
      username: string; 
      email: string; 
      role: string; 
      type: string; 
      organizationId: string; 
    };
  } catch (error) {
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
  // Check for token in Authorization header or cookies
  let token = req.headers.authorization?.split(' ')[1]; // Bearer token
  
  if (!token && req.cookies) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Get fresh user data from database to ensure current role/status
  const user = await storage.getUser(decoded.id);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ message: 'User account is inactive or not found' });
  }

  req.user = {
    id: user.id,
    username: user.name, // Use name as username for now
    email: user.email,
    role: user.role,
    type: user.type,
    organizationId: user.organizationId
  };
  
  next();
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Admin-only middleware
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

// Organization isolation middleware
export function requireSameOrganization(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Allow super_admin to access any organization
  if (req.user.role === 'super_admin') {
    return next();
  }

  // For other users, validate organization access in route handlers
  next();
}

// Client dashboard token middleware (separate from regular auth)
export async function validateClientToken(req: Request, res: Response, next: NextFunction) {
  const { token } = req.params;
  
  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }

  try {
    const client = await storage.getClientByToken(token);
    if (!client) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Add client info to request
    (req as any).client = client;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Login handler
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Get user from database
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ id: user.id, username: user.username });

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also send token in response for localStorage option
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Signup handler
export async function signup(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
    });

    // Generate token
    const token = generateToken({ id: user.id, username: user.username });

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout handler
export function logout(req: Request, res: Response) {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
}

// Get current user handler
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}