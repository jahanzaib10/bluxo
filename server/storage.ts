import { 
  categories, 
  clients, 
  clientPermissions,
  clientAuthTokens,
  employees,
  paymentSources,
  income,
  expenses,
  users,
  type Category, 
  type InsertCategory,
  type Client, 
  type InsertClient,
  type ClientPermissions,
  type InsertClientPermissions,
  type ClientAuthToken,
  type Employee, 
  type InsertEmployee,
  type PaymentSource,
  type InsertPaymentSource,
  type Income,
  type InsertIncome,
  type Expense,
  type InsertExpense,
  type User, 
  type UpsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods (legacy)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Client methods
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Client permissions methods
  getClientPermissions(clientId: string): Promise<ClientPermissions | undefined>;
  upsertClientPermissions(permissions: InsertClientPermissions): Promise<ClientPermissions>;

  // Client auth token methods
  createClientAuthToken(clientId: string, email: string): Promise<ClientAuthToken>;
  getClientByToken(token: string): Promise<Client | undefined>;
  markTokenAsUsed(token: string): Promise<boolean>;

  // Employee methods
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // Payment Source methods
  getPaymentSources(): Promise<PaymentSource[]>;
  getPaymentSource(id: string): Promise<PaymentSource | undefined>;
  createPaymentSource(paymentSource: InsertPaymentSource): Promise<PaymentSource>;
  updatePaymentSource(id: string, paymentSource: Partial<InsertPaymentSource>): Promise<PaymentSource | undefined>;
  deletePaymentSource(id: string): Promise<boolean>;

  // Income methods
  getIncome(): Promise<Income[]>;
  getIncomeById(id: string): Promise<Income | undefined>;
  createIncome(income: InsertIncome): Promise<Income>;
  updateIncome(id: string, income: Partial<InsertIncome>): Promise<Income | undefined>;
  deleteIncome(id: string): Promise<boolean>;

  // Expense methods
  getExpenses(): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, username));
    return user;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount! > 0;
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount! > 0;
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client;
  }

  async getClientPermissions(clientId: string): Promise<ClientPermissions | undefined> {
    const [permissions] = await db.select().from(clientPermissions).where(eq(clientPermissions.clientId, clientId));
    return permissions;
  }

  async upsertClientPermissions(permissions: InsertClientPermissions): Promise<ClientPermissions> {
    const [result] = await db
      .insert(clientPermissions)
      .values(permissions)
      .onConflictDoUpdate({
        target: clientPermissions.clientId,
        set: {
          show_income_graph: permissions.showIncomeGraph,
          show_category_breakdown: permissions.showCategoryBreakdown,
          show_payment_history: permissions.showPaymentHistory,
          show_invoices: permissions.showInvoices,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async createClientAuthToken(clientId: string, email: string): Promise<ClientAuthToken> {
    const token = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const [authToken] = await db
      .insert(clientAuthTokens)
      .values({
        token,
        clientId,
        email,
        expiresAt,
      })
      .returning();
    return authToken;
  }

  async getClientByToken(token: string): Promise<Client | undefined> {
    const [authToken] = await db
      .select({
        client: clients,
        token: clientAuthTokens,
      })
      .from(clientAuthTokens)
      .innerJoin(clients, eq(clientAuthTokens.clientId, clients.id))
      .where(eq(clientAuthTokens.token, token));

    // Only check expiration, allow reuse of tokens within their validity period
    if (!authToken || authToken.token.expiresAt < new Date()) {
      return undefined;
    }

    return authToken.client;
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const result = await db
      .update(clientAuthTokens)
      .set({ used: true })
      .where(eq(clientAuthTokens.token, token));
    return result.rowCount! > 0;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount! > 0;
  }

  async getPaymentSources(): Promise<PaymentSource[]> {
    return await db.select().from(paymentSources);
  }

  async getPaymentSource(id: string): Promise<PaymentSource | undefined> {
    const [paymentSource] = await db.select().from(paymentSources).where(eq(paymentSources.id, id));
    return paymentSource;
  }

  async createPaymentSource(paymentSource: InsertPaymentSource): Promise<PaymentSource> {
    const [newPaymentSource] = await db
      .insert(paymentSources)
      .values(paymentSource)
      .returning();
    return newPaymentSource;
  }

  async updatePaymentSource(id: string, paymentSource: Partial<InsertPaymentSource>): Promise<PaymentSource | undefined> {
    const [updatedPaymentSource] = await db
      .update(paymentSources)
      .set(paymentSource)
      .where(eq(paymentSources.id, id))
      .returning();
    return updatedPaymentSource;
  }

  async deletePaymentSource(id: string): Promise<boolean> {
    const result = await db.delete(paymentSources).where(eq(paymentSources.id, id));
    return result.rowCount! > 0;
  }

  async getIncome(): Promise<Income[]> {
    return await db.select().from(income);
  }

  async getIncomeById(id: string): Promise<Income | undefined> {
    const [incomeRecord] = await db.select().from(income).where(eq(income.id, id));
    return incomeRecord;
  }

  async createIncome(incomeData: InsertIncome): Promise<Income> {
    const [newIncome] = await db
      .insert(income)
      .values(incomeData)
      .returning();
    return newIncome;
  }

  async updateIncome(id: string, incomeData: Partial<InsertIncome>): Promise<Income | undefined> {
    const [updatedIncome] = await db
      .update(income)
      .set(incomeData)
      .where(eq(income.id, id))
      .returning();
    return updatedIncome;
  }

  async deleteIncome(id: string): Promise<boolean> {
    const result = await db.delete(income).where(eq(income.id, id));
    return result.rowCount! > 0;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses);
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values(expenseData)
      .returning();
    return newExpense;
  }

  async updateExpense(id: string, expenseData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updatedExpense] = await db
      .update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return result.rowCount! > 0;
  }
}

export const storage = new DatabaseStorage();