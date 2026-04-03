import { db } from "../../db";
import { income, expenses, subscriptions, clients, categories } from "@shared/schema";
import { eq, and, gte, lte, sql, desc, sum } from "drizzle-orm";

export const analyticsStorage = {
  /**
   * getDashboardSummary
   * Returns total income, total expenses, net profit, and recurring revenue.
   * Optionally filtered by a date range on the income/expense date field.
   */
  async getDashboardSummary(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ) {
    const incomeFilters = [eq(income.organizationId, organizationId)];
    const expenseFilters = [eq(expenses.organizationId, organizationId)];

    if (startDate) {
      incomeFilters.push(gte(income.date, startDate));
      expenseFilters.push(gte(expenses.date, startDate));
    }
    if (endDate) {
      incomeFilters.push(lte(income.date, endDate));
      expenseFilters.push(lte(expenses.date, endDate));
    }

    // Total income
    const incomeResult = await db
      .select({ total: sum(income.amount) })
      .from(income)
      .where(and(...incomeFilters));

    // Total expenses
    const expenseResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(...expenseFilters));

    // Recurring income (recurring revenue)
    const recurringIncomeResult = await db
      .select({ total: sum(income.amount) })
      .from(income)
      .where(and(...incomeFilters, eq(income.isRecurring, true)));

    // Client subscription costs
    const clientSubscriptionsResult = await db
      .select({ total: sum(subscriptions.amount) })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.organizationId, organizationId),
          eq(subscriptions.subscriptionType, "client")
        )
      );

    const totalIncome = parseFloat(incomeResult[0]?.total || "0");
    const totalExpenses = parseFloat(expenseResult[0]?.total || "0");
    const recurringRevenue = parseFloat(recurringIncomeResult[0]?.total || "0");
    const clientSubscriptionCosts = parseFloat(
      clientSubscriptionsResult[0]?.total || "0"
    );

    // Net Profit = Income - Expenses - Client Subscriptions
    const netProfit = totalIncome - totalExpenses - clientSubscriptionCosts;

    return { totalIncome, totalExpenses, netProfit, recurringRevenue };
  },

  /**
   * getMonthlyTrends
   * Returns income and expenses grouped by month (YYYY-MM), last 12 months.
   */
  async getMonthlyTrends(organizationId: string) {
    const incomeQuery = await db
      .select()
      .from(income)
      .where(eq(income.organizationId, organizationId))
      .orderBy(desc(income.date));

    const expenseQuery = await db
      .select()
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId))
      .orderBy(desc(expenses.date));

    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    incomeQuery.forEach((record) => {
      const month = new Date(record.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
      monthlyData[month].income += parseFloat(record.amount);
    });

    expenseQuery.forEach((record) => {
      const month = new Date(record.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
      monthlyData[month].expenses += parseFloat(record.amount);
    });

    // Convert to array, sort by month, return last 12 months
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  },

  /**
   * getClientContribution
   * Returns revenue per client with percentage of total income.
   */
  async getClientContribution(organizationId: string) {
    const clientIncomeQuery = await db
      .select({
        clientId: income.clientId,
        clientName: clients.name,
        totalIncome: sum(income.amount),
      })
      .from(income)
      .leftJoin(clients, eq(income.clientId, clients.id))
      .where(eq(income.organizationId, organizationId))
      .groupBy(income.clientId, clients.name)
      .orderBy(desc(sum(income.amount)));

    const totalIncomeResult = await db
      .select({ total: sum(income.amount) })
      .from(income)
      .where(eq(income.organizationId, organizationId));

    const totalIncome = parseFloat(totalIncomeResult[0]?.total || "0");

    return clientIncomeQuery.map((client) => ({
      clientId: client.clientId,
      clientName: client.clientName || "Unknown Client",
      totalIncome: parseFloat(client.totalIncome || "0"),
      percentage:
        totalIncome > 0
          ? (parseFloat(client.totalIncome || "0") / totalIncome) * 100
          : 0,
    }));
  },

  /**
   * getExpenseBreakdown
   * Returns top 5 expense categories (rolled up to parent category).
   */
  async getExpenseBreakdown(organizationId: string) {
    const expenseResults = await db
      .select()
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId));

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.organizationId, organizationId));

    // Build category lookup map
    const categoryMap: Record<string, typeof allCategories[number]> = {};
    allCategories.forEach((cat) => {
      categoryMap[cat.id] = cat;
    });

    // Group by parent category for rollup
    const categoryBreakdown: Record<string, number> = {};
    expenseResults.forEach((expense) => {
      const category = expense.categoryId ? categoryMap[expense.categoryId] : undefined;
      // Roll up to parent category if available, otherwise use the category name
      let categoryKey = "Uncategorized";
      if (category) {
        if (category.parentId) {
          const parent = categoryMap[category.parentId];
          categoryKey = parent?.name || category.name;
        } else {
          categoryKey = category.name;
        }
      }
      if (!categoryBreakdown[categoryKey]) {
        categoryBreakdown[categoryKey] = 0;
      }
      categoryBreakdown[categoryKey] += parseFloat(expense.amount || "0");
    });

    // Convert to array, sort desc, return top 5
    return Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  },
};
