# Roles & Permissions + Finance Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add custom roles with per-module permissions (Full/Exclusive + granular toggles), a User Management UI (Users/Teams/Roles tabs), invoicing, tax rules, expense approval workflow, and accounting views.

**Architecture:** Extend the schema with 8 new tables (roles, role_permissions, teams, team_members, invoices, invoice_line_items, tax_rules, currency_rates). Enhance the existing income/expenses tables with tax and approval fields. Replace the permission stubs with real DB lookups. Build settings UI for roles and tax rules. Build a new Invoicing page and Accounting reporting page.

**Tech Stack:** Drizzle ORM, Express.js, React 18, TanStack React Query, Radix UI/shadcn, Tailwind CSS, Clerk, Zod

**Spec:** `docs/superpowers/specs/2026-04-03-bluxo-multi-org-platform-design.md` — Sections 3 and 4

**Depends on:** Plan 1 (Foundation) — completed.

---

## File Structure

### New files to create

```
shared/
  schema/
    roles.ts               — roles, role_permissions, teams, team_members tables
    invoices.ts            — invoices, invoice_line_items tables
    tax.ts                 — tax_rules, currency_rates tables

server/modules/
  roles/
    routes.ts              — CRUD for roles, role_permissions, teams, user-role assignment
    storage.ts             — Role/permission DB queries
  invoicing/
    routes.ts              — Invoice CRUD, status transitions, line items
    storage.ts             — Invoice DB queries
  tax/
    routes.ts              — Tax rules CRUD, currency rates
    storage.ts             — Tax DB queries

client/src/modules/
  settings/
    pages/
      UserManagementPage.tsx    — Users/Teams/Roles tabs container
      RolesTab.tsx              — Role list + create/edit modal with permission toggles
      UsersTab.tsx              — User table with role assignment
      TeamsTab.tsx              — Team CRUD with member management
      TaxRulesSettings.tsx      — Tax rules CRUD page
    components/
      RolePermissionEditor.tsx  — Modal with per-module Full/Exclusive toggles
  finance/
    pages/
      InvoicingPage.tsx         — Invoice list with filters
      InvoiceDetail.tsx         — Single invoice view/edit
      InvoiceBuilder.tsx        — Create invoice form with line items
      AccountingPage.tsx        — P&L, Tax Summary, Cash Flow tabs
    components/
      ExpenseApprovalBadge.tsx  — Approval status badge + actions
      TaxBadge.tsx              — Shows tax amount/rule on transactions
```

### Files to modify

```
shared/schema.ts                — Import and re-export new schema modules; extend income/expenses
server/index.ts                 — Register new route modules (roles, invoicing, tax)
server/middleware/permissions.ts — Replace stub with real role_permissions lookup
server/modules/finance/routes.ts — Add approval endpoints, tax fields on create/update
server/modules/finance/storage.ts — Add approval queries, tax field handling
server/modules/settings/routes.ts — Add tax rules endpoints
client/src/hooks/usePermissions.ts — Fetch real permissions from API
client/src/components/layout/Layout.tsx — Add Invoicing + Accounting nav items, permission-gate sidebar
client/src/App.tsx               — Add routes for new pages
client/src/pages/Expenses.tsx    — Add approval status column and actions
```

---

## Task 1: Add roles and permissions tables to schema

**Files:**
- Create: `shared/schema/roles.ts`
- Modify: `shared/schema.ts`

- [ ] **Step 1: Create roles schema module**

```typescript
// shared/schema/roles.ts
import {
  pgTable, uuid, varchar, text, boolean, timestamp, jsonb, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { organizations } from "../schema";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  module: varchar("module", {
    enum: [
      "dashboard", "finance", "people", "clients", "analytics",
      "settings", "integrations", "data_room", "payroll", "invoicing",
    ],
  }).notNull(),
  enabled: boolean("enabled").default(true),
  accessLevel: varchar("access_level", { enum: ["full", "exclusive"] }).default("full"),
  additionalPerms: jsonb("additional_perms").$type<Record<string, boolean>>(),
}, (table) => [
  uniqueIndex("role_module_unique").on(table.roleId, table.module),
]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("team_user_unique").on(table.teamId, table.userId),
]);

// Relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  permissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

// Zod schemas
export const insertRoleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const insertRolePermissionSchema = z.object({
  module: z.enum([
    "dashboard", "finance", "people", "clients", "analytics",
    "settings", "integrations", "data_room", "payroll", "invoicing",
  ]),
  enabled: z.boolean().default(true),
  accessLevel: z.enum(["full", "exclusive"]).default("full"),
  additionalPerms: z.record(z.boolean()).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(insertRolePermissionSchema),
});

export const insertTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

// Types
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
```

- [ ] **Step 2: Import and re-export from main schema**

In `shared/schema.ts`, add at the top after existing imports:

```typescript
// Re-export role/permission schema
export * from "./schema/roles";
```

- [ ] **Step 3: Push schema to database**

```bash
cd /Users/jahanzaibsohail/Desktop/Code\ Projects/bluxo
npx drizzle-kit push
```

- [ ] **Step 4: Commit**

```bash
git add shared/schema/roles.ts shared/schema.ts
git commit -m "feat: add roles, role_permissions, teams, team_members tables"
```

---

## Task 2: Add tax rules and currency rates tables

**Files:**
- Create: `shared/schema/tax.ts`
- Modify: `shared/schema.ts`

- [ ] **Step 1: Create tax schema module**

```typescript
// shared/schema/tax.ts
import {
  pgTable, uuid, varchar, text, boolean, timestamp, decimal, date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { organizations } from "../schema";

export const taxRules = pgTable("tax_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  type: varchar("type", { enum: ["inclusive", "exclusive"] }).default("exclusive"),
  country: varchar("country", { length: 3 }),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currencyRates = pgTable("currency_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
  targetCurrency: varchar("target_currency", { length: 3 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(),
  source: varchar("source", { enum: ["manual", "api"] }).default("manual"),
  effectiveDate: date("effective_date").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taxRulesRelations = relations(taxRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [taxRules.organizationId],
    references: [organizations.id],
  }),
}));

export const currencyRatesRelations = relations(currencyRates, ({ one }) => ({
  organization: one(organizations, {
    fields: [currencyRates.organizationId],
    references: [organizations.id],
  }),
}));

// Zod schemas
export const insertTaxRuleSchema = z.object({
  name: z.string().min(1),
  rate: z.string(),
  type: z.enum(["inclusive", "exclusive"]).default("exclusive"),
  country: z.string().max(3).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const insertCurrencyRateSchema = z.object({
  baseCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  rate: z.string(),
  source: z.enum(["manual", "api"]).default("manual"),
  effectiveDate: z.string(),
});

// Types
export type TaxRule = typeof taxRules.$inferSelect;
export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertTaxRule = z.infer<typeof insertTaxRuleSchema>;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
```

- [ ] **Step 2: Re-export from main schema**

In `shared/schema.ts`, add:

```typescript
export * from "./schema/tax";
```

- [ ] **Step 3: Push schema and commit**

```bash
npx drizzle-kit push
git add shared/schema/tax.ts shared/schema.ts
git commit -m "feat: add tax_rules and currency_rates tables"
```

---

## Task 3: Add invoices tables to schema

**Files:**
- Create: `shared/schema/invoices.ts`
- Modify: `shared/schema.ts`

- [ ] **Step 1: Create invoices schema module**

```typescript
// shared/schema/invoices.ts
import {
  pgTable, uuid, varchar, text, boolean, timestamp, decimal, date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { organizations, clients, people } from "../schema";
import { taxRules } from "./tax";

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  type: varchar("type", { enum: ["outgoing", "incoming"] }).notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  personId: uuid("person_id").references(() => people.id),
  status: varchar("status", {
    enum: ["draft", "sent", "viewed", "paid", "overdue", "cancelled"],
  }).default("draft"),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  notes: text("notes"),
  attachmentUrl: varchar("attachment_url"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  taxRuleId: uuid("tax_rule_id").references(() => taxRules.id),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0"),
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  person: one(people, {
    fields: [invoices.personId],
    references: [people.id],
  }),
  lineItems: many(invoiceLineItems),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  taxRule: one(taxRules, {
    fields: [invoiceLineItems.taxRuleId],
    references: [taxRules.id],
  }),
}));

// Zod schemas
export const insertInvoiceSchema = z.object({
  type: z.enum(["outgoing", "incoming"]),
  clientId: z.string().uuid().optional().nullable(),
  personId: z.string().uuid().optional().nullable(),
  status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).default("draft"),
  issueDate: z.string(),
  dueDate: z.string().optional().nullable(),
  currency: z.string().length(3).default("USD"),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string().optional(),
    quantity: z.string().default("1"),
    unitPrice: z.string(),
    taxRuleId: z.string().uuid().optional().nullable(),
  })),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]),
});

// Types
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
```

- [ ] **Step 2: Re-export from main schema**

```typescript
export * from "./schema/invoices";
```

- [ ] **Step 3: Push schema and commit**

```bash
npx drizzle-kit push
git add shared/schema/invoices.ts shared/schema.ts
git commit -m "feat: add invoices and invoice_line_items tables"
```

---

## Task 4: Extend income/expenses with tax and approval fields

**Files:**
- Modify: `shared/schema.ts`

- [ ] **Step 1: Read current income and expenses table definitions**

Read `shared/schema.ts` and find the `income` and `expenses` table definitions.

- [ ] **Step 2: Add tax and approval fields to income table**

Add these columns to the `income` table definition:

```typescript
taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
taxRuleId: uuid("tax_rule_id"),
dueDate: date("due_date"),
paymentStatus: varchar("payment_status", {
  enum: ["pending", "partial", "paid", "overdue"],
}).default("paid"),
```

- [ ] **Step 3: Add tax and approval fields to expenses table**

Add these columns to the `expenses` table definition:

```typescript
taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
taxRuleId: uuid("tax_rule_id"),
approvalStatus: varchar("approval_status", {
  enum: ["pending", "approved", "rejected"],
}).default("approved"),
approvedById: varchar("approved_by_id"),
```

- [ ] **Step 4: Update Zod schemas**

Update `insertIncomeSchema` to include:

```typescript
taxAmount: z.string().optional(),
taxRuleId: z.string().uuid().optional().nullable(),
dueDate: z.string().optional().nullable(),
paymentStatus: z.enum(["pending", "partial", "paid", "overdue"]).optional(),
```

Update `insertExpenseSchema` to include:

```typescript
taxAmount: z.string().optional(),
taxRuleId: z.string().uuid().optional().nullable(),
approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
```

- [ ] **Step 5: Push schema and commit**

```bash
npx drizzle-kit push
git add shared/schema.ts
git commit -m "feat: add tax and approval fields to income and expenses tables"
```

---

## Task 5: Create roles backend module

**Files:**
- Create: `server/modules/roles/storage.ts`
- Create: `server/modules/roles/routes.ts`

- [ ] **Step 1: Create roles storage**

```typescript
// server/modules/roles/storage.ts
import { db } from "../../db";
import {
  roles, rolePermissions, teams, teamMembers,
  orgMemberships, users,
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS, type ModuleName } from "@shared/permissions";

export const rolesStorage = {
  // --- Roles ---
  async getRolesByOrg(organizationId: string) {
    return db.select().from(roles)
      .where(eq(roles.organizationId, organizationId))
      .orderBy(roles.name);
  },

  async getRoleById(id: string, organizationId: string) {
    const [role] = await db.select().from(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)))
      .limit(1);
    return role;
  },

  async getRoleWithPermissions(id: string, organizationId: string) {
    const role = await this.getRoleById(id, organizationId);
    if (!role) return null;
    const perms = await db.select().from(rolePermissions)
      .where(eq(rolePermissions.roleId, id));
    return { ...role, permissions: perms };
  },

  async createRole(data: { name: string; description?: string }, organizationId: string) {
    const [role] = await db.insert(roles).values({
      ...data,
      organizationId,
    }).returning();
    return role;
  },

  async updateRole(id: string, data: { name?: string; description?: string }, organizationId: string) {
    const [role] = await db.update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId), eq(roles.isSystemRole, false)))
      .returning();
    return role;
  },

  async deleteRole(id: string, organizationId: string) {
    // Don't allow deleting system roles
    const [role] = await db.delete(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId), eq(roles.isSystemRole, false)))
      .returning();
    return role;
  },

  // --- Role Permissions ---
  async setRolePermissions(roleId: string, permissions: Array<{
    module: string; enabled: boolean; accessLevel: string; additionalPerms?: Record<string, boolean>;
  }>) {
    // Delete existing permissions for this role
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    if (permissions.length === 0) return [];

    // Insert new permissions
    const values = permissions.map((p) => ({
      roleId,
      module: p.module as any,
      enabled: p.enabled,
      accessLevel: p.accessLevel as any,
      additionalPerms: p.additionalPerms || null,
    }));

    return db.insert(rolePermissions).values(values).returning();
  },

  async getPermissionsForRole(roleId: string) {
    return db.select().from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
  },

  // --- System Role Seeding ---
  async seedSystemRoles(organizationId: string) {
    const existingRoles = await this.getRolesByOrg(organizationId);
    if (existingRoles.some((r) => r.isSystemRole)) return; // Already seeded

    for (const [key, roleName] of Object.entries(SYSTEM_ROLES)) {
      const [role] = await db.insert(roles).values({
        name: roleName.charAt(0).toUpperCase() + roleName.slice(1).replace(/_/g, " "),
        isSystemRole: true,
        organizationId,
      }).returning();

      // Set default permissions from the constants
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleName as keyof typeof DEFAULT_ROLE_PERMISSIONS];
      const permEntries = Object.entries(defaultPerms).map(([mod, access]) => ({
        roleId: role.id,
        module: mod as any,
        enabled: access !== false,
        accessLevel: (access === "exclusive" ? "exclusive" : "full") as any,
        additionalPerms: null,
      }));

      if (permEntries.length > 0) {
        await db.insert(rolePermissions).values(permEntries);
      }
    }
  },

  // --- User Role Assignment ---
  async assignRoleToUser(clerkUserId: string, roleId: string, organizationId: string) {
    const [membership] = await db.update(orgMemberships)
      .set({ customRoleId: roleId })
      .where(and(
        eq(orgMemberships.clerkUserId, clerkUserId),
        eq(orgMemberships.organizationId, organizationId),
      ))
      .returning();
    return membership;
  },

  async getUsersWithRoles(organizationId: string) {
    const memberships = await db
      .select({
        membershipId: orgMemberships.id,
        clerkUserId: orgMemberships.clerkUserId,
        isOwner: orgMemberships.isOwner,
        roleId: orgMemberships.customRoleId,
        status: orgMemberships.status,
        userId: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(orgMemberships)
      .leftJoin(users, eq(orgMemberships.clerkUserId, users.clerkUserId))
      .where(and(
        eq(orgMemberships.organizationId, organizationId),
        eq(orgMemberships.status, "active"),
      ));

    // Attach role names
    const roleIds = [...new Set(memberships.filter((m) => m.roleId).map((m) => m.roleId!))];
    const roleMap: Record<string, string> = {};
    if (roleIds.length > 0) {
      const roleRows = await db.select().from(roles).where(
        sql`${roles.id} IN (${sql.join(roleIds.map((id) => sql`${id}`), sql`, `)})`
      );
      for (const r of roleRows) roleMap[r.id] = r.name;
    }

    return memberships.map((m) => ({
      ...m,
      roleName: m.isOwner ? "Owner" : (m.roleId ? roleMap[m.roleId] || "No Role" : "No Role"),
    }));
  },

  // --- Teams ---
  async getTeamsByOrg(organizationId: string) {
    const teamList = await db.select().from(teams)
      .where(eq(teams.organizationId, organizationId))
      .orderBy(teams.name);

    // Get member counts
    const result = [];
    for (const team of teamList) {
      const members = await db.select().from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      result.push({ ...team, memberCount: members.length });
    }
    return result;
  },

  async createTeam(data: { name: string; description?: string }, organizationId: string) {
    const [team] = await db.insert(teams).values({
      ...data,
      organizationId,
    }).returning();
    return team;
  },

  async deleteTeam(id: string, organizationId: string) {
    const [team] = await db.delete(teams)
      .where(and(eq(teams.id, id), eq(teams.organizationId, organizationId)))
      .returning();
    return team;
  },

  async addTeamMember(teamId: string, userId: string, organizationId: string) {
    const [member] = await db.insert(teamMembers).values({
      teamId, userId, organizationId,
    }).onConflictDoNothing().returning();
    return member;
  },

  async removeTeamMember(teamId: string, userId: string) {
    const [member] = await db.delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return member;
  },
};
```

- [ ] **Step 2: Create roles routes**

```typescript
// server/modules/roles/routes.ts
import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { rolesStorage } from "./storage";
import { insertRoleSchema, updateRolePermissionsSchema, insertTeamSchema } from "@shared/schema";

const router = Router();
router.use("/api", requireOrg);

// --- Roles ---
router.get("/api/roles", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    // Seed system roles on first access
    await rolesStorage.seedSystemRoles(orgId);
    const result = await rolesStorage.getRolesByOrg(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/roles/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await rolesStorage.getRoleWithPermissions(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Role not found" });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/roles", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertRoleSchema.parse(req.body);
    const result = await rolesStorage.createRole(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/api/roles/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await rolesStorage.updateRole(req.params.id, req.body, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Role not found or is a system role" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/roles/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await rolesStorage.deleteRole(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Role not found or is a system role" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Role Permissions ---
router.put("/api/roles/:id/permissions", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = updateRolePermissionsSchema.parse(req.body);
    const role = await rolesStorage.getRoleById(req.params.id, getOrgId(req));
    if (!role) return res.status(404).json({ message: "Role not found" });
    const result = await rolesStorage.setRolePermissions(req.params.id, parsed.permissions);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// --- User Role Assignment ---
router.get("/api/org-users", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await rolesStorage.getUsersWithRoles(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/api/org-users/:clerkUserId/role", async (req: AuthenticatedRequest, res) => {
  try {
    const { roleId } = req.body;
    const result = await rolesStorage.assignRoleToUser(req.params.clerkUserId, roleId, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Membership not found" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// --- Teams ---
router.get("/api/teams", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await rolesStorage.getTeamsByOrg(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/teams", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertTeamSchema.parse(req.body);
    const result = await rolesStorage.createTeam(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/teams/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await rolesStorage.deleteTeam(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Team not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/teams/:id/members", async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.body;
    const result = await rolesStorage.addTeamMember(req.params.id, userId, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/teams/:id/members/:userId", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await rolesStorage.removeTeamMember(req.params.id, req.params.userId);
    if (!result) return res.status(404).json({ message: "Member not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

- [ ] **Step 3: Register in server/index.ts**

Add import and registration in `server/index.ts`:

```typescript
import rolesRoutes from "./modules/roles/routes";
// ... after other route registrations:
app.use(rolesRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/modules/roles/ server/index.ts
git commit -m "feat: add roles backend — CRUD for roles, permissions, teams, user-role assignment"
```

---

## Task 6: Implement real permission checking middleware

**Files:**
- Modify: `server/middleware/permissions.ts`

- [ ] **Step 1: Read current permissions.ts**

Read `server/middleware/permissions.ts` to see the stubs.

- [ ] **Step 2: Replace with real implementation**

```typescript
// server/middleware/permissions.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./clerk";
import { ModuleName } from "@shared/permissions";
import { db } from "../db";
import { rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";

// Cache permissions per request to avoid multiple DB lookups
async function loadPermissions(req: AuthenticatedRequest): Promise<Map<string, { enabled: boolean; accessLevel: string; additionalPerms: Record<string, boolean> | null }>> {
  // Check if already loaded on this request
  if ((req as any)._permissionsCache) return (req as any)._permissionsCache;

  const cache = new Map<string, { enabled: boolean; accessLevel: string; additionalPerms: Record<string, boolean> | null }>();

  // Owners get full access to everything
  if (req.membership?.isOwner) {
    const allModules: ModuleName[] = [
      "dashboard", "finance", "people", "clients", "analytics",
      "settings", "integrations", "data_room", "payroll", "invoicing",
    ];
    for (const mod of allModules) {
      cache.set(mod, { enabled: true, accessLevel: "full", additionalPerms: null });
    }
    (req as any)._permissionsCache = cache;
    return cache;
  }

  // Load permissions from the user's custom role
  const roleId = req.membership?.customRoleId;
  if (roleId) {
    const perms = await db.select().from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    for (const p of perms) {
      cache.set(p.module, {
        enabled: p.enabled ?? true,
        accessLevel: p.accessLevel ?? "full",
        additionalPerms: p.additionalPerms as Record<string, boolean> | null,
      });
    }
  }

  (req as any)._permissionsCache = cache;
  return cache;
}

export function requireModule(moduleName: ModuleName) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.bluxoUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // If no membership (no org selected), deny
    if (!req.membership) {
      return res.status(403).json({ message: "No organization membership" });
    }

    // Owners always have access
    if (req.membership.isOwner) {
      return next();
    }

    // If no custom role assigned, deny access to protected modules
    if (!req.membership.customRoleId) {
      return res.status(403).json({ message: "No role assigned. Contact your organization admin." });
    }

    const perms = await loadPermissions(req);
    const modulePerm = perms.get(moduleName);

    if (!modulePerm || !modulePerm.enabled) {
      return res.status(403).json({ message: `Access denied to ${moduleName} module` });
    }

    // Attach access level for route handlers to use
    (req as any).moduleAccessLevel = modulePerm.accessLevel;
    (req as any).moduleAdditionalPerms = modulePerm.additionalPerms;

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

// API endpoint to get current user's permissions (used by frontend)
export async function getUserPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.bluxoUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.membership) {
      return res.json({ permissions: {}, isOwner: false, roleName: null });
    }

    if (req.membership.isOwner) {
      const allPerms: Record<string, any> = {};
      const allModules: ModuleName[] = [
        "dashboard", "finance", "people", "clients", "analytics",
        "settings", "integrations", "data_room", "payroll", "invoicing",
      ];
      for (const mod of allModules) {
        allPerms[mod] = { enabled: true, accessLevel: "full", additionalPerms: null };
      }
      return res.json({ permissions: allPerms, isOwner: true, roleName: "Owner" });
    }

    const perms = await loadPermissions(req);
    const permObj: Record<string, any> = {};
    for (const [key, val] of perms) {
      permObj[key] = val;
    }

    // Get role name
    let roleName = "No Role";
    if (req.membership.customRoleId) {
      const { roles } = await import("@shared/schema");
      const [role] = await db.select().from(roles)
        .where(eq(roles.id, req.membership.customRoleId));
      if (role) roleName = role.name;
    }

    res.json({ permissions: permObj, isOwner: false, roleName });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

- [ ] **Step 3: Register the permissions API endpoint in server/index.ts**

Add after the existing `/api/auth/user` endpoint:

```typescript
import { getUserPermissions } from "./middleware/permissions";

// Add this route:
app.get("/api/auth/permissions", getUserPermissions);
```

- [ ] **Step 4: Commit**

```bash
git add server/middleware/permissions.ts server/index.ts
git commit -m "feat: implement real permission checking — role_permissions DB lookup with caching"
```

---

## Task 7: Rewrite frontend usePermissions hook

**Files:**
- Modify: `client/src/hooks/usePermissions.ts`

- [ ] **Step 1: Rewrite with real API call**

```typescript
// client/src/hooks/usePermissions.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { type ModuleName } from "@shared/permissions";

interface PermissionData {
  enabled: boolean;
  accessLevel: "full" | "exclusive";
  additionalPerms: Record<string, boolean> | null;
}

interface PermissionsResponse {
  permissions: Record<string, PermissionData>;
  isOwner: boolean;
  roleName: string | null;
}

export function usePermissions() {
  const { isSignedIn, organization } = useAuth();

  const { data, isLoading } = useQuery<PermissionsResponse>({
    queryKey: ["/api/auth/permissions", organization?.id],
    enabled: !!isSignedIn && !!organization,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const canAccess = (module: ModuleName): boolean => {
    if (!data) return false;
    if (data.isOwner) return true;
    return data.permissions[module]?.enabled ?? false;
  };

  const getAccessLevel = (module: ModuleName): "full" | "exclusive" | null => {
    if (!data) return null;
    if (data.isOwner) return "full";
    return data.permissions[module]?.accessLevel ?? null;
  };

  const hasAdditionalPerm = (module: ModuleName, perm: string): boolean => {
    if (!data) return false;
    if (data.isOwner) return true;
    return data.permissions[module]?.additionalPerms?.[perm] ?? false;
  };

  return {
    canAccess,
    getAccessLevel,
    hasAdditionalPerm,
    isOwner: data?.isOwner ?? false,
    roleName: data?.roleName ?? null,
    isLoaded: !isLoading,
    permissions: data?.permissions ?? {},
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/usePermissions.ts
git commit -m "feat: rewrite usePermissions hook — fetch real permissions from API"
```

---

## Task 8: Permission-gate the sidebar navigation

**Files:**
- Modify: `client/src/components/layout/Layout.tsx`

- [ ] **Step 1: Read current Layout.tsx**

Read the file to understand the current navigation structure.

- [ ] **Step 2: Import and apply usePermissions**

Add import at the top:

```typescript
import { usePermissions } from "../../hooks/usePermissions";
```

Inside the Layout component, add:

```typescript
const { canAccess, isOwner, roleName } = usePermissions();
```

- [ ] **Step 3: Filter navigation items by permission**

Update the navigation rendering to hide items the user can't access. Add a `module` field to each nav item and filter:

```typescript
const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" as const },
  { name: "Income", href: "/income", icon: DollarSign, module: "finance" as const },
  { name: "Expenses", href: "/expenses", icon: Receipt, module: "finance" as const },
  { name: "Subscriptions", href: "/subscriptions", icon: RefreshCw, module: "finance" as const },
  { name: "Clients", href: "/clients", icon: Users, module: "clients" as const },
  { name: "People", href: "/employees", icon: UserCircle, module: "people" as const },
];

// Filter by permission
const visibleNavItems = navigationItems.filter((item) => canAccess(item.module));
```

Render `visibleNavItems` instead of `navigationItems`.

- [ ] **Step 4: Add Invoicing and Accounting nav items**

Add these to the navigation items array (they'll be built in later tasks):

```typescript
{ name: "Invoicing", href: "/invoicing", icon: FileText, module: "invoicing" as const },
{ name: "Accounting", href: "/accounting", icon: Calculator, module: "finance" as const },
```

Import `FileText` and `Calculator` from `lucide-react`.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/layout/Layout.tsx
git commit -m "feat: permission-gate sidebar — hide nav items user can't access, add Invoicing/Accounting"
```

---

## Task 9: Create tax rules backend and settings page

**Files:**
- Create: `server/modules/tax/routes.ts`
- Create: `server/modules/tax/storage.ts`

- [ ] **Step 1: Create tax storage**

```typescript
// server/modules/tax/storage.ts
import { db } from "../../db";
import { taxRules, currencyRates } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const taxStorage = {
  async getTaxRulesByOrg(organizationId: string) {
    return db.select().from(taxRules)
      .where(eq(taxRules.organizationId, organizationId))
      .orderBy(taxRules.name);
  },

  async createTaxRule(data: any, organizationId: string) {
    const [result] = await db.insert(taxRules).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async updateTaxRule(id: string, data: any, organizationId: string) {
    const [result] = await db.update(taxRules)
      .set(data)
      .where(and(eq(taxRules.id, id), eq(taxRules.organizationId, organizationId)))
      .returning();
    return result;
  },

  async deleteTaxRule(id: string, organizationId: string) {
    const [result] = await db.delete(taxRules)
      .where(and(eq(taxRules.id, id), eq(taxRules.organizationId, organizationId)))
      .returning();
    return result;
  },

  async getCurrencyRatesByOrg(organizationId: string) {
    return db.select().from(currencyRates)
      .where(eq(currencyRates.organizationId, organizationId))
      .orderBy(desc(currencyRates.effectiveDate));
  },

  async createCurrencyRate(data: any, organizationId: string) {
    const [result] = await db.insert(currencyRates).values({
      ...data,
      organizationId,
    }).returning();
    return result;
  },

  async deleteCurrencyRate(id: string, organizationId: string) {
    const [result] = await db.delete(currencyRates)
      .where(and(eq(currencyRates.id, id), eq(currencyRates.organizationId, organizationId)))
      .returning();
    return result;
  },
};
```

- [ ] **Step 2: Create tax routes**

```typescript
// server/modules/tax/routes.ts
import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { taxStorage } from "./storage";
import { insertTaxRuleSchema, insertCurrencyRateSchema } from "@shared/schema";

const router = Router();
router.use("/api", requireOrg);

// Tax Rules
router.get("/api/tax-rules", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.getTaxRulesByOrg(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/tax-rules", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertTaxRuleSchema.parse(req.body);
    const result = await taxStorage.createTaxRule(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/api/tax-rules/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.updateTaxRule(req.params.id, req.body, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Tax rule not found" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/tax-rules/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.deleteTaxRule(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Tax rule not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Currency Rates
router.get("/api/currency-rates", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.getCurrencyRatesByOrg(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/currency-rates", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertCurrencyRateSchema.parse(req.body);
    const result = await taxStorage.createCurrencyRate(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/currency-rates/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.deleteCurrencyRate(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Rate not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

- [ ] **Step 3: Register in server/index.ts**

```typescript
import taxRoutes from "./modules/tax/routes";
app.use(taxRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/modules/tax/ server/index.ts
git commit -m "feat: add tax rules and currency rates backend — CRUD endpoints"
```

---

## Task 10: Create invoicing backend module

**Files:**
- Create: `server/modules/invoicing/routes.ts`
- Create: `server/modules/invoicing/storage.ts`

- [ ] **Step 1: Create invoicing storage**

```typescript
// server/modules/invoicing/storage.ts
import { db } from "../../db";
import { invoices, invoiceLineItems, taxRules, clients, people } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const invoicingStorage = {
  async generateInvoiceNumber(organizationId: string, type: "outgoing" | "incoming") {
    const prefix = type === "outgoing" ? "INV" : "BILL";
    const year = new Date().getFullYear();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.type, type),
      ));
    const seq = (Number(result?.count) || 0) + 1;
    return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
  },

  async getInvoicesByOrg(organizationId: string) {
    return db.select({
      invoice: invoices,
      clientName: clients.name,
      personFirstName: people.firstName,
      personLastName: people.lastName,
    })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(people, eq(invoices.personId, people.id))
      .where(eq(invoices.organizationId, organizationId))
      .orderBy(desc(invoices.createdAt));
  },

  async getInvoiceById(id: string, organizationId: string) {
    const [invoice] = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .limit(1);
    if (!invoice) return null;

    const lineItems = await db.select({
      lineItem: invoiceLineItems,
      taxRuleName: taxRules.name,
      taxRuleRate: taxRules.rate,
    })
      .from(invoiceLineItems)
      .leftJoin(taxRules, eq(invoiceLineItems.taxRuleId, taxRules.id))
      .where(eq(invoiceLineItems.invoiceId, id));

    return { ...invoice, lineItems };
  },

  async createInvoice(
    data: {
      type: string; clientId?: string | null; personId?: string | null;
      status?: string; issueDate: string; dueDate?: string | null;
      currency?: string; notes?: string;
      lineItems: Array<{
        description?: string; quantity?: string; unitPrice: string;
        taxRuleId?: string | null;
      }>;
    },
    organizationId: string
  ) {
    const invoiceNumber = await this.generateInvoiceNumber(organizationId, data.type as any);

    // Calculate line item totals
    const processedItems = [];
    let subtotal = 0;
    let totalTax = 0;

    for (const item of data.lineItems) {
      const qty = parseFloat(item.quantity || "1");
      const price = parseFloat(item.unitPrice);
      const lineSubtotal = qty * price;

      let lineTax = 0;
      if (item.taxRuleId) {
        const [rule] = await db.select().from(taxRules)
          .where(eq(taxRules.id, item.taxRuleId)).limit(1);
        if (rule) {
          const rate = parseFloat(rule.rate);
          if (rule.type === "exclusive") {
            lineTax = lineSubtotal * (rate / 100);
          } else {
            lineTax = lineSubtotal - (lineSubtotal / (1 + rate / 100));
          }
        }
      }

      subtotal += lineSubtotal;
      totalTax += lineTax;
      processedItems.push({
        description: item.description,
        quantity: String(qty),
        unitPrice: String(price),
        taxRuleId: item.taxRuleId || null,
        taxAmount: String(lineTax.toFixed(2)),
        totalAmount: String((lineSubtotal + (item.taxRuleId ? lineTax : 0)).toFixed(2)),
      });
    }

    const [invoice] = await db.insert(invoices).values({
      invoiceNumber,
      type: data.type as any,
      clientId: data.clientId || null,
      personId: data.personId || null,
      status: (data.status || "draft") as any,
      issueDate: data.issueDate,
      dueDate: data.dueDate || null,
      subtotal: String(subtotal.toFixed(2)),
      taxAmount: String(totalTax.toFixed(2)),
      totalAmount: String((subtotal + totalTax).toFixed(2)),
      currency: data.currency || "USD",
      notes: data.notes,
      organizationId,
    }).returning();

    // Insert line items
    if (processedItems.length > 0) {
      await db.insert(invoiceLineItems).values(
        processedItems.map((item) => ({ ...item, invoiceId: invoice.id }))
      );
    }

    return this.getInvoiceById(invoice.id, organizationId);
  },

  async updateInvoiceStatus(id: string, status: string, organizationId: string) {
    const [result] = await db.update(invoices)
      .set({ status: status as any, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();
    return result;
  },

  async deleteInvoice(id: string, organizationId: string) {
    const [result] = await db.delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();
    return result;
  },
};
```

- [ ] **Step 2: Create invoicing routes**

```typescript
// server/modules/invoicing/routes.ts
import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { invoicingStorage } from "./storage";
import { insertInvoiceSchema, updateInvoiceStatusSchema } from "@shared/schema";

const router = Router();
router.use("/api", requireOrg);

router.get("/api/invoices", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await invoicingStorage.getInvoicesByOrg(getOrgId(req));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/invoices/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await invoicingStorage.getInvoiceById(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Invoice not found" });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/invoices", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertInvoiceSchema.parse(req.body);
    const result = await invoicingStorage.createInvoice(parsed, getOrgId(req));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/api/invoices/:id/status", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = updateInvoiceStatusSchema.parse(req.body);
    const result = await invoicingStorage.updateInvoiceStatus(req.params.id, parsed.status, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Invoice not found" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/api/invoices/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await invoicingStorage.deleteInvoice(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Invoice not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

- [ ] **Step 3: Register in server/index.ts**

```typescript
import invoicingRoutes from "./modules/invoicing/routes";
app.use(invoicingRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/modules/invoicing/ server/index.ts
git commit -m "feat: add invoicing backend — create invoices with line items, tax calculation, status management"
```

---

## Task 11: Add expense approval endpoints

**Files:**
- Modify: `server/modules/finance/routes.ts`

- [ ] **Step 1: Read current finance routes**

Read `server/modules/finance/routes.ts`.

- [ ] **Step 2: Add approval endpoints**

Add these routes to the finance router:

```typescript
// Approve expense
router.put("/api/expenses/:id/approve", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const [result] = await db.update(expenses)
      .set({
        approvalStatus: "approved",
        approvedById: req.bluxoUser!.clerkUserId,
      })
      .where(and(eq(expenses.id, req.params.id), eq(expenses.organizationId, orgId)))
      .returning();
    if (!result) return res.status(404).json({ message: "Expense not found" });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Reject expense
router.put("/api/expenses/:id/reject", async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = getOrgId(req);
    const [result] = await db.update(expenses)
      .set({
        approvalStatus: "rejected",
        approvedById: req.bluxoUser!.clerkUserId,
      })
      .where(and(eq(expenses.id, req.params.id), eq(expenses.organizationId, orgId)))
      .returning();
    if (!result) return res.status(404).json({ message: "Expense not found" });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
```

You'll need to add imports at the top:
```typescript
import { db } from "../../db";
import { expenses } from "@shared/schema";
import { eq, and } from "drizzle-orm";
```

- [ ] **Step 3: Commit**

```bash
git add server/modules/finance/routes.ts
git commit -m "feat: add expense approval/rejection endpoints"
```

---

## Task 12: Add accounting/reporting endpoints

**Files:**
- Modify: `server/modules/analytics/storage.ts`
- Modify: `server/modules/analytics/routes.ts`

- [ ] **Step 1: Read current analytics storage and routes**

Read both files.

- [ ] **Step 2: Add accounting queries to analytics storage**

Add these methods to `analyticsStorage`:

```typescript
async getProfitAndLoss(organizationId: string, startDate?: string, endDate?: string) {
  // Income by category
  const incomeByCategory = await db
    .select({
      categoryId: income.categoryId,
      categoryName: categories.name,
      total: sql<string>`COALESCE(SUM(${income.amount}), '0')`,
    })
    .from(income)
    .leftJoin(categories, eq(income.categoryId, categories.id))
    .where(and(
      eq(income.organizationId, organizationId),
      ...(startDate ? [gte(income.date, startDate)] : []),
      ...(endDate ? [lte(income.date, endDate)] : []),
    ))
    .groupBy(income.categoryId, categories.name);

  // Expenses by category
  const expensesByCategory = await db
    .select({
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      total: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(
      eq(expenses.organizationId, organizationId),
      ...(startDate ? [gte(expenses.date, startDate)] : []),
      ...(endDate ? [lte(expenses.date, endDate)] : []),
    ))
    .groupBy(expenses.categoryId, categories.name);

  const totalIncome = incomeByCategory.reduce((sum, r) => sum + parseFloat(r.total), 0);
  const totalExpenses = expensesByCategory.reduce((sum, r) => sum + parseFloat(r.total), 0);

  return {
    income: incomeByCategory,
    expenses: expensesByCategory,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
  };
},

async getTaxSummary(organizationId: string, startDate?: string, endDate?: string) {
  // Tax collected on income
  const incomeTax = await db
    .select({
      total: sql<string>`COALESCE(SUM(${income.taxAmount}), '0')`,
    })
    .from(income)
    .where(and(
      eq(income.organizationId, organizationId),
      ...(startDate ? [gte(income.date, startDate)] : []),
      ...(endDate ? [lte(income.date, endDate)] : []),
    ));

  // Tax paid on expenses
  const expenseTax = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.taxAmount}), '0')`,
    })
    .from(expenses)
    .where(and(
      eq(expenses.organizationId, organizationId),
      ...(startDate ? [gte(expenses.date, startDate)] : []),
      ...(endDate ? [lte(expenses.date, endDate)] : []),
    ));

  return {
    taxCollected: parseFloat(incomeTax[0]?.total || "0"),
    taxPaid: parseFloat(expenseTax[0]?.total || "0"),
    netTax: parseFloat(incomeTax[0]?.total || "0") - parseFloat(expenseTax[0]?.total || "0"),
  };
},
```

Add required imports: `categories`, `gte`, `lte` from drizzle-orm.

- [ ] **Step 3: Add accounting routes**

Add these endpoints to `server/modules/analytics/routes.ts`:

```typescript
router.get("/api/accounting/pnl", async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await analyticsStorage.getProfitAndLoss(
      getOrgId(req), startDate as string, endDate as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/accounting/tax-summary", async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await analyticsStorage.getTaxSummary(
      getOrgId(req), startDate as string, endDate as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add server/modules/analytics/
git commit -m "feat: add accounting endpoints — P&L by category, tax summary"
```

---

## Task 13: Build User Management page (Users/Teams/Roles tabs)

**Files:**
- Create: `client/src/modules/settings/pages/UserManagementPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create the User Management page**

Build a tabbed page matching the iClosed screenshots. Three tabs: Users (with count), Teams (with count), Roles (with count).

**Users tab:** Table with avatar, name, email, role badge (Select dropdown to assign), status.
**Teams tab:** List of teams with member count, + New Team button.
**Roles tab:** List of roles with user count. Click role → modal with module permission toggles.

The page should use:
- `useQuery` to fetch `/api/org-users`, `/api/roles`, `/api/teams`
- `useMutation` for role assignment, team creation, role creation
- Shadcn `Tabs`, `Table`, `Dialog`, `Select`, `Switch`, `RadioGroup`, `Badge` components
- The role editor modal should show all modules from `MODULES` constant with Full/Exclusive radio and enabled toggle

This is a complex UI page. Read the existing `client/src/pages/settings/UserManagementSettings.tsx` for patterns used in this codebase, then build the new version.

- [ ] **Step 2: Update App.tsx routes**

Add route for the new user management page and any other new pages (invoicing, accounting, tax rules).

- [ ] **Step 3: Add Tax Rules and Invoicing routes to sidebar settings**

In Layout.tsx settings items, add Tax Rules. In main nav, ensure Invoicing and Accounting are present.

- [ ] **Step 4: Commit**

```bash
git add client/src/modules/ client/src/App.tsx client/src/components/layout/Layout.tsx
git commit -m "feat: build User Management page — Users/Teams/Roles tabs with permission editor"
```

---

## Task 14: Build Invoicing page

**Files:**
- Create: `client/src/modules/finance/pages/InvoicingPage.tsx`

- [ ] **Step 1: Create the Invoicing page**

Build an invoice list page with:
- Filter tabs: All | Outgoing | Incoming
- Status filter: Draft, Sent, Paid, Overdue
- Table: Invoice #, Type, Client/Person, Date, Amount, Status, Actions
- "+ New Invoice" button → opens a creation form (can be a separate page or dialog)
- Invoice creation form: type selector, client/person picker, line items (description, qty, unit price, tax rule), auto-calculated totals
- Status transition actions (Mark as Sent, Mark as Paid, Cancel)

Use `useQuery` with `/api/invoices`, `useMutation` for create/status updates.
Use existing shadcn components: `Table`, `Dialog`, `Select`, `Input`, `Button`, `Badge`.

- [ ] **Step 2: Register route in App.tsx**

Add `/invoicing` route pointing to InvoicingPage.

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/finance/ client/src/App.tsx
git commit -m "feat: build Invoicing page — invoice list, creation form with line items, status management"
```

---

## Task 15: Build Tax Rules settings page

**Files:**
- Create: `client/src/modules/settings/pages/TaxRulesSettings.tsx`

- [ ] **Step 1: Create the Tax Rules page**

A settings page showing:
- List of tax rules (Name, Rate %, Type inclusive/exclusive, Country, Default badge)
- "+ Add Tax Rule" button → dialog with form fields
- Delete button per rule
- Follow the same pattern as CategoriesSettings.tsx

Use `useQuery` with `/api/tax-rules`, `useMutation` for create/delete.

- [ ] **Step 2: Register route in App.tsx and add to settings nav**

Add `/settings/tax-rules` route. Add "Tax Rules" to the settings submenu in Layout.tsx.

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/settings/ client/src/App.tsx client/src/components/layout/Layout.tsx
git commit -m "feat: build Tax Rules settings page — CRUD for org tax rules"
```

---

## Task 16: Build Accounting page

**Files:**
- Create: `client/src/modules/finance/pages/AccountingPage.tsx`

- [ ] **Step 1: Create the Accounting page**

A reporting page with tabs:
- **Profit & Loss:** income vs expenses table by category, totals, net profit. Date range filter.
- **Tax Summary:** tax collected vs tax paid, net tax liability. Date range filter.

Use `useQuery` with `/api/accounting/pnl` and `/api/accounting/tax-summary`.
Use Recharts for a visual P&L bar chart. Use shadcn `Tabs`, `Card`, `Table`.

- [ ] **Step 2: Register route in App.tsx**

Add `/accounting` route.

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/finance/ client/src/App.tsx
git commit -m "feat: build Accounting page — P&L report and Tax Summary with date filters"
```

---

## Task 17: Verify build and final cleanup

- [ ] **Step 1: Push all schema changes to database**

```bash
npx drizzle-kit push
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Fix any compile errors.

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Verify:
1. Sign in → org selected → sidebar shows permission-gated items
2. Settings > User Management → Users/Teams/Roles tabs work
3. Settings > Tax Rules → can create/delete tax rules
4. Invoicing page → can create invoices with line items
5. Accounting page → P&L and Tax Summary load
6. Expenses → approval status visible (new column)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix build errors, verify Plan 2 complete"
```

---

## Summary

After completing this plan, Bluxo will have:

- **Custom roles system** with per-module Full/Exclusive permissions + granular toggles
- **System roles** auto-seeded per org (Owner, Admin, Accountant, HR Manager, Manager, Viewer)
- **Real permission enforcement** on backend (middleware) and frontend (sidebar filtering, PermissionGate)
- **User Management UI** — Users tab (role assignment), Teams tab, Roles tab (permission editor modal)
- **Tax rules** per org with inclusive/exclusive rates and country assignment
- **Currency rates** table for HQ cross-org conversion (used in Plan 4)
- **Invoicing system** — create outgoing/incoming invoices with line items, tax auto-calculation, status workflow
- **Expense approval** workflow (pending → approved/rejected)
- **Accounting views** — Profit & Loss by category, Tax Summary reports

**Next:** Plan 3 (People Module — full HR suite)
