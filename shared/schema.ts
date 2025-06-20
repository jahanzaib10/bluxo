import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  decimal,
  date,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Core tables
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  name: varchar("name"),
  profileImageUrl: varchar("profile_image_url"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  role: varchar("role").default("member"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  address: text("address"),
  industry: varchar("industry"),
  contactName: varchar("contact_name"),
  contactEmail: varchar("contact_email"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientPermissions = pgTable("client_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  showIncomeGraph: boolean("show_income_graph").default(true),
  showCategoryBreakdown: boolean("show_category_breakdown").default(true),
  showPaymentHistory: boolean("show_payment_history").default(true),
  showInvoices: boolean("show_invoices").default(false),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientAuthTokens = pgTable("client_auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  email: varchar("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  position: varchar("position"),
  country: varchar("country"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: varchar("status").default("active"),
  birthDate: date("birth_date"),
  seniorityLevel: varchar("seniority_level"),
  paymentAmount: decimal("payment_amount", { precision: 12, scale: 2 }),
  directManagerId: uuid("direct_manager_id").references(() => employees.id),
  groupName: varchar("group_name"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type").notNull(), // "income" or "expense"
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentSources = pgTable("payment_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type"), // "bank", "cash", "card", etc.
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const income = pgTable("income", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  paymentSourceId: uuid("payment_source_id").references(() => paymentSources.id),
  categoryId: uuid("category_id").references(() => categories.id),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: varchar("recurring_frequency", { 
    enum: ['weekly', 'monthly', 'quarterly', 'bi-annual', 'yearly'] 
  }),
  recurringEndDate: date("recurring_end_date"),
  status: varchar("status", { 
    enum: ['pending', 'paid', 'failed'] 
  }).default('paid'),
  invoiceId: varchar("invoice_id"),
  currency: varchar("currency", { length: 3 }).default('USD'),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  employeeId: uuid("employee_id").references(() => employees.id),
  categoryId: uuid("category_id").references(() => categories.id),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  billingCycle: varchar("billing_cycle").notNull(), // "monthly", "yearly", "quarterly", "bi-annual"
  nextDueDate: date("next_due_date"),
  description: text("description"),
  reconciled: boolean("reconciled").default(false),
  subscriptionType: varchar("subscription_type").default("self"), // "self", "client"
  clientId: uuid("client_id").references(() => clients.id),
  employeeId: uuid("employee_id").references(() => employees.id),
  categoryId: uuid("category_id").references(() => categories.id),
  paymentSourceId: uuid("payment_source_id").references(() => paymentSources.id),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  employees: many(employees),
  categories: many(categories),
  paymentSources: many(paymentSources),
  income: many(income),
  expenses: many(expenses),
  subscriptions: many(subscriptions),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  income: many(income),
  permissions: one(clientPermissions),
  authTokens: many(clientAuthTokens),
}));

export const clientPermissionsRelations = relations(clientPermissions, ({ one }) => ({
  client: one(clients, {
    fields: [clientPermissions.clientId],
    references: [clients.id],
  }),
  organization: one(organizations, {
    fields: [clientPermissions.organizationId],
    references: [organizations.id],
  }),
}));

export const clientAuthTokensRelations = relations(clientAuthTokens, ({ one }) => ({
  client: one(clients, {
    fields: [clientAuthTokens.clientId],
    references: [clients.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [employees.organizationId],
    references: [organizations.id],
  }),
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [categories.organizationId],
    references: [organizations.id],
  }),
  income: many(income),
  expenses: many(expenses),
}));

export const paymentSourcesRelations = relations(paymentSources, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [paymentSources.organizationId],
    references: [organizations.id],
  }),
  income: many(income),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  organization: one(organizations, {
    fields: [income.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [income.clientId],
    references: [clients.id],
  }),
  paymentSource: one(paymentSources, {
    fields: [income.paymentSourceId],
    references: [paymentSources.id],
  }),
  category: one(categories, {
    fields: [income.categoryId],
    references: [categories.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  organization: one(organizations, {
    fields: [expenses.organizationId],
    references: [organizations.id],
  }),
  employee: one(employees, {
    fields: [expenses.employeeId],
    references: [employees.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [subscriptions.clientId],
    references: [clients.id],
  }),
  employee: one(employees, {
    fields: [subscriptions.employeeId],
    references: [employees.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
  paymentSource: one(paymentSources, {
    fields: [subscriptions.paymentSourceId],
    references: [paymentSources.id],
  }),
}));

// Input validation schemas (without organizationId for client-side)
export const insertClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  industry: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

export const insertClientPermissionsSchema = z.object({
  clientId: z.string().uuid(),
  showIncomeGraph: z.boolean().default(true),
  showCategoryBreakdown: z.boolean().default(true),
  showPaymentHistory: z.boolean().default(true),
  showInvoices: z.boolean().default(false),
});

export const clientAuthRequestSchema = z.object({
  email: z.string().email(),
});

export const insertEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  position: z.string().optional(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
});

export const insertPaymentSourceSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
});

export const insertIncomeSchema = z.object({
  amount: z.string(),
  date: z.string(),
  clientId: z.string().uuid().optional(),
  paymentSourceId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'bi-annual', 'yearly']).optional(),
  recurringEndDate: z.string().optional(),
  status: z.enum(['pending', 'paid', 'failed']).optional(),
  invoiceId: z.string().optional(),
  currency: z.string().length(3).optional(),
});

export const insertExpenseSchema = z.object({
  amount: z.string(),
  date: z.string(),
  employeeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().optional(),
});

export const insertSubscriptionSchema = z.object({
  name: z.string().min(1),
  amount: z.string(),
  billingCycle: z.enum(["monthly", "yearly", "quarterly", "bi-annual"]),
  nextDueDate: z.string().optional(),
  description: z.string().optional(),
  reconciled: z.boolean().default(false),
  subscriptionType: z.enum(["self", "client"]).default("self"),
  clientId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  paymentSourceId: z.string().uuid().optional(),
});

// User schema for Replit Auth compatibility
export const upsertUserSchema = createInsertSchema(users).partial().extend({
  id: z.string(),
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ClientPermissions = typeof clientPermissions.$inferSelect;
export type ClientAuthToken = typeof clientAuthTokens.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type PaymentSource = typeof paymentSources.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

// Insert types for forms
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClientPermissions = z.infer<typeof insertClientPermissionsSchema>;
export type ClientAuthRequest = z.infer<typeof clientAuthRequestSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertPaymentSource = z.infer<typeof insertPaymentSourceSchema>;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;