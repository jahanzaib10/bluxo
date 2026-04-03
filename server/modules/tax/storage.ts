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
      ...data, organizationId,
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
      ...data, organizationId,
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
