# Bluxo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Bluxo from a single-org app with custom JWT auth into a multi-org platform with Clerk authentication, modular backend, org-scoped routing, and Bluxo branding.

**Architecture:** Replace custom auth with Clerk (webhooks sync users/orgs to our DB). Restructure the monolithic `routes.ts` (2750 lines) and `storage.ts` into domain modules (`finance/`, `clients/`, `settings/`, `analytics/`). Extend the schema for multi-org (enhanced organizations, Clerk-synced users, org_memberships). Frontend gets org-scoped routing (`/org/:slug/...`), a Clerk-powered org switcher in the sidebar, and module-based file organization.

**Tech Stack:** Express.js, Drizzle ORM, Supabase PostgreSQL, Clerk (`@clerk/express`, `@clerk/clerk-react`), React 18, Wouter, TanStack React Query, Radix UI/shadcn, Tailwind CSS, Vite

**Spec:** `docs/superpowers/specs/2026-04-03-bluxo-multi-org-platform-design.md`

**Depends on:** User must provide real values for `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and Supabase credentials in `.env` before Tasks 6+.

---

## File Structure

### New files to create

```
server/
  middleware/
    clerk.ts               — Clerk session validation, user/org resolution
    orgContext.ts           — Extract active org, enforce data isolation
    permissions.ts          — Role-based route protection (stub for Plan 2)
  modules/
    finance/
      routes.ts            — Income, expenses, subscriptions endpoints
      storage.ts           — Finance DB queries
    clients/
      routes.ts            — Client CRUD, portal endpoints
      storage.ts           — Client DB queries
    settings/
      routes.ts            — Categories, payment sources, org settings, user management
      storage.ts           — Settings DB queries
    analytics/
      routes.ts            — Dashboard summary, trends, breakdowns
      storage.ts           — Analytics DB queries
    webhooks/
      routes.ts            — Clerk webhook handlers

client/src/
  modules/
    finance/
      pages/
        Income.tsx         — (moved from pages/Income.tsx)
        Expenses.tsx       — (moved from pages/Expenses.tsx)
        Subscriptions.tsx  — (moved from pages/Subscriptions.tsx)
    people/
      pages/               — (empty, placeholder for Plan 3)
    clients/
      pages/
        Clients.tsx        — (moved from pages/clients.tsx)
    analytics/
      pages/
        Dashboard.tsx      — (moved from pages/Dashboard.tsx)
    hq/
      pages/
        CommandCenter.tsx  — (stub placeholder)
    settings/
      pages/
        ProfileSettings.tsx
        OrganizationSettings.tsx
        CategoriesSettings.tsx
        PaymentSourcesSettings.tsx
        SecuritySettings.tsx
        UserManagementSettings.tsx
  components/
    layout/
      OrgSwitcher.tsx      — Clerk org switcher styled for sidebar
      HQLayout.tsx         — Layout for HQ mode (stub)
    shared/
      PermissionGate.tsx   — Hides UI based on role permissions (stub)
  hooks/
    useActiveOrg.ts        — Current org context, HQ mode detection
    usePermissions.ts      — Permission checking (stub for Plan 2)
  lib/
    permissions.ts         — Permission constants, module enums

shared/
  permissions.ts           — Permission constants shared client/server
```

### Files to modify

```
.env                       — Add Clerk + Supabase env vars
package.json               — Add Clerk packages, remove passport/bcrypt/jwt
shared/schema.ts           — Extended organizations, rewritten users, new org_memberships
server/db.ts               — Simplified for Supabase (remove Neon logic)
server/index.ts            — Clerk middleware, modular route registration
client/src/App.tsx          — Org-scoped routing, Clerk provider
client/src/components/layout/Layout.tsx — Org switcher, Bluxo branding, updated nav
client/src/lib/queryClient.ts — Clerk token in API requests
client/src/hooks/useAuth.ts — Rewrite to wrap Clerk
```

### Files to delete

```
server/auth.ts              — Replaced by Clerk middleware
server/routes.ts            — Split into server/modules/*/routes.ts
server/storage.ts           — Split into server/modules/*/storage.ts
server/storage_backup.ts    — Unused backup
client/src/pages/Login.tsx
client/src/pages/Signup.tsx
client/src/pages/AcceptInvitation.tsx
client/src/pages/InviteAcceptance.tsx
client/src/pages/DebugInvitation.tsx
client/src/pages/Index.tsx
client/src/pages/Expenses_broken.tsx
client/src/components/auth/LoginForm.tsx
client/src/components/auth/SignUpForm.tsx
client/src/components/auth/AuthProvider.tsx
client/src/components/debug/CategoriesDebug.tsx
client/src/components/debug/InvitationDebug.tsx
client/src/components/invitation/InvitationAcceptanceForm.tsx
client/src/lib/authUtils.ts
```

---

## Task 1: Install dependencies and update environment

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Step 1: Install Clerk packages**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
npm install @clerk/express @clerk/clerk-react @clerk/themes svix
```

- `@clerk/express` — Express middleware for backend auth
- `@clerk/clerk-react` — React components (SignIn, OrganizationSwitcher, etc.)
- `@clerk/themes` — Theming for Clerk components
- `svix` — Webhook signature verification for Clerk webhooks

- [ ] **Step 2: Install Supabase storage client**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 3: Remove old auth packages**

```bash
npm uninstall passport passport-local jsonwebtoken bcryptjs @types/passport @types/passport-local @types/jsonwebtoken @types/bcryptjs connect-pg-simple @types/connect-pg-simple express-session @types/express-session memorystore openid-client
```

- [ ] **Step 4: Update .env with all required variables**

Replace the contents of `.env` with:

```env
# App
PORT=3000

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Supabase
DATABASE_URL=postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# SendGrid (optional for local dev)
SENDGRID_API_KEY=xxxxx
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env
git commit -m "feat: swap auth/db dependencies — add Clerk, Supabase; remove passport, JWT, bcrypt"
```

---

## Task 2: Simplify database connection for Supabase

**Files:**
- Modify: `server/db.ts`

- [ ] **Step 1: Rewrite db.ts for standard pg driver**

Replace the entire file with:

```typescript
import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

- [ ] **Step 2: Verify the app still connects to the database**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
DATABASE_URL="postgresql://jahanzaibsohail@localhost:5432/bluxo" npx tsx -e "
import { pool } from './server/db.ts';
const res = await pool.query('SELECT NOW()');
console.log('DB connected:', res.rows[0].now);
await pool.end();
"
```

Expected: `DB connected: <current timestamp>`

- [ ] **Step 3: Commit**

```bash
git add server/db.ts
git commit -m "refactor: simplify db.ts — single pg driver for Supabase/local PostgreSQL"
```

---

## Task 3: Extend shared schema for multi-org

**Files:**
- Modify: `shared/schema.ts`

This is the most critical task — every subsequent task depends on this schema.

- [ ] **Step 1: Rewrite the organizations table**

In `shared/schema.ts`, replace the existing `organizations` table definition:

```typescript
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: varchar("clerk_org_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  logo: varchar("logo"),
  country: varchar("country", { length: 3 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  timezone: varchar("timezone").default("UTC"),
  taxId: varchar("tax_id"),
  address: text("address"),
  phone: varchar("phone"),
  website: varchar("website"),
  fiscalYearStart: varchar("fiscal_year_start", { length: 2 }).default("01"),
  industry: varchar("industry"),
  status: varchar("status", { enum: ["active", "suspended", "archived"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

- [ ] **Step 2: Rewrite the users table**

Replace the existing `users` table:

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).unique().notNull(),
  email: varchar("email"),
  name: varchar("name"),
  avatarUrl: varchar("avatar_url"),
  lastActiveOrgId: uuid("last_active_org_id").references(() => organizations.id),
  preferences: jsonb("preferences").$type<{ theme?: string; locale?: string }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

- [ ] **Step 3: Add org_memberships table**

Add after the `users` table:

```typescript
export const orgMemberships = pgTable("org_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: varchar("clerk_user_id").references(() => users.clerkUserId).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  customRoleId: uuid("custom_role_id"),
  isOwner: boolean("is_owner").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: varchar("status", { enum: ["active", "suspended", "removed"] }).default("active"),
});
```

- [ ] **Step 4: Remove old auth tables**

Delete the `sessions` table definition entirely.
Delete the `userInvitations` table definition entirely.
Delete the `clientAuthTokens` table definition entirely.
Delete the `userInvitationsRelations` definition.
Delete the `clientAuthTokensRelations` definition.

- [ ] **Step 5: Update relations**

Replace `usersRelations`:

```typescript
export const usersRelations = relations(users, ({ one, many }) => ({
  lastActiveOrg: one(organizations, {
    fields: [users.lastActiveOrgId],
    references: [organizations.id],
  }),
  memberships: many(orgMemberships),
}));
```

Add `orgMembershipsRelations`:

```typescript
export const orgMembershipsRelations = relations(orgMemberships, ({ one }) => ({
  user: one(users, {
    fields: [orgMemberships.clerkUserId],
    references: [users.clerkUserId],
  }),
  organization: one(organizations, {
    fields: [orgMemberships.organizationId],
    references: [organizations.id],
  }),
}));
```

- [ ] **Step 6: Update the employees → people rename in schema**

Replace the `employees` table:

```typescript
export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { enum: ["employee", "contractor"] }).default("employee"),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email"),
  phone: varchar("phone"),
  avatarUrl: varchar("avatar_url"),
  position: varchar("position"),
  department: varchar("department"),
  country: varchar("country"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: varchar("status", { enum: ["active", "on_leave", "terminated", "offboarding"] }).default("active"),
  seniorityLevel: varchar("seniority_level"),
  paymentAmount: decimal("payment_amount", { precision: 12, scale: 2 }),
  directManagerId: uuid("direct_manager_id").references((): any => people.id),
  groupName: varchar("group_name"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

Update `employeesRelations` to `peopleRelations`:

```typescript
export const peopleRelations = relations(people, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [people.organizationId],
    references: [organizations.id],
  }),
  expenses: many(expenses),
}));
```

- [ ] **Step 7: Update expenses table FK**

In the `expenses` table, rename `employeeId` to `personId`:

```typescript
personId: uuid("person_id").references(() => people.id),
```

Update `expensesRelations`:

```typescript
export const expensesRelations = relations(expenses, ({ one }) => ({
  organization: one(organizations, {
    fields: [expenses.organizationId],
    references: [organizations.id],
  }),
  person: one(people, {
    fields: [expenses.personId],
    references: [people.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));
```

- [ ] **Step 8: Update organizationsRelations**

```typescript
export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(orgMemberships),
  people: many(people),
  clients: many(clients),
  categories: many(categories),
  paymentSources: many(paymentSources),
  income: many(income),
  expenses: many(expenses),
  subscriptions: many(subscriptions),
}));
```

- [ ] **Step 9: Update Zod schemas**

Remove `insertUserInvitationSchema`, `upsertUserSchema`.

Update `insertEmployeeSchema` to `insertPersonSchema`:

```typescript
export const insertPersonSchema = z.object({
  type: z.enum(["employee", "contractor"]).default("employee"),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  country: z.string().optional(),
  startDate: z.string().optional(),
  seniorityLevel: z.string().optional(),
});
```

Update types at the bottom:

```typescript
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type OrgMembership = typeof orgMemberships.$inferSelect;
export type Person = typeof people.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ClientPermissions = typeof clientPermissions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type PaymentSource = typeof paymentSources.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertPaymentSource = z.infer<typeof insertPaymentSourceSchema>;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
```

Remove old types: `UserInvitation`, `ClientAuthToken`, `Employee`, `InsertEmployee`, `InsertUserInvitation`, `UpdateUserRole`, `UpdateUserStatus`, `UpsertUser`.

- [ ] **Step 10: Update insertOrganizationSchema**

```typescript
export const insertOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  country: z.string().max(3).optional(),
  currency: z.string().max(3).default("USD"),
  timezone: z.string().optional(),
  industry: z.string().optional(),
});
```

- [ ] **Step 11: Push schema to local database**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
DATABASE_URL="postgresql://jahanzaibsohail@localhost:5432/bluxo" npx drizzle-kit push
```

Expected: Schema changes applied (new columns on organizations, new org_memberships table, people table replaces employees, etc.)

- [ ] **Step 12: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: extend schema for multi-org — enhanced orgs, Clerk-synced users, org_memberships, employees→people"
```

---

## Task 4: Create shared permission constants

**Files:**
- Create: `shared/permissions.ts`

- [ ] **Step 1: Create the shared permissions module**

```typescript
// shared/permissions.ts
// Permission constants shared between client and server

export const MODULES = {
  DASHBOARD: "dashboard",
  FINANCE: "finance",
  PEOPLE: "people",
  CLIENTS: "clients",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
  INTEGRATIONS: "integrations",
  DATA_ROOM: "data_room",
  PAYROLL: "payroll",
  INVOICING: "invoicing",
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export const ACCESS_LEVELS = {
  FULL: "full",
  EXCLUSIVE: "exclusive",
} as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];

export const SYSTEM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  ACCOUNTANT: "accountant",
  HR_MANAGER: "hr_manager",
  MANAGER: "manager",
  VIEWER: "viewer",
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

// Default module access per system role
// true = full access, false = no access, "exclusive" = own data only
export const DEFAULT_ROLE_PERMISSIONS: Record<
  SystemRoleName,
  Record<ModuleName, boolean | "exclusive">
> = {
  owner: {
    dashboard: true,
    finance: true,
    people: true,
    clients: true,
    analytics: true,
    settings: true,
    integrations: true,
    data_room: true,
    payroll: true,
    invoicing: true,
  },
  admin: {
    dashboard: true,
    finance: true,
    people: true,
    clients: true,
    analytics: true,
    settings: true,
    integrations: true,
    data_room: true,
    payroll: true,
    invoicing: true,
  },
  accountant: {
    dashboard: true,
    finance: true,
    people: false,
    clients: "exclusive",
    analytics: true,
    settings: false,
    integrations: false,
    data_room: "exclusive",
    payroll: true,
    invoicing: true,
  },
  hr_manager: {
    dashboard: true,
    finance: false,
    people: true,
    clients: false,
    analytics: "exclusive",
    settings: false,
    integrations: false,
    data_room: true,
    payroll: true,
    invoicing: false,
  },
  manager: {
    dashboard: true,
    finance: "exclusive",
    people: "exclusive",
    clients: "exclusive",
    analytics: "exclusive",
    settings: false,
    integrations: false,
    data_room: "exclusive",
    payroll: false,
    invoicing: "exclusive",
  },
  viewer: {
    dashboard: true,
    finance: "exclusive",
    people: "exclusive",
    clients: "exclusive",
    analytics: "exclusive",
    settings: false,
    integrations: false,
    data_room: "exclusive",
    payroll: false,
    invoicing: false,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add shared/permissions.ts
git commit -m "feat: add shared permission constants for role-based access control"
```

---

## Task 5: Create Clerk server middleware

**Files:**
- Create: `server/middleware/clerk.ts`
- Create: `server/middleware/orgContext.ts`
- Create: `server/middleware/permissions.ts`

- [ ] **Step 1: Create Clerk authentication middleware**

```typescript
// server/middleware/clerk.ts
import { clerkMiddleware, getAuth, requireAuth } from "@clerk/express";
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
```

- [ ] **Step 2: Create org context middleware**

```typescript
// server/middleware/orgContext.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./clerk";

// Requires an active organization context.
// Used on all org-scoped API routes.
export function requireOrg(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.bluxoOrg) {
    return res.status(400).json({
      message: "No organization selected. Please select an organization.",
    });
  }
  if (!req.membership) {
    return res.status(403).json({
      message: "You are not a member of this organization.",
    });
  }
  next();
}

// Helper to get the current org ID from the request.
// Call AFTER requireOrg middleware.
export function getOrgId(req: AuthenticatedRequest): string {
  return req.bluxoOrg!.id;
}

// Helper to get the current user's Clerk ID from the request.
export function getUserClerkId(req: AuthenticatedRequest): string {
  return req.bluxoUser!.clerkUserId;
}
```

- [ ] **Step 3: Create permissions middleware stub**

```typescript
// server/middleware/permissions.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./clerk";
import { ModuleName } from "@shared/permissions";

// Stub permission check — allows everything in Plan 1.
// Plan 2 will implement full role_permissions table lookup.
export function requireModule(moduleName: ModuleName) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // TODO: Plan 2 — check role_permissions for req.membership.customRoleId
    // For now, any authenticated org member can access any module
    if (!req.bluxoUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
}

export function requireOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.membership?.isOwner) {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
}
```

- [ ] **Step 4: Commit**

```bash
git add server/middleware/
git commit -m "feat: add Clerk auth middleware, org context, and permission stubs"
```

---

## Task 6: Create Clerk webhook handler

**Files:**
- Create: `server/modules/webhooks/routes.ts`

- [ ] **Step 1: Create webhook routes**

```typescript
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
          })
          .onConflictDoUpdate({
            target: users.clerkUserId,
            set: {
              email: email || null,
              name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || null,
              avatarUrl: data.image_url || null,
              updatedAt: new Date(),
            },
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
          })
          .onConflictDoUpdate({
            target: organizations.clerkOrgId,
            set: {
              name: data.name,
              slug,
              logo: data.image_url || null,
              updatedAt: new Date(),
            },
          });
        break;
      }

      case "organization.deleted": {
        if (data.id) {
          // Soft delete — set status to archived
          await db
            .update(organizations)
            .set({ status: "archived", updatedAt: new Date() })
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
              })
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
              .set({ status: "removed" })
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
```

- [ ] **Step 2: Commit**

```bash
git add server/modules/webhooks/
git commit -m "feat: add Clerk webhook handler — sync users, orgs, and memberships to DB"
```

---

## Task 7: Restructure backend — extract finance module

**Files:**
- Create: `server/modules/finance/routes.ts`
- Create: `server/modules/finance/storage.ts`

- [ ] **Step 1: Create finance storage**

Extract all finance-related DB queries from `server/storage.ts`. Read `server/storage.ts` and move all methods related to income, expenses, and subscriptions into the new file.

```typescript
// server/modules/finance/storage.ts
import { db } from "../../db";
import { income, expenses, subscriptions, people } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const financeStorage = {
  // --- Income ---
  async getIncomeByOrg(organizationId: string) {
    return db.select().from(income)
      .where(eq(income.organizationId, organizationId))
      .orderBy(desc(income.date));
  },

  async createIncome(data: any, organizationId: string) {
    const [result] = await db.insert(income).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async updateIncome(id: string, data: any, organizationId: string) {
    const [result] = await db.update(income)
      .set(data)
      .where(and(eq(income.id, id), eq(income.organizationId, organizationId)))
      .returning();
    return result;
  },

  async deleteIncome(id: string, organizationId: string) {
    const [result] = await db.delete(income)
      .where(and(eq(income.id, id), eq(income.organizationId, organizationId)))
      .returning();
    return result;
  },

  // --- Expenses ---
  async getExpensesByOrg(organizationId: string) {
    return db.select().from(expenses)
      .where(eq(expenses.organizationId, organizationId))
      .orderBy(desc(expenses.date));
  },

  async createExpense(data: any, organizationId: string) {
    const [result] = await db.insert(expenses).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async updateExpense(id: string, data: any, organizationId: string) {
    const [result] = await db.update(expenses)
      .set(data)
      .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))
      .returning();
    return result;
  },

  async deleteExpense(id: string, organizationId: string) {
    const [result] = await db.delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))
      .returning();
    return result;
  },

  async getExpensesByPerson(personId: string, organizationId: string) {
    return db.select().from(expenses)
      .where(and(
        eq(expenses.personId, personId),
        eq(expenses.organizationId, organizationId)
      ))
      .orderBy(desc(expenses.date));
  },

  // --- Subscriptions ---
  async getSubscriptionsByOrg(organizationId: string) {
    return db.select().from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .orderBy(desc(subscriptions.createdAt));
  },

  async createSubscription(data: any, organizationId: string) {
    const [result] = await db.insert(subscriptions).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async updateSubscription(id: string, data: any, organizationId: string) {
    const [result] = await db.update(subscriptions)
      .set(data)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.organizationId, organizationId)))
      .returning();
    return result;
  },

  async deleteSubscription(id: string, organizationId: string) {
    const [result] = await db.delete(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.organizationId, organizationId)))
      .returning();
    return result;
  },
};
```

- [ ] **Step 2: Create finance routes**

Read `server/routes.ts` and extract all income, expense, and subscription endpoints. Adapt them to use `financeStorage` and `getOrgId()` from the org context middleware.

```typescript
// server/modules/finance/routes.ts
import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { financeStorage } from "./storage";
import { insertIncomeSchema, insertExpenseSchema, insertSubscriptionSchema } from "@shared/schema";

const router = Router();

// All finance routes require org context
router.use(requireOrg);

// --- Income ---
router.get("/api/income", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.getIncomeByOrg(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/income", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const parsed = insertIncomeSchema.parse(req.body);
    const result = await financeStorage.createIncome(parsed, orgId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/api/income/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.updateIncome(req.params.id, req.body, orgId);
    if (!result) return res.status(404).json({ message: "Income not found" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/income/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.deleteIncome(req.params.id, orgId);
    if (!result) return res.status(404).json({ message: "Income not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Expenses ---
router.get("/api/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.getExpensesByOrg(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const parsed = insertExpenseSchema.parse(req.body);
    const result = await financeStorage.createExpense(parsed, orgId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/api/expenses/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.updateExpense(req.params.id, req.body, orgId);
    if (!result) return res.status(404).json({ message: "Expense not found" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/expenses/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.deleteExpense(req.params.id, orgId);
    if (!result) return res.status(404).json({ message: "Expense not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Subscriptions ---
router.get("/api/subscriptions", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.getSubscriptionsByOrg(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/subscriptions", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const parsed = insertSubscriptionSchema.parse(req.body);
    const result = await financeStorage.createSubscription(parsed, orgId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/api/subscriptions/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.updateSubscription(req.params.id, req.body, orgId);
    if (!result) return res.status(404).json({ message: "Subscription not found" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/subscriptions/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await financeStorage.deleteSubscription(req.params.id, orgId);
    if (!result) return res.status(404).json({ message: "Subscription not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add server/modules/finance/
git commit -m "refactor: extract finance module — income, expenses, subscriptions routes and storage"
```

---

## Task 8: Restructure backend — extract settings module

**Files:**
- Create: `server/modules/settings/routes.ts`
- Create: `server/modules/settings/storage.ts`

- [ ] **Step 1: Create settings storage**

Extract categories, payment sources, and organization settings queries from `server/storage.ts`.

```typescript
// server/modules/settings/storage.ts
import { db } from "../../db";
import { categories, paymentSources, organizations } from "@shared/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export const settingsStorage = {
  // --- Categories ---
  async getCategoriesByOrg(organizationId: string) {
    return db.select().from(categories)
      .where(eq(categories.organizationId, organizationId))
      .orderBy(categories.name);
  },

  async createCategory(data: any, organizationId: string) {
    const [result] = await db.insert(categories).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async deleteCategory(id: string, organizationId: string) {
    // Delete children first
    await db.delete(categories)
      .where(and(eq(categories.parentId, id), eq(categories.organizationId, organizationId)));
    const [result] = await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.organizationId, organizationId)))
      .returning();
    return result;
  },

  // --- Payment Sources ---
  async getPaymentSourcesByOrg(organizationId: string) {
    return db.select().from(paymentSources)
      .where(eq(paymentSources.organizationId, organizationId))
      .orderBy(paymentSources.name);
  },

  async createPaymentSource(data: any, organizationId: string) {
    const [result] = await db.insert(paymentSources).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async deletePaymentSource(id: string, organizationId: string) {
    const [result] = await db.delete(paymentSources)
      .where(and(eq(paymentSources.id, id), eq(paymentSources.organizationId, organizationId)))
      .returning();
    return result;
  },

  // --- Organization ---
  async getOrganization(organizationId: string) {
    const [result] = await db.select().from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    return result;
  },

  async updateOrganization(organizationId: string, data: any) {
    const [result] = await db.update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning();
    return result;
  },
};
```

- [ ] **Step 2: Create settings routes**

```typescript
// server/modules/settings/routes.ts
import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { settingsStorage } from "./storage";
import { insertCategorySchema, insertPaymentSourceSchema, insertOrganizationSchema } from "@shared/schema";

const router = Router();
router.use(requireOrg);

// --- Categories ---
router.get("/api/categories", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await settingsStorage.getCategoriesByOrg(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/categories", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertCategorySchema.parse(req.body);
    const result = await settingsStorage.createCategory(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/categories/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await settingsStorage.deleteCategory(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Category not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Payment Sources ---
router.get("/api/payment-sources", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await settingsStorage.getPaymentSourcesByOrg(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/payment-sources", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertPaymentSourceSchema.parse(req.body);
    const result = await settingsStorage.createPaymentSource(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/payment-sources/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await settingsStorage.deletePaymentSource(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Payment source not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Organization ---
router.get("/api/organization", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await settingsStorage.getOrganization(getOrgId(req));
    if (!result) return res.status(404).json({ message: "Organization not found" });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/api/organization", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await settingsStorage.updateOrganization(getOrgId(req), req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add server/modules/settings/
git commit -m "refactor: extract settings module — categories, payment sources, org settings"
```

---

## Task 9: Restructure backend — extract clients module

**Files:**
- Create: `server/modules/clients/routes.ts`
- Create: `server/modules/clients/storage.ts`

- [ ] **Step 1: Create clients storage**

Extract client-related queries from `server/storage.ts`.

```typescript
// server/modules/clients/storage.ts
import { db } from "../../db";
import { clients, clientPermissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export const clientsStorage = {
  async getClientsByOrg(organizationId: string) {
    return db.select().from(clients)
      .where(eq(clients.organizationId, organizationId))
      .orderBy(clients.name);
  },

  async getClient(id: string, organizationId: string) {
    const [result] = await db.select().from(clients)
      .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
      .limit(1);
    return result;
  },

  async createClient(data: any, organizationId: string) {
    const [result] = await db.insert(clients).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async updateClient(id: string, data: any, organizationId: string) {
    const [result] = await db.update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
      .returning();
    return result;
  },

  async deleteClient(id: string, organizationId: string) {
    const [result] = await db.delete(clients)
      .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
      .returning();
    return result;
  },

  // --- Client Permissions ---
  async getClientPermissions(clientId: string, organizationId: string) {
    const [result] = await db.select().from(clientPermissions)
      .where(and(
        eq(clientPermissions.clientId, clientId),
        eq(clientPermissions.organizationId, organizationId)
      ))
      .limit(1);
    return result;
  },

  async upsertClientPermissions(clientId: string, data: any, organizationId: string) {
    const existing = await this.getClientPermissions(clientId, organizationId);
    if (existing) {
      const [result] = await db.update(clientPermissions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clientPermissions.id, existing.id))
        .returning();
      return result;
    }
    const [result] = await db.insert(clientPermissions).values({
      ...data,
      clientId,
      organizationId,
    }).returning();
    return result;
  },
};
```

- [ ] **Step 2: Create clients routes**

```typescript
// server/modules/clients/routes.ts
import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { clientsStorage } from "./storage";
import { insertClientSchema } from "@shared/schema";

const router = Router();
router.use(requireOrg);

router.get("/api/clients", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await clientsStorage.getClientsByOrg(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/clients", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertClientSchema.parse(req.body);
    const result = await clientsStorage.createClient(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/clients/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await clientsStorage.deleteClient(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/api/client-permissions/:clientId", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await clientsStorage.upsertClientPermissions(
      req.params.clientId, req.body, getOrgId(req)
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add server/modules/clients/
git commit -m "refactor: extract clients module — client CRUD and portal permissions"
```

---

## Task 10: Restructure backend — extract analytics module

**Files:**
- Create: `server/modules/analytics/routes.ts`
- Create: `server/modules/analytics/storage.ts`

- [ ] **Step 1: Create analytics storage**

Extract dashboard summary/trends queries from `server/storage.ts` and `server/routes.ts`. Read the existing dashboard endpoints in `server/routes.ts` to get the exact query logic.

```typescript
// server/modules/analytics/storage.ts
import { db } from "../../db";
import { income, expenses, subscriptions, clients } from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export const analyticsStorage = {
  async getDashboardSummary(organizationId: string, startDate?: string, endDate?: string) {
    // Build date filters
    const incomeFilters = [eq(income.organizationId, organizationId)];
    const expenseFilters = [eq(expenses.organizationId, organizationId)];

    if (startDate) {
      incomeFilters.push(gte(income.date, startDate));
      expenseFilters.push(gte(expenses.date, startDate));
    }
    if (endDate) {
      incomeFilters.push(lte(income.date, endDate));
      expenseFilters.push(lte(expenses.date, endDate));
    }

    const [incomeResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${income.amount}), '0')` })
      .from(income)
      .where(and(...incomeFilters));

    const [expenseResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), '0')` })
      .from(expenses)
      .where(and(...expenseFilters));

    const [recurringResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${subscriptions.amount}), '0')` })
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId));

    const totalIncome = parseFloat(incomeResult?.total || "0");
    const totalExpenses = parseFloat(expenseResult?.total || "0");
    const recurringRevenue = parseFloat(recurringResult?.total || "0");

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      recurringRevenue,
    };
  },

  async getMonthlyTrends(organizationId: string) {
    const incomeByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${income.date}::date, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${income.amount}), '0')`,
      })
      .from(income)
      .where(eq(income.organizationId, organizationId))
      .groupBy(sql`TO_CHAR(${income.date}::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${income.date}::date, 'YYYY-MM')`);

    const expensesByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${expenses.date}::date, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`,
      })
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId))
      .groupBy(sql`TO_CHAR(${expenses.date}::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${expenses.date}::date, 'YYYY-MM')`);

    return { income: incomeByMonth, expenses: expensesByMonth };
  },

  async getClientContribution(organizationId: string) {
    return db
      .select({
        clientId: income.clientId,
        clientName: clients.name,
        total: sql<string>`COALESCE(SUM(${income.amount}), '0')`,
      })
      .from(income)
      .leftJoin(clients, eq(income.clientId, clients.id))
      .where(eq(income.organizationId, organizationId))
      .groupBy(income.clientId, clients.name)
      .orderBy(desc(sql`SUM(${income.amount})`));
  },

  async getExpenseBreakdown(organizationId: string) {
    return db
      .select({
        categoryId: expenses.categoryId,
        total: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`,
      })
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId))
      .groupBy(expenses.categoryId)
      .orderBy(desc(sql`SUM(${expenses.amount})`))
      .limit(5);
  },
};
```

- [ ] **Step 2: Create analytics routes**

```typescript
// server/modules/analytics/routes.ts
import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { analyticsStorage } from "./storage";

const router = Router();
router.use(requireOrg);

router.get("/api/dashboard/summary", async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await analyticsStorage.getDashboardSummary(
      getOrgId(req),
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/dashboard/trends", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await analyticsStorage.getMonthlyTrends(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/dashboard/client-contribution", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await analyticsStorage.getClientContribution(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/dashboard/expense-breakdown", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await analyticsStorage.getExpenseBreakdown(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add server/modules/analytics/
git commit -m "refactor: extract analytics module — dashboard summary, trends, breakdowns"
```

---

## Task 11: Wire up modular backend and remove monoliths

**Files:**
- Modify: `server/index.ts`
- Delete: `server/routes.ts`
- Delete: `server/storage.ts`
- Delete: `server/storage_backup.ts`
- Delete: `server/auth.ts`

- [ ] **Step 1: Rewrite server/index.ts**

```typescript
// server/index.ts
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { clerkAuth, resolveBluxoUser } from "./middleware/clerk";
import { setupVite, serveStatic, log } from "./vite";

// Module routes
import webhookRoutes from "./modules/webhooks/routes";
import financeRoutes from "./modules/finance/routes";
import clientsRoutes from "./modules/clients/routes";
import settingsRoutes from "./modules/settings/routes";
import analyticsRoutes from "./modules/analytics/routes";

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });

  next();
});

// Webhook routes MUST come before Clerk middleware (they verify their own signatures)
app.use(webhookRoutes);

// Clerk authentication middleware — applies to all routes after this
app.use(clerkAuth);

// Resolve Clerk user/org to our DB records for all /api routes
app.use("/api", resolveBluxoUser);

// Auth check endpoint
app.get("/api/auth/user", (req: any, res) => {
  if (!req.bluxoUser) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json({
    user: req.bluxoUser,
    organization: req.bluxoOrg || null,
    membership: req.membership || null,
  });
});

// Register module routes
app.use(financeRoutes);
app.use(clientsRoutes);
app.use(settingsRoutes);
app.use(analyticsRoutes);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});

const server = createServer(app);

// Vite dev server or static serving
if (app.get("env") === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

const port = parseInt(process.env.PORT || "5000", 10);
server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
  log(`serving on port ${port}`);
});
```

- [ ] **Step 2: Delete old monolithic files**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
rm server/routes.ts server/storage.ts server/storage_backup.ts server/auth.ts
```

- [ ] **Step 3: Verify the server compiles**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
npx tsx --no-warnings server/index.ts &
sleep 5
curl -s http://localhost:3000/api/auth/user | head -c 200
kill %1
```

Expected: `{"message":"Not authenticated"}` or Clerk-related auth error (both are OK — means the server started)

- [ ] **Step 4: Commit**

```bash
git add server/ -A
git commit -m "refactor: replace monolithic routes/storage with modular architecture, wire Clerk auth"
```

---

## Task 12: Rewrite frontend auth for Clerk

**Files:**
- Modify: `client/src/main.tsx`
- Modify: `client/src/hooks/useAuth.ts`
- Create: `client/src/hooks/useActiveOrg.ts`
- Modify: `client/src/lib/queryClient.ts`
- Delete: `client/src/components/auth/AuthProvider.tsx`
- Delete: `client/src/components/auth/LoginForm.tsx`
- Delete: `client/src/components/auth/SignUpForm.tsx`
- Delete: `client/src/lib/authUtils.ts`

- [ ] **Step 1: Read current main.tsx**

Read `client/src/main.tsx` to understand the current setup before modifying.

- [ ] **Step 2: Wrap the app in ClerkProvider in main.tsx**

```tsx
// client/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#6366f1" },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Add Vite env variable for Clerk**

Add to `.env`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

Note: Vite requires the `VITE_` prefix for client-side env vars.

- [ ] **Step 4: Rewrite useAuth hook**

```typescript
// client/src/hooks/useAuth.ts
import { useUser, useOrganization, useClerk } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { signOut } = useClerk();

  return {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          name: user.fullName || "",
          avatarUrl: user.imageUrl,
        }
      : null,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug || "",
          imageUrl: organization.imageUrl,
        }
      : null,
    isLoaded: isUserLoaded && isOrgLoaded,
    isSignedIn: !!isSignedIn,
    signOut: () => signOut(),
  };
}
```

- [ ] **Step 5: Create useActiveOrg hook**

```typescript
// client/src/hooks/useActiveOrg.ts
import { useOrganization, useOrganizationList } from "@clerk/clerk-react";

export function useActiveOrg() {
  const { organization, isLoaded } = useOrganization();
  const { userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const orgCount = userMemberships.data?.length || 0;
  const isHQMode = !organization && orgCount > 1;
  const hasMultipleOrgs = orgCount > 1;

  return {
    activeOrg: organization,
    isLoaded,
    isHQMode,
    hasMultipleOrgs,
    orgCount,
    memberships: userMemberships.data || [],
  };
}
```

- [ ] **Step 6: Update queryClient.ts to attach Clerk token**

Read the existing `client/src/lib/queryClient.ts`, then replace the `apiRequest` function:

```typescript
// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  // Clerk automatically includes credentials via cookies
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: (options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});
```

- [ ] **Step 7: Delete old auth files**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
rm -f client/src/components/auth/AuthProvider.tsx \
      client/src/components/auth/LoginForm.tsx \
      client/src/components/auth/SignUpForm.tsx \
      client/src/lib/authUtils.ts \
      client/src/pages/Login.tsx \
      client/src/pages/Signup.tsx \
      client/src/pages/AcceptInvitation.tsx \
      client/src/pages/InviteAcceptance.tsx \
      client/src/pages/DebugInvitation.tsx \
      client/src/pages/Index.tsx \
      client/src/pages/Expenses_broken.tsx \
      client/src/components/debug/CategoriesDebug.tsx \
      client/src/components/debug/InvitationDebug.tsx \
      client/src/components/invitation/InvitationAcceptanceForm.tsx \
      client/src/components/invitation/__tests__/InvitationAcceptanceForm.test.tsx
```

- [ ] **Step 8: Commit**

```bash
git add -A client/src/
git commit -m "feat: replace custom auth with Clerk — rewrite useAuth, useActiveOrg, queryClient"
```

---

## Task 13: Rewrite App.tsx with org-scoped routing

**Files:**
- Modify: `client/src/App.tsx`
- Create: `client/src/components/auth/ProtectedRoute.tsx` (rewrite)

- [ ] **Step 1: Read current App.tsx**

Read `client/src/App.tsx` to understand all existing routes.

- [ ] **Step 2: Rewrite ProtectedRoute for Clerk**

```tsx
// client/src/components/auth/ProtectedRoute.tsx
import { useAuth } from "@clerk/clerk-react";
import { SignIn } from "@clerk/clerk-react";
import { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <SignIn routing="hash" />
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Rewrite App.tsx with org-scoped routes**

```tsx
// client/src/App.tsx
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useActiveOrg } from "./hooks/useActiveOrg";

// Layout
import { DashboardLayout } from "./components/layout/DashboardLayout";

// Pages — these will be migrated to modules/ incrementally
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Subscriptions from "./pages/Subscriptions";
import Clients from "./pages/clients";
import Employees from "./pages/employees";
import EmployeeExpenses from "./pages/EmployeeExpenses";
import NotFound from "./pages/NotFound";

// Settings
import ProfileSettings from "./pages/settings/ProfileSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import OrganizationSettings from "./pages/settings/OrganizationSettings";
import CategoriesSettings from "./pages/settings/CategoriesSettings";
import PaymentSourcesSettings from "./pages/settings/PaymentSourcesSettings";
import UserManagementSettings from "./pages/settings/UserManagementSettings";

// HQ (stub)
function CommandCenter() {
  return <div className="p-6"><h1 className="text-2xl font-bold">HQ Command Center</h1><p className="text-muted-foreground mt-2">Coming in a future update.</p></div>;
}

function OrgRouter() {
  const { activeOrg, isLoaded, hasMultipleOrgs } = useActiveOrg();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If no org selected and user has orgs, prompt to select one
  if (!activeOrg) {
    if (hasMultipleOrgs) {
      // Show HQ mode
      return (
        <DashboardLayout>
          <Switch>
            <Route path="/hq" component={CommandCenter} />
            <Route path="/hq/organizations">
              <div className="p-6"><h1 className="text-2xl font-bold">Organizations</h1></div>
            </Route>
            <Route>
              <Redirect to="/hq" />
            </Route>
          </Switch>
        </DashboardLayout>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Bluxo</h1>
          <p className="text-muted-foreground">Create or join an organization to get started.</p>
        </div>
      </div>
    );
  }

  // Org is selected — render org-scoped routes
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/income" component={Income} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/clients" component={Clients} />
        <Route path="/employees" component={Employees} />
        <Route path="/employees/:employeeId/expenses" component={EmployeeExpenses} />
        <Route path="/settings/profile" component={ProfileSettings} />
        <Route path="/settings/security" component={SecuritySettings} />
        <Route path="/settings/organization" component={OrganizationSettings} />
        <Route path="/settings/categories" component={CategoriesSettings} />
        <Route path="/settings/payment-sources" component={PaymentSourcesSettings} />
        <Route path="/settings/user-management" component={UserManagementSettings} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="bluxo-theme">
        <Switch>
          <Route path="/sign-in">
            <div className="flex items-center justify-center min-h-screen bg-background">
              <SignIn routing="hash" />
            </div>
          </Route>
          <Route path="/sign-up">
            <div className="flex items-center justify-center min-h-screen bg-background">
              <SignUp routing="hash" />
            </div>
          </Route>
          <Route>
            <ProtectedRoute>
              <OrgRouter />
            </ProtectedRoute>
          </Route>
        </Switch>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/components/auth/ProtectedRoute.tsx
git commit -m "feat: rewrite App.tsx with Clerk auth, org-scoped routing, HQ mode stub"
```

---

## Task 14: Update sidebar with org switcher and Bluxo branding

**Files:**
- Modify: `client/src/components/layout/Layout.tsx`
- Create: `client/src/components/layout/OrgSwitcher.tsx`

- [ ] **Step 1: Read current Layout.tsx**

Read `client/src/components/layout/Layout.tsx` to understand the full sidebar structure.

- [ ] **Step 2: Create OrgSwitcher component**

```tsx
// client/src/components/layout/OrgSwitcher.tsx
import { OrganizationSwitcher } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

export function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      appearance={{
        baseTheme: dark,
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger:
            "w-full justify-start px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white",
          organizationPreviewMainIdentifier: "text-white font-medium",
          organizationPreviewSecondaryIdentifier: "text-slate-400",
          organizationSwitcherPopoverCard: "bg-slate-900 border-slate-700",
          organizationSwitcherPopoverActions: "bg-slate-800",
        },
      }}
      hidePersonal={true}
      afterSelectOrganizationUrl="/"
      afterCreateOrganizationUrl="/"
    />
  );
}
```

- [ ] **Step 3: Update Layout.tsx**

Read the current Layout.tsx. Then apply these changes:

1. Replace the "FIN" logo text with "Bluxo"
2. Replace the user profile section at the bottom with Clerk's `<UserButton />`
3. Add the `<OrgSwitcher />` component below the logo
4. Remove the old logout button (Clerk handles this)
5. Remove role-based filtering that depends on old user model (will be re-added in Plan 2 with real permissions)
6. Update the navigation items to match the new sidebar structure:

```tsx
// Navigation items for the sidebar (inside Layout.tsx)
const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Income", href: "/income", icon: DollarSign },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Subscriptions", href: "/subscriptions", icon: RefreshCw },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "People", href: "/employees", icon: UserCircle },
];

const settingsItems = [
  { name: "Profile", href: "/settings/profile" },
  { name: "Organization", href: "/settings/organization" },
  { name: "Categories", href: "/settings/categories" },
  { name: "Payment Sources", href: "/settings/payment-sources" },
  { name: "User Management", href: "/settings/user-management" },
];
```

The key structural changes to Layout.tsx sidebar:

```tsx
{/* Top of sidebar */}
<div className="p-4">
  <h1 className="text-xl font-bold text-white mb-4">Bluxo</h1>
  <OrgSwitcher />
</div>

{/* ... navigation items ... */}

{/* Bottom of sidebar — replace old user card with Clerk UserButton */}
<div className="p-4 border-t border-slate-700">
  <UserButton
    appearance={{
      baseTheme: dark,
      elements: {
        userButtonBox: "w-full",
        userButtonTrigger: "w-full justify-start",
      },
    }}
  />
</div>
```

Import at the top of Layout.tsx:

```tsx
import { UserButton } from "@clerk/clerk-react";
import { OrgSwitcher } from "./OrgSwitcher";
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/
git commit -m "feat: add org switcher to sidebar, rebrand to Bluxo, replace auth UI with Clerk"
```

---

## Task 15: Rebrand FIN to Bluxo everywhere

**Files:**
- Multiple files across the codebase

- [ ] **Step 1: Find all "FIN" references**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
grep -ri "\"FIN\"\|>FIN<\|'FIN'\| FIN " client/src/ --include="*.tsx" --include="*.ts" -l
```

- [ ] **Step 2: Replace all FIN branding in found files**

For each file found, replace "FIN" with "Bluxo" in branding contexts (logo text, page titles, etc.). Do NOT replace "FIN" in variable names or CSS class names — only user-visible branding.

- [ ] **Step 3: Update page title in index.html**

Read and update `client/index.html` — change `<title>` to "Bluxo".

- [ ] **Step 4: Update package.json name**

Change `"name": "rest-express"` to `"name": "bluxo"`.

- [ ] **Step 5: Verify no FIN branding remains**

```bash
grep -ri "\"FIN\"\|>FIN<\|'FIN'" client/src/ --include="*.tsx" --include="*.ts"
```

Expected: No results (or only false positives like "FIND", "FINISH", etc.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: rebrand FIN to Bluxo across entire codebase"
```

---

## Task 16: Create stub frontend permission utilities

**Files:**
- Create: `client/src/lib/permissions.ts`
- Create: `client/src/hooks/usePermissions.ts`
- Create: `client/src/components/shared/PermissionGate.tsx`

- [ ] **Step 1: Create frontend permissions utility**

```typescript
// client/src/lib/permissions.ts
import { MODULES, type ModuleName } from "@shared/permissions";

// Re-export for convenient frontend usage
export { MODULES, type ModuleName };

// Stub: in Plan 2, this will check against the user's role permissions
export function hasModuleAccess(module: ModuleName): boolean {
  // Allow all access in Plan 1 — permissions enforced in Plan 2
  return true;
}
```

- [ ] **Step 2: Create usePermissions hook**

```typescript
// client/src/hooks/usePermissions.ts
import { type ModuleName } from "@shared/permissions";

export function usePermissions() {
  // Stub: Plan 2 will fetch role_permissions from the API
  return {
    canAccess: (module: ModuleName) => true,
    isOwner: false,
    isLoaded: true,
  };
}
```

- [ ] **Step 3: Create PermissionGate component**

```tsx
// client/src/components/shared/PermissionGate.tsx
import { ReactNode } from "react";
import { type ModuleName } from "@shared/permissions";
import { usePermissions } from "../../hooks/usePermissions";

interface PermissionGateProps {
  module: ModuleName;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ module, children, fallback = null }: PermissionGateProps) {
  const { canAccess } = usePermissions();

  if (!canAccess(module)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/permissions.ts client/src/hooks/usePermissions.ts client/src/components/shared/PermissionGate.tsx
git commit -m "feat: add stub permission utilities for frontend — PermissionGate, usePermissions"
```

---

## Task 17: Update Vite config for Clerk and verify full build

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Read current vite.config.ts**

Read `vite.config.ts` to understand current setup.

- [ ] **Step 2: Ensure shared/ alias works and Clerk env is exposed**

The `@shared/*` alias should already be configured. Verify it resolves `@shared/permissions`. If not, add it.

Also ensure the Clerk publishable key is available client-side — Vite automatically exposes `VITE_*` env vars, and we already added `VITE_CLERK_PUBLISHABLE_KEY` in Task 12.

- [ ] **Step 3: Run a full build to verify everything compiles**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Fix any compile errors**

If there are errors, they will likely be:
- Missing imports (old auth references)
- Type mismatches from schema changes (`employees` -> `people`, `employeeId` -> `personId`)
- Stale references to deleted files

Fix each error, then re-run the build.

- [ ] **Step 5: Start the dev server and verify it loads**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
npm run dev
```

Open http://localhost:3000 — should see Clerk sign-in page. After signing in and creating an org, should see the Bluxo dashboard with org switcher.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: resolve all compile errors, verify full build with Clerk + modular backend"
```

---

## Task 18: Clean up and final verification

- [ ] **Step 1: Remove unused dependencies from node_modules**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
npm prune
```

- [ ] **Step 2: Verify .gitignore includes .env**

```bash
grep "\.env" .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 3: Push schema to database**

```bash
DATABASE_URL="postgresql://jahanzaibsohail@localhost:5432/bluxo" npx drizzle-kit push
```

- [ ] **Step 4: Run the full application**

```bash
npm run dev
```

Verify:
1. Clerk sign-in page appears at http://localhost:3000
2. After sign-in, org creation/selection works
3. Dashboard loads with org context
4. Income, Expenses, Subscriptions, Clients pages load
5. Settings pages load
6. Org switcher in sidebar works
7. "Bluxo" branding appears (not "FIN")

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: clean up — prune deps, verify .gitignore, finalize foundation"
```

---

## Summary

After completing this plan, Bluxo will have:

- **Clerk authentication** replacing all custom JWT/passport auth
- **Multi-org data model** with Clerk-synced users, organizations, and memberships
- **Modular backend** — 5 domain modules replacing the monolithic routes.ts/storage.ts
- **Org switcher** in the sidebar powered by Clerk
- **Org-scoped routing** — all API calls scoped to active organization
- **HQ mode stub** — routing and detection in place for multi-org users
- **Permission stubs** — PermissionGate, usePermissions, middleware ready for Plan 2
- **Bluxo branding** — FIN renamed everywhere
- **Supabase-ready** — pg driver works with both local PostgreSQL and Supabase

**Next:** Plan 2 (Roles & Permissions + Finance Module) builds on this foundation.
