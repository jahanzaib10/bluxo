import { 
  categories, 
  clients, 
  employees,
  paymentSources,
  income,
  expenses,
  users,
  type Category, 
  type InsertCategory,
  type Client, 
  type InsertClient,
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
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

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
  // User methods (legacy)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Account methods
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).orderBy(desc(accounts.created_at));
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updatedAccount] = await db
      .update(accounts)
      .set(account)
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return result.rowCount > 0;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(desc(categories.created_at));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.created_at));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updated_at: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient || undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount > 0;
  }

  // Developer methods
  async getDevelopers(): Promise<Developer[]> {
    return await db.select().from(developers).orderBy(desc(developers.created_at));
  }

  async getDeveloper(id: string): Promise<Developer | undefined> {
    const [developer] = await db.select().from(developers).where(eq(developers.id, id));
    return developer || undefined;
  }

  async createDeveloper(developer: InsertDeveloper): Promise<Developer> {
    const [newDeveloper] = await db.insert(developers).values(developer).returning();
    return newDeveloper;
  }

  async updateDeveloper(id: string, developer: Partial<InsertDeveloper>): Promise<Developer | undefined> {
    const [updatedDeveloper] = await db
      .update(developers)
      .set({ ...developer, updated_at: new Date() })
      .where(eq(developers.id, id))
      .returning();
    return updatedDeveloper || undefined;
  }

  async deleteDeveloper(id: string): Promise<boolean> {
    const result = await db.delete(developers).where(eq(developers.id, id));
    return result.rowCount > 0;
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.created_at));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount > 0;
  }

  // Payment Source methods
  async getPaymentSources(): Promise<PaymentSource[]> {
    return await db.select().from(paymentSources).orderBy(desc(paymentSources.createdAt));
  }

  async getPaymentSource(id: string): Promise<PaymentSource | undefined> {
    const [paymentSource] = await db.select().from(paymentSources).where(eq(paymentSources.id, id));
    return paymentSource || undefined;
  }

  async createPaymentSource(paymentSource: InsertPaymentSource): Promise<PaymentSource> {
    const [created] = await db
      .insert(paymentSources)
      .values(paymentSource)
      .returning();
    return created;
  }

  async updatePaymentSource(id: string, paymentSource: Partial<InsertPaymentSource>): Promise<PaymentSource | undefined> {
    const [updated] = await db
      .update(paymentSources)
      .set(paymentSource)
      .where(eq(paymentSources.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePaymentSource(id: string): Promise<boolean> {
    const result = await db.delete(paymentSources).where(eq(paymentSources.id, id));
    return result.rowCount > 0;
  }

  // Income methods
  async getIncome(): Promise<Income[]> {
    return await db.select().from(income).orderBy(desc(income.createdAt));
  }

  async getIncomeById(id: string): Promise<Income | undefined> {
    const [incomeRecord] = await db.select().from(income).where(eq(income.id, id));
    return incomeRecord || undefined;
  }

  async createIncome(incomeData: InsertIncome): Promise<Income> {
    const [created] = await db
      .insert(income)
      .values(incomeData)
      .returning();
    return created;
  }

  async updateIncome(id: string, incomeData: Partial<InsertIncome>): Promise<Income | undefined> {
    const [updated] = await db
      .update(income)
      .set(incomeData)
      .where(eq(income.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteIncome(id: string): Promise<boolean> {
    const result = await db.delete(income).where(eq(income.id, id));
    return result.rowCount > 0;
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const [created] = await db
      .insert(expenses)
      .values(expenseData)
      .returning();
    return created;
  }

  async updateExpense(id: string, expenseData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
