import {
  users,
  organizations,
  userInvitations,
  passwordResetTokens,
  categories,
  clients,
  developers,
  employees,
  type User,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type UserInvitation,
  type InsertUserInvitation,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type Category,
  type InsertCategory,
  type Client,
  type InsertClient,
  type Developer,
  type InsertDeveloper,
  type Employee,
  type InsertEmployee,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Enterprise User Management
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByOrganization(orgId: string): Promise<User[]>;

  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | undefined>;

  // User Invitation methods
  createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  acceptInvitation(token: string): Promise<UserInvitation | undefined>;
  getInvitationsByOrganization(orgId: string): Promise<UserInvitation[]>;

  // Password Reset methods
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  usePasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;

  // Category methods
  getCategories(orgId: string): Promise<Category[]>;
  getCategory(id: string, orgId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>, orgId: string): Promise<Category | undefined>;
  deleteCategory(id: string, orgId: string): Promise<boolean>;

  // Client methods
  getClients(orgId: string): Promise<Client[]>;
  getClient(id: string, orgId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>, orgId: string): Promise<Client | undefined>;
  deleteClient(id: string, orgId: string): Promise<boolean>;

  // Developer methods
  getDevelopers(orgId: string): Promise<Developer[]>;
  getDeveloper(id: string, orgId: string): Promise<Developer | undefined>;
  createDeveloper(developer: InsertDeveloper): Promise<Developer>;
  updateDeveloper(id: string, developer: Partial<InsertDeveloper>, orgId: string): Promise<Developer | undefined>;
  deleteDeveloper(id: string, orgId: string): Promise<boolean>;

  // Employee methods
  getEmployees(orgId: string): Promise<Employee[]>;
  getEmployee(id: string, orgId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>, orgId: string): Promise<Employee | undefined>;
  deleteEmployee(id: string, orgId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Enterprise User Management
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByOrganization(orgId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.orgId, orgId));
  }

  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(org).returning();
    return newOrg;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [org] = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  // User Invitation methods
  async createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [newInvitation] = await db.insert(userInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db.select().from(userInvitations).where(eq(userInvitations.token, token));
    return invitation;
  }

  async acceptInvitation(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.token, token))
      .returning();
    return invitation;
  }

  async getInvitationsByOrganization(orgId: string): Promise<UserInvitation[]> {
    return await db.select().from(userInvitations).where(eq(userInvitations.orgId, orgId));
  }

  // Password Reset methods
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db.insert(passwordResetTokens).values(token).returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async usePasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token))
      .returning();
    return resetToken;
  }

  // Category methods with organization filtering
  async getCategories(orgId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.createdBy, orgId));
  }

  async getCategory(id: string, orgId: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(
      and(eq(categories.id, id), eq(categories.createdBy, orgId))
    );
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>, orgId: string): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.createdBy, orgId)))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string, orgId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.createdBy, orgId)));
    return result.rowCount > 0;
  }

  // Client methods with organization filtering
  async getClients(orgId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.createdBy, orgId));
  }

  async getClient(id: string, orgId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(
      and(eq(clients.id, id), eq(clients.createdBy, orgId))
    );
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>, orgId: string): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.createdBy, orgId)))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string, orgId: string): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.createdBy, orgId)));
    return result.rowCount > 0;
  }

  // Developer methods with organization filtering
  async getDevelopers(orgId: string): Promise<Developer[]> {
    return await db.select().from(developers).where(eq(developers.createdBy, orgId));
  }

  async getDeveloper(id: string, orgId: string): Promise<Developer | undefined> {
    const [developer] = await db.select().from(developers).where(
      and(eq(developers.id, id), eq(developers.createdBy, orgId))
    );
    return developer;
  }

  async createDeveloper(developer: InsertDeveloper): Promise<Developer> {
    const [newDeveloper] = await db.insert(developers).values(developer).returning();
    return newDeveloper;
  }

  async updateDeveloper(id: string, developer: Partial<InsertDeveloper>, orgId: string): Promise<Developer | undefined> {
    const [updatedDeveloper] = await db
      .update(developers)
      .set({ ...developer, updatedAt: new Date() })
      .where(and(eq(developers.id, id), eq(developers.createdBy, orgId)))
      .returning();
    return updatedDeveloper;
  }

  async deleteDeveloper(id: string, orgId: string): Promise<boolean> {
    const result = await db
      .delete(developers)
      .where(and(eq(developers.id, id), eq(developers.createdBy, orgId)));
    return result.rowCount > 0;
  }

  // Employee methods with organization filtering
  async getEmployees(orgId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.createdBy, orgId));
  }

  async getEmployee(id: string, orgId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(
      and(eq(employees.id, id), eq(employees.createdBy, orgId))
    );
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>, orgId: string): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(and(eq(employees.id, id), eq(employees.createdBy, orgId)))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string, orgId: string): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.createdBy, orgId)));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();