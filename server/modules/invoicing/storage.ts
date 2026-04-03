import { db } from "../../db";
import { invoices, invoiceLineItems, taxRules, clients, people } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const invoicingStorage = {
  async generateInvoiceNumber(organizationId: string, type: "outgoing" | "incoming"): Promise<string> {
    const prefix = type === "outgoing" ? "INV" : "BILL";
    const year = new Date().getFullYear();

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(eq(invoices.organizationId, organizationId), eq(invoices.type, type)));

    const sequence = (Number(result?.count ?? 0) + 1).toString().padStart(4, "0");
    return `${prefix}-${year}-${sequence}`;
  },

  async getInvoicesByOrg(organizationId: string) {
    return db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        type: invoices.type,
        clientId: invoices.clientId,
        personId: invoices.personId,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        notes: invoices.notes,
        attachmentUrl: invoices.attachmentUrl,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
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
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        type: invoices.type,
        clientId: invoices.clientId,
        personId: invoices.personId,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        notes: invoices.notes,
        attachmentUrl: invoices.attachmentUrl,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        clientName: clients.name,
        personFirstName: people.firstName,
        personLastName: people.lastName,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(people, eq(invoices.personId, people.id))
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)));

    if (!invoice) return null;

    const lineItems = await db
      .select({
        id: invoiceLineItems.id,
        invoiceId: invoiceLineItems.invoiceId,
        description: invoiceLineItems.description,
        quantity: invoiceLineItems.quantity,
        unitPrice: invoiceLineItems.unitPrice,
        taxRuleId: invoiceLineItems.taxRuleId,
        taxAmount: invoiceLineItems.taxAmount,
        totalAmount: invoiceLineItems.totalAmount,
        taxRuleName: taxRules.name,
        taxRuleRate: taxRules.rate,
      })
      .from(invoiceLineItems)
      .leftJoin(taxRules, eq(invoiceLineItems.taxRuleId, taxRules.id))
      .where(eq(invoiceLineItems.invoiceId, id));

    return { ...invoice, lineItems };
  },

  async createInvoice(data: any, organizationId: string) {
    const { lineItems: rawLineItems, ...invoiceData } = data;

    // 1. Generate invoice number
    const invoiceNumber = await invoicingStorage.generateInvoiceNumber(organizationId, invoiceData.type);

    // 2. Process line items and calculate tax
    let subtotal = 0;
    let totalTax = 0;

    const processedLineItems: Array<{
      description: string | null;
      quantity: string;
      unitPrice: string;
      taxRuleId: string | null;
      taxAmount: string;
      totalAmount: string;
    }> = [];

    for (const item of rawLineItems) {
      const qty = parseFloat(item.quantity ?? "1");
      const unitPrice = parseFloat(item.unitPrice);
      const lineSubtotal = qty * unitPrice;

      let lineTax = 0;
      let lineTotal = lineSubtotal;

      if (item.taxRuleId) {
        const [rule] = await db
          .select()
          .from(taxRules)
          .where(eq(taxRules.id, item.taxRuleId));

        if (rule) {
          const rate = parseFloat(rule.rate);
          if (rule.type === "exclusive") {
            lineTax = lineSubtotal * (rate / 100);
            lineTotal = lineSubtotal + lineTax;
          } else {
            // inclusive: tax is already inside the price
            lineTax = lineSubtotal - lineSubtotal / (1 + rate / 100);
            lineTotal = lineSubtotal; // price already includes tax
          }
        }
      }

      subtotal += lineSubtotal;
      totalTax += lineTax;

      processedLineItems.push({
        description: item.description ?? null,
        quantity: item.quantity ?? "1",
        unitPrice: item.unitPrice,
        taxRuleId: item.taxRuleId ?? null,
        taxAmount: lineTax.toFixed(2),
        totalAmount: lineTotal.toFixed(2),
      });
    }

    // For exclusive taxes, total = subtotal + totalTax; for mixed it's already correct per-line
    const totalAmount = subtotal + totalTax;

    // 3. Insert invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        type: invoiceData.type,
        clientId: invoiceData.clientId ?? null,
        personId: invoiceData.personId ?? null,
        status: invoiceData.status ?? "draft",
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate ?? null,
        currency: invoiceData.currency ?? "USD",
        notes: invoiceData.notes ?? null,
        subtotal: subtotal.toFixed(2),
        taxAmount: totalTax.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        organizationId,
      })
      .returning();

    // 4. Insert line items
    if (processedLineItems.length > 0) {
      await db
        .insert(invoiceLineItems)
        .values(processedLineItems.map(item => ({ ...item, invoiceId: invoice.id })));
    }

    // 5. Return the full invoice with line items
    return invoicingStorage.getInvoiceById(invoice.id, organizationId);
  },

  async updateInvoiceStatus(id: string, status: string, organizationId: string) {
    const [updated] = await db
      .update(invoices)
      .set({ status: status as any, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();
    return updated;
  },

  async deleteInvoice(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },
};
