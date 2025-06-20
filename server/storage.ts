import { 
  organizations,
  categories, 
  clients, 
  clientPermissions,
  clientAuthTokens,
  employees,
  paymentSources,
  income,
  expenses,
  subscriptions,
  users,
  userInvitations,
  type Organization,
  type InsertOrganization,
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
  type Subscription,
  type InsertSubscription,
  type User, 
  type UpsertUser,
  type UserInvitation,
  type InsertUserInvitation,
  type UpdateUserRole,
  type UpdateUserStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull } from "drizzle-orm";

export interface IStorage {
  // Organization methods
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;

  // User methods (legacy)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  updateUserOrganization(id: string, organizationId: string): Promise<User | undefined>;

  // User management methods
  getUsers(organizationId: string): Promise<User[]>;
  updateUserRole(id: string, role: UpdateUserRole): Promise<User | undefined>;
  updateUserStatus(id: string, status: UpdateUserStatus): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // User invitation methods
  getUserInvitations(organizationId: string): Promise<UserInvitation[]>;
  createUserInvitation(invitation: InsertUserInvitation, invitedById: string, organizationId: string): Promise<UserInvitation>;
  getInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  updateInvitationStatus(id: string, status: string): Promise<UserInvitation | undefined>;
  deleteInvitation(id: string): Promise<boolean>;

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

  // Subscription methods
  getSubscriptions(): Promise<Subscription[]>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Organization operations
  async createOrganization(organizationData: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values({
        name: organizationData.name
      })
      .returning();
    return organization;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserOrganization(id: string, organizationId: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ organizationId })
      .where(eq(users.id, id))
      .returning();
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
    // First delete related permissions
    await db.delete(clientPermissions).where(eq(clientPermissions.clientId, id));
    
    // Then delete related auth tokens
    await db.delete(clientAuthTokens).where(eq(clientAuthTokens.clientId, id));
    
    // Finally delete the client
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
    // First try to find existing permissions
    const existing = await this.getClientPermissions(permissions.clientId!);
    
    if (existing) {
      // Update existing permissions
      const [result] = await db
        .update(clientPermissions)
        .set({
          showIncomeGraph: permissions.showIncomeGraph,
          showCategoryBreakdown: permissions.showCategoryBreakdown,
          showPaymentHistory: permissions.showPaymentHistory,
          showInvoices: permissions.showInvoices,
          updatedAt: new Date(),
        })
        .where(eq(clientPermissions.clientId, permissions.clientId!))
        .returning();
      return result;
    } else {
      // Create new permissions
      const [result] = await db
        .insert(clientPermissions)
        .values(permissions)
        .returning();
      return result;
    }
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

  // Subscription operations
  async getSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return newSubscription;
  }

  async updateSubscription(id: string, subscriptionData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return result.rowCount! > 0;
  }

  // User management methods
  async getUsers(organizationId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async updateUserRole(id: string, roleData: UpdateUserRole): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role: roleData.role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStatus(id: string, statusData: UpdateUserStatus): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status: statusData.status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount! > 0;
  }

  // User invitation methods
  async getUserInvitations(organizationId: string): Promise<UserInvitation[]> {
    return await db.select().from(userInvitations).where(eq(userInvitations.organizationId, organizationId));
  }

  async createUserInvitation(invitation: InsertUserInvitation, invitedById: string, organizationId: string): Promise<UserInvitation> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [userInvitation] = await db
      .insert(userInvitations)
      .values({
        ...invitation,
        token,
        invitedById,
        organizationId,
        expiresAt,
      })
      .returning();
    return userInvitation;
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db.select().from(userInvitations).where(eq(userInvitations.token, token));
    return invitation;
  }

  async updateInvitationStatus(id: string, status: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .update(userInvitations)
      .set({ status, updatedAt: new Date() })
      .where(eq(userInvitations.id, id))
      .returning();
    return invitation;
  }

  async deleteInvitation(id: string): Promise<boolean> {
    const result = await db.delete(userInvitations).where(eq(userInvitations.id, id));
    return result.rowCount! > 0;
  }
}

export const storage = new DatabaseStorage();