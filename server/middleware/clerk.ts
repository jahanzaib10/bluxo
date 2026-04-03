import { clerkMiddleware, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, organizations, orgMemberships } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Extend Express Request with our app-specific user/org data
export interface AuthenticatedRequest extends Request {
  bluxoUser?: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string;
  };
  bluxoOrg?: {
    id: string;
    clerkOrgId: string;
    name: string;
    slug: string;
    country: string | null;
    currency: string | null;
  };
  membership?: {
    id: string;
    isOwner: boolean;
    customRoleId: string | null;
  };
}

// Base Clerk middleware — attaches Clerk session to req
export const clerkAuth = clerkMiddleware();

// Resolve Clerk IDs to our DB records
export async function resolveBluxoUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Look up our user record by Clerk ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, auth.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: "User not found in database. Webhook may not have fired yet." });
    }

    req.bluxoUser = {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email || "",
      name: user.name || "",
    };

    // If Clerk provides an active org, resolve it
    if (auth.orgId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.clerkOrgId, auth.orgId))
        .limit(1);

      if (org) {
        req.bluxoOrg = {
          id: org.id,
          clerkOrgId: auth.orgId,
          name: org.name,
          slug: org.slug || "",
          country: org.country,
          currency: org.currency,
        };

        // Look up membership
        const [membership] = await db
          .select()
          .from(orgMemberships)
          .where(
            and(
              eq(orgMemberships.clerkUserId, auth.userId),
              eq(orgMemberships.organizationId, org.id),
              eq(orgMemberships.status, "active")
            )
          )
          .limit(1);

        if (membership) {
          req.membership = {
            id: membership.id,
            isOwner: membership.isOwner || false,
            customRoleId: membership.customRoleId,
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error("Error resolving Bluxo user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
