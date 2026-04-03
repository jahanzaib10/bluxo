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

export type TaxRule = typeof taxRules.$inferSelect;
export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertTaxRule = z.infer<typeof insertTaxRuleSchema>;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
