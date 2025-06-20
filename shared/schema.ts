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
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
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

export const income = pgTable("income", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  categoryId: uuid("category_id").references(() => categories.id),
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
  billingCycle: varchar("billing_cycle").notNull(), // "monthly", "yearly"
  nextDueDate: date("next_due_date").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  employees: many(employees),
  categories: many(categories),
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

export const incomeRelations = relations(income, ({ one }) => ({
  organization: one(organizations, {
    fields: [income.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [income.clientId],
    references: [clients.id],
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
}));

// Input validation schemas (without organizationId for client-side)
export const insertClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
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

export const insertIncomeSchema = z.object({
  amount: z.string(),
  description: z.string().optional(),
  date: z.string(),
  clientId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export const insertExpenseSchema = z.object({
  amount: z.string(),
  description: z.string().optional(),
  date: z.string(),
  employeeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export const insertSubscriptionSchema = z.object({
  name: z.string().min(1),
  amount: z.string(),
  billingCycle: z.enum(["monthly", "yearly"]),
  nextDueDate: z.string(),
});

// User schema for Replit Auth compatibility
export const upsertUserSchema = createInsertSchema(users).partial().extend({
  id: z.string(),
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;