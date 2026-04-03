import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
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

    // Look up our user record by Clerk ID — auto-sync if not found
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, auth.userId))
      .limit(1);

    if (!user) {
      // Auto-sync: fetch user from Clerk API and create local record
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        const email =
          clerkUser.emailAddresses?.find(
            (e) => e.id === clerkUser.primaryEmailAddressId
          )?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;

        const [created] = await db
          .insert(users)
          .values({
            clerkUserId: clerkUser.id,
            email: email || null,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
            avatarUrl: clerkUser.imageUrl || null,
          })
          .onConflictDoUpdate({
            target: users.clerkUserId,
            set: {
              email: email || null,
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
              avatarUrl: clerkUser.imageUrl || null,
              updatedAt: new Date(),
            },
          })
          .returning();
        user = created;
        console.log(`Auto-synced user ${clerkUser.id} (${email})`);
      } catch (syncError) {
        console.error("Failed to auto-sync user:", syncError);
        return res.status(401).json({ message: "User not found and auto-sync failed" });
      }
    }

    req.bluxoUser = {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email || "",
      name: user.name || "",
    };

    // If Clerk provides an active org, resolve it — auto-sync if not found
    if (auth.orgId) {
      let [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.clerkOrgId, auth.orgId))
        .limit(1);

      if (!org) {
        // Auto-sync: fetch org from Clerk API and create local record
        try {
          const clerkOrg = await clerkClient.organizations.getOrganization({ organizationId: auth.orgId });
          const slug = clerkOrg.slug || clerkOrg.name?.toLowerCase().replace(/\s+/g, "-");

          const [created] = await db
            .insert(organizations)
            .values({
              clerkOrgId: clerkOrg.id,
              name: clerkOrg.name,
              slug,
              logo: clerkOrg.imageUrl || null,
            })
            .onConflictDoUpdate({
              target: organizations.clerkOrgId,
              set: {
                name: clerkOrg.name,
                slug,
                logo: clerkOrg.imageUrl || null,
                updatedAt: new Date(),
              },
            })
            .returning();
          org = created;
          console.log(`Auto-synced org ${clerkOrg.id} (${clerkOrg.name})`);
        } catch (syncError) {
          console.error("Failed to auto-sync org:", syncError);
        }
      }

      if (org) {
        req.bluxoOrg = {
          id: org.id,
          clerkOrgId: auth.orgId,
          name: org.name,
          slug: org.slug || "",
          country: org.country,
          currency: org.currency,
        };

        // Look up membership — auto-create if not found
        let [membership] = await db
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

        if (!membership) {
          // Auto-create membership for this user+org
          try {
            const [created] = await db
              .insert(orgMemberships)
              .values({
                clerkUserId: auth.userId,
                organizationId: org.id,
                isOwner: auth.orgRole === "org:admin",
              })
              .onConflictDoNothing()
              .returning();
            membership = created;
            console.log(`Auto-synced membership for user ${auth.userId} in org ${org.name}`);
          } catch (syncError) {
            console.error("Failed to auto-sync membership:", syncError);
          }
        }

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
