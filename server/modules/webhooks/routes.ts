// server/modules/webhooks/routes.ts
import { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { db } from "../../db";
import { users, organizations, orgMemberships } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Clerk sends webhook events when users/orgs are created, updated, or deleted.
// We sync these to our DB so we have local records to attach business data to.
router.post("/api/webhooks/clerk", async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.warn("CLERK_WEBHOOK_SECRET not set — skipping webhook verification");
    // In dev, process unverified; in prod, this should fail
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ message: "Webhook secret not configured" });
    }
  }

  // Verify webhook signature
  if (WEBHOOK_SECRET) {
    const svixHeaders = {
      "svix-id": req.headers["svix-id"] as string,
      "svix-timestamp": req.headers["svix-timestamp"] as string,
      "svix-signature": req.headers["svix-signature"] as string,
    };

    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      wh.verify(JSON.stringify(req.body), svixHeaders);
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return res.status(400).json({ message: "Invalid webhook signature" });
    }
  }

  const { type, data } = req.body;

  try {
    switch (type) {
      case "user.created":
      case "user.updated": {
        const email =
          data.email_addresses?.find(
            (e: any) => e.id === data.primary_email_address_id
          )?.email_address || data.email_addresses?.[0]?.email_address;

        await db
          .insert(users)
          .values({
            clerkUserId: data.id,
            email: email || null,
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || null,
            avatarUrl: data.image_url || null,
          } as any)
          .onConflictDoUpdate({
            target: users.clerkUserId,
            set: {
              email: email || null,
              name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || null,
              avatarUrl: data.image_url || null,
              updatedAt: new Date(),
            } as any,
          });
        break;
      }

      case "user.deleted": {
        if (data.id) {
          await db
            .delete(users)
            .where(eq(users.clerkUserId, data.id));
        }
        break;
      }

      case "organization.created":
      case "organization.updated": {
        const slug = data.slug || data.name?.toLowerCase().replace(/\s+/g, "-");
        await db
          .insert(organizations)
          .values({
            clerkOrgId: data.id,
            name: data.name,
            slug,
            logo: data.image_url || null,
          } as any)
          .onConflictDoUpdate({
            target: organizations.clerkOrgId,
            set: {
              name: data.name,
              slug,
              logo: data.image_url || null,
              updatedAt: new Date(),
            } as any,
          });
        break;
      }

      case "organization.deleted": {
        if (data.id) {
          // Soft delete — set status to archived
          await db
            .update(organizations)
            .set({ status: "archived", updatedAt: new Date() } as any)
            .where(eq(organizations.clerkOrgId, data.id));
        }
        break;
      }

      case "organizationMembership.created": {
        const orgClerkId = data.organization?.id;
        const userClerkId = data.public_user_data?.user_id;

        if (orgClerkId && userClerkId) {
          // Find our org record
          const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.clerkOrgId, orgClerkId))
            .limit(1);

          if (org) {
            const isOwner = data.role === "org:admin"; // Clerk's admin role = our owner

            await db
              .insert(orgMemberships)
              .values({
                clerkUserId: userClerkId,
                organizationId: org.id,
                isOwner,
              } as any)
              .onConflictDoNothing(); // Ignore if already exists
          }
        }
        break;
      }

      case "organizationMembership.deleted": {
        const orgClerkId2 = data.organization?.id;
        const userClerkId2 = data.public_user_data?.user_id;

        if (orgClerkId2 && userClerkId2) {
          const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.clerkOrgId, orgClerkId2))
            .limit(1);

          if (org) {
            await db
              .update(orgMemberships)
              .set({ status: "removed" } as any)
              .where(
                and(
                  eq(orgMemberships.clerkUserId, userClerkId2),
                  eq(orgMemberships.organizationId, org.id)
                )
              );
          }
        }
        break;
      }

      default:
        // Unhandled event type — log and ignore
        console.log(`Unhandled Clerk webhook event: ${type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook ${type}:`, error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
});

export default router;
