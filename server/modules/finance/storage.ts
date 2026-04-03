import { db } from "../../db";
import { income, expenses, subscriptions, people, clients, categories, paymentSources } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const financeStorage = {
  // ── Income ────────────────────────────────────────────────────────────────

  async getIncomeByOrg(organizationId: string) {
    const result = await db
      .select({
        id: income.id,
        amount: income.amount,
        description: income.description,
        date: income.date,
        isRecurring: income.isRecurring,
        recurringFrequency: income.recurringFrequency,
        recurringEndDate: income.recurringEndDate,
        status: income.status,
        invoiceId: income.invoiceId,
        currency: income.currency,
        createdAt: income.createdAt,
        clientId: income.clientId,
        categoryId: income.categoryId,
        paymentSourceId: income.paymentSourceId,
        clientName: clients.name,
        categoryName: categories.name,
        categoryParentId: categories.parentId,
        paymentSourceName: paymentSources.name,
      })
      .from(income)
      .leftJoin(clients, eq(income.clientId, clients.id))
      .leftJoin(categories, eq(income.categoryId, categories.id))
      .leftJoin(paymentSources, eq(income.paymentSourceId, paymentSources.id))
      .where(eq(income.organizationId, organizationId))
      .orderBy(desc(income.createdAt));

    // Build hierarchical category names
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.organizationId, organizationId));

    return result.map(record => {
      let hierarchicalCategoryName = record.categoryName;
      if (record.categoryName && record.categoryParentId) {
        const parent = allCategories.find(c => c.id === record.categoryParentId);
        if (parent) {
          hierarchicalCategoryName = `${parent.name} → ${record.categoryName}`;
        }
      }
      return { ...record, categoryName: hierarchicalCategoryName };
    });
  },

  async createIncome(data: any) {
    const [record] = await db
      .insert(income)
      .values(data)
      .returning();
    return record;
  },

  async updateIncome(id: string, organizationId: string, data: any) {
    const [record] = await db
      .update(income)
      .set(data)
      .where(and(eq(income.id, id), eq(income.organizationId, organizationId)))
      .returning();
    return record;
  },

  async deleteIncome(id: string, organizationId: string) {
    const result = await db
      .delete(income)
      .where(and(eq(income.id, id), eq(income.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // Bulk import helpers
  async getCategoriesByOrg(organizationId: string, type?: string) {
    if (type) {
      return db
        .select()
        .from(categories)
        .where(and(eq(categories.organizationId, organizationId), eq(categories.type, type)));
    }
    return db.select().from(categories).where(eq(categories.organizationId, organizationId));
  },

  async getClientsByOrg(organizationId: string) {
    return db.select().from(clients).where(eq(clients.organizationId, organizationId));
  },

  async getPaymentSourcesByOrg(organizationId: string) {
    return db
      .select()
      .from(paymentSources)
      .where(eq(paymentSources.organizationId, organizationId));
  },

  // ── Expenses ──────────────────────────────────────────────────────────────

  async getExpensesByOrg(organizationId: string) {
    const result = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        description: expenses.description,
        date: expenses.date,
        isRecurring: expenses.isRecurring,
        recurringFrequency: expenses.recurringFrequency,
        recurringEndDate: expenses.recurringEndDate,
        createdAt: expenses.createdAt,
        personId: expenses.personId,
        categoryId: expenses.categoryId,
        personName: people.firstName,
        personLastName: people.lastName,
        personEmail: people.email,
        categoryName: categories.name,
        categoryParentId: categories.parentId,
      })
      .from(expenses)
      .leftJoin(people, eq(expenses.personId, people.id))
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.organizationId, organizationId))
      .orderBy(desc(expenses.createdAt));

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.organizationId, organizationId));

    return result.map(expense => {
      let hierarchicalCategoryName = expense.categoryName;
      if (expense.categoryName && expense.categoryParentId) {
        const parent = allCategories.find(c => c.id === expense.categoryParentId);
        if (parent) {
          hierarchicalCategoryName = `${parent.name} → ${expense.categoryName}`;
        }
      }
      // Build a display name for the person
      const personName = expense.personName
        ? [expense.personName, expense.personLastName].filter(Boolean).join(" ")
        : null;
      return {
        ...expense,
        categoryName: hierarchicalCategoryName,
        personName,
        personEmail: expense.personEmail || null,
      };
    });
  },

  async getExpensesByPerson(personId: string, organizationId: string) {
    const result = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        description: expenses.description,
        date: expenses.date,
        isRecurring: expenses.isRecurring,
        recurringFrequency: expenses.recurringFrequency,
        recurringEndDate: expenses.recurringEndDate,
        createdAt: expenses.createdAt,
        personId: expenses.personId,
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        categoryParentId: categories.parentId,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(eq(expenses.personId, personId), eq(expenses.organizationId, organizationId)))
      .orderBy(desc(expenses.createdAt));

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.organizationId, organizationId));

    return result.map(expense => {
      let hierarchicalCategoryName = expense.categoryName;
      if (expense.categoryName && expense.categoryParentId) {
        const parent = allCategories.find(c => c.id === expense.categoryParentId);
        if (parent) {
          hierarchicalCategoryName = `${parent.name} → ${expense.categoryName}`;
        }
      }
      return { ...expense, categoryName: hierarchicalCategoryName };
    });
  },

  async createExpense(data: any) {
    const [record] = await db
      .insert(expenses)
      .values(data)
      .returning();
    return record;
  },

  async updateExpense(id: string, organizationId: string, data: any) {
    const [record] = await db
      .update(expenses)
      .set(data)
      .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))
      .returning();
    return record;
  },

  async deleteExpense(id: string, organizationId: string) {
    const result = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  async getPeopleByOrg(organizationId: string) {
    return db.select().from(people).where(eq(people.organizationId, organizationId));
  },

  async getPersonById(personId: string, organizationId: string) {
    const [person] = await db
      .select()
      .from(people)
      .where(and(eq(people.id, personId), eq(people.organizationId, organizationId)));
    return person;
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────

  async getSubscriptionsByOrg(organizationId: string) {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .orderBy(desc(subscriptions.createdAt));
  },

  async createSubscription(data: any) {
    const [record] = await db
      .insert(subscriptions)
      .values(data)
      .returning();
    return record;
  },

  async updateSubscription(id: string, organizationId: string, data: any) {
    const [record] = await db
      .update(subscriptions)
      .set(data)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.organizationId, organizationId)))
      .returning();
    return record;
  },

  async deleteSubscription(id: string, organizationId: string) {
    const result = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },
};
