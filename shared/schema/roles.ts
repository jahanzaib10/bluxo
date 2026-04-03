import {
  pgTable, uuid, varchar, text, boolean, timestamp, jsonb, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { organizations } from "../schema";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  module: varchar("module", {
    enum: [
      "dashboard", "finance", "people", "clients", "analytics",
      "settings", "integrations", "data_room", "payroll", "invoicing",
    ],
  }).notNull(),
  enabled: boolean("enabled").default(true),
  accessLevel: varchar("access_level", { enum: ["full", "exclusive"] }).default("full"),
  additionalPerms: jsonb("additional_perms").$type<Record<string, boolean>>(),
}, (table) => [
  uniqueIndex("role_module_unique").on(table.roleId, table.module),
]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("team_user_unique").on(table.teamId, table.userId),
]);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  permissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const insertRoleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const insertRolePermissionSchema = z.object({
  module: z.enum([
    "dashboard", "finance", "people", "clients", "analytics",
    "settings", "integrations", "data_room", "payroll", "invoicing",
  ]),
  enabled: z.boolean().default(true),
  accessLevel: z.enum(["full", "exclusive"]).default("full"),
  additionalPerms: z.record(z.boolean()).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(insertRolePermissionSchema),
});

export const insertTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
