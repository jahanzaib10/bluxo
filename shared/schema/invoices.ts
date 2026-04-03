import {
  pgTable, uuid, varchar, text, timestamp, decimal, date,
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

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
