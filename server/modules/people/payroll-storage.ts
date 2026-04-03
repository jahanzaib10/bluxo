import { db } from "../../db";
import { payrollRuns, payrollItems, people } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const payrollStorage = {
  async getPayrollRunsByOrg(organizationId: string) {
    return db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.organizationId, organizationId))
      .orderBy(desc(payrollRuns.period));
  },

  async getPayrollRunById(id: string, organizationId: string) {
    const [run] = await db
      .select()
      .from(payrollRuns)
      .where(and(eq(payrollRuns.id, id), eq(payrollRuns.organizationId, organizationId)));

    if (!run) return null;

    const items = await db
      .select({
        id: payrollItems.id,
        payrollRunId: payrollItems.payrollRunId,
        personId: payrollItems.personId,
        grossAmount: payrollItems.grossAmount,
        taxDeduction: payrollItems.taxDeduction,
        benefitDeductions: payrollItems.benefitDeductions,
        otherDeductions: payrollItems.otherDeductions,
        netAmount: payrollItems.netAmount,
        currency: payrollItems.currency,
        notes: payrollItems.notes,
        personFirstName: people.firstName,
        personLastName: people.lastName,
      })
      .from(payrollItems)
      .leftJoin(people, eq(payrollItems.personId, people.id))
      .where(eq(payrollItems.payrollRunId, id));

    return { ...run, items };
  },

  async createPayrollRun(data: any, organizationId: string) {
    const [run] = await db
      .insert(payrollRuns)
      .values({ ...data, status: "draft", organizationId })
      .returning();
    return run;
  },

  async addPayrollItem(data: any) {
    const gross = parseFloat(data.grossAmount) || 0;
    const tax = parseFloat(data.taxDeduction) || 0;
    const benefits = parseFloat(data.benefitDeductions) || 0;
    const other = parseFloat(data.otherDeductions) || 0;
    const netAmount = (gross - tax - benefits - other).toFixed(2);

    const [item] = await db
      .insert(payrollItems)
      .values({ ...data, netAmount })
      .returning();
    return item;
  },

  async updatePayrollRun(id: string, data: any, organizationId: string) {
    // Recalculate totals from items
    const items = await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.payrollRunId, id));

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const item of items) {
      totalGross += parseFloat(item.grossAmount) || 0;
      totalDeductions +=
        (parseFloat(item.taxDeduction) || 0) +
        (parseFloat(item.benefitDeductions) || 0) +
        (parseFloat(item.otherDeductions) || 0);
      totalNet += parseFloat(item.netAmount) || 0;
    }

    const [run] = await db
      .update(payrollRuns)
      .set({
        ...data,
        totalGross: totalGross.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        totalNet: totalNet.toFixed(2),
      })
      .where(and(eq(payrollRuns.id, id), eq(payrollRuns.organizationId, organizationId)))
      .returning();
    return run;
  },

  async deletePayrollRun(id: string, organizationId: string) {
    const result = await db
      .delete(payrollRuns)
      .where(and(eq(payrollRuns.id, id), eq(payrollRuns.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  async getPayrollItemsByRun(runId: string) {
    return db
      .select({
        id: payrollItems.id,
        payrollRunId: payrollItems.payrollRunId,
        personId: payrollItems.personId,
        grossAmount: payrollItems.grossAmount,
        taxDeduction: payrollItems.taxDeduction,
        benefitDeductions: payrollItems.benefitDeductions,
        otherDeductions: payrollItems.otherDeductions,
        netAmount: payrollItems.netAmount,
        currency: payrollItems.currency,
        notes: payrollItems.notes,
        personFirstName: people.firstName,
        personLastName: people.lastName,
      })
      .from(payrollItems)
      .leftJoin(people, eq(payrollItems.personId, people.id))
      .where(eq(payrollItems.payrollRunId, runId));
  },
};
