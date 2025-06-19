import { pgTable, text, uuid, timestamp, boolean, numeric, date, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  companyUrl: text("company_url"),
  currency: text("currency").notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  parent_id: uuid("parent_id"),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  archived: boolean("archived").default(false).notNull(),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const developers = pgTable("developers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  hourly_rate: numeric("hourly_rate").notNull(),
  client_id: uuid("client_id").notNull(),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  direct_manager_id: uuid("direct_manager_id"),
  birth_date: date("birth_date"),
  end_date: date("end_date"),
  archived: boolean("archived").default(false).notNull(),
  comments: text("comments"),
  group_name: text("group_name"),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
  }),
  children: many(categories),
}));

export const developersRelations = relations(developers, ({ one }) => ({
  client: one(clients, {
    fields: [developers.client_id],
    references: [clients.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  developers: many(developers),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  manager: one(employees, {
    fields: [employees.direct_manager_id],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeveloperSchema = createInsertSchema(developers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Developer = typeof developers.$inferSelect;
export type InsertDeveloper = z.infer<typeof insertDeveloperSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Legacy user table for compatibility
// User management tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  accountId: uuid("account_id").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  lastLoginAt: timestamp("last_login_at"),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").default("UTC"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userInvitations = pgTable("user_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  invitedBy: uuid("invited_by"),
  token: uuid("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  message: text("message"),
  resentCount: integer("resent_count").default(0),
  lastResentAt: timestamp("last_resent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role").notNull(),
  permissionId: uuid("permission_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial management tables
export const paymentSources = pgTable("payment_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type"),
  details: text("details"),
  archived: boolean("archived").default(false),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const income = pgTable("income", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  clientId: uuid("client_id"),
  paymentReceiverId: uuid("payment_receiver_id"),
  description: text("description"),
  archived: boolean("archived").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"),
  recurringEndDate: date("recurring_end_date"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  amount: numeric("amount").notNull(),
  billingCycle: text("billing_cycle"),
  nextDueDate: date("next_due_date"),
  paymentReceiverId: uuid("payment_receiver_id"),
  clientCardInfo: text("client_card_info"),
  archived: boolean("archived").default(false),
  categoryId: uuid("category_id"),
  type: text("type"),
  recurringEndDate: date("recurring_end_date"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spending = pgTable("spending", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  categoryId: uuid("category_id"),
  date: date("date").notNull(),
  developerId: uuid("developer_id"),
  vendorId: uuid("vendor_id"),
  subscriptionId: uuid("subscription_id"),
  paymentReceiverId: uuid("payment_receiver_id"),
  reconciled: boolean("reconciled").default(false),
  notes: text("notes"),
  archived: boolean("archived").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"),
  recurringEndDate: date("recurring_end_date"),
  employeeId: uuid("employee_id"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
