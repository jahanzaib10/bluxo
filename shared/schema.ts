import { pgTable, text, uuid, timestamp, boolean, numeric, date, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep existing auth tables (per requirements)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("internal"), // internal or client
  clientId: uuid("client_id"), // populated when type is "client"
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // super_admin, admin, manager, employee, viewer
  status: text("status").notNull().default("active"), // active, inactive, pending
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NEW CORE BUSINESS TABLES

// Clients table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  jobTitle: text("job_title"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment sources table
export const paymentSources = pgTable("payment_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // bank_account, credit_card, paypal, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // income or expense
  parentId: uuid("parent_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Income table
export const income = pgTable("income", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  paymentSourceId: uuid("payment_source_id").references(() => paymentSources.id),
  categoryId: uuid("category_id").references(() => categories.id),
  isRecurring: boolean("is_recurring").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Spending table
export const spending = pgTable("spending", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  employeeId: uuid("employee_id").references(() => employees.id), // nullable
  categoryId: uuid("category_id").references(() => categories.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  billingCycle: text("billing_cycle").notNull(), // monthly, quarterly, yearly
  nextDueDate: date("next_due_date").notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// RELATIONS
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  employees: many(employees),
  paymentSources: many(paymentSources),
  categories: many(categories),
  income: many(income),
  spending: many(spending),
  subscriptions: many(subscriptions),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [users.clientId],
    references: [clients.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  income: many(income),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [employees.organizationId],
    references: [organizations.id],
  }),
  spending: many(spending),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [categories.organizationId],
    references: [organizations.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  income: many(income),
  spending: many(spending),
  subscriptions: many(subscriptions),
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

export const spendingRelations = relations(spending, ({ one }) => ({
  organization: one(organizations, {
    fields: [spending.organizationId],
    references: [organizations.id],
  }),
  employee: one(employees, {
    fields: [spending.employeeId],
    references: [employees.id],
  }),
  category: one(categories, {
    fields: [spending.categoryId],
    references: [categories.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
}));

// ZOD SCHEMAS
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSourceSchema = createInsertSchema(paymentSources).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertIncomeSchema = createInsertSchema(income).omit({
  id: true,
  createdAt: true,
});

export const insertSpendingSchema = createInsertSchema(spending).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

// TYPES
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type PaymentSource = typeof paymentSources.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Spending = typeof spending.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertPaymentSource = z.infer<typeof insertPaymentSourceSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type InsertSpending = z.infer<typeof insertSpendingSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;