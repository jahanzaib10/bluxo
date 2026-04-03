import { db } from "../../db";
import { roles, rolePermissions, teams, teamMembers, orgMemberships, users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS } from "@shared/permissions";
import type { Role, RolePermission, Team, TeamMember } from "@shared/schema";

export const rolesStorage = {
  // ─── Roles CRUD ──────────────────────────────────────────────────────────────

  async getRolesByOrg(organizationId: string): Promise<Role[]> {
    return await db
      .select()
      .from(roles)
      .where(eq(roles.organizationId, organizationId));
  },

  async getRoleById(id: string, organizationId: string): Promise<Role | undefined> {
    const [role] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));
    return role;
  },

  async getRoleWithPermissions(
    id: string,
    organizationId: string
  ): Promise<{ role: Role; permissions: RolePermission[] } | undefined> {
    const role = await rolesStorage.getRoleById(id, organizationId);
    if (!role) return undefined;
    const permissions = await rolesStorage.getPermissionsForRole(id);
    return { role, permissions };
  },

  async createRole(
    data: { name: string; description?: string },
    organizationId: string
  ): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values({ ...data, organizationId, isSystemRole: false })
      .returning();
    return newRole;
  },

  async updateRole(
    id: string,
    data: { name?: string; description?: string },
    organizationId: string
  ): Promise<Role | undefined> {
    const [existing] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));

    if (!existing || existing.isSystemRole) return undefined;

    const [updated] = await db
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)))
      .returning();
    return updated;
  },

  async deleteRole(id: string, organizationId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));

    if (!existing || existing.isSystemRole) return false;

    const result = await db
      .delete(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // ─── Permissions ─────────────────────────────────────────────────────────────

  async setRolePermissions(
    roleId: string,
    permissions: Array<{
      module: string;
      enabled: boolean;
      accessLevel?: "full" | "exclusive";
      additionalPerms?: Record<string, boolean>;
    }>
  ): Promise<RolePermission[]> {
    // Delete existing permissions for this role
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    if (permissions.length === 0) return [];

    const inserted = await db
      .insert(rolePermissions)
      .values(
        permissions.map((p) => ({
          roleId,
          module: p.module as RolePermission["module"],
          enabled: p.enabled,
          accessLevel: (p.accessLevel ?? "full") as "full" | "exclusive",
          additionalPerms: p.additionalPerms ?? null,
        }))
      )
      .returning();
    return inserted;
  },

  async getPermissionsForRole(roleId: string): Promise<RolePermission[]> {
    return await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
  },

  // ─── System Role Seeding ─────────────────────────────────────────────────────

  async seedSystemRoles(organizationId: string): Promise<void> {
    // Check if any system role already exists for this org
    const [existing] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, organizationId), eq(roles.isSystemRole, true)))
      .limit(1);

    if (existing) return; // Already seeded

    const systemRoleDefinitions = [
      { key: SYSTEM_ROLES.OWNER, name: "Owner" },
      { key: SYSTEM_ROLES.ADMIN, name: "Admin" },
      { key: SYSTEM_ROLES.ACCOUNTANT, name: "Accountant" },
      { key: SYSTEM_ROLES.HR_MANAGER, name: "HR Manager" },
      { key: SYSTEM_ROLES.MANAGER, name: "Manager" },
      { key: SYSTEM_ROLES.VIEWER, name: "Viewer" },
    ] as const;

    for (const { key, name } of systemRoleDefinitions) {
      const [newRole] = await db
        .insert(roles)
        .values({ name, organizationId, isSystemRole: true })
        .returning();

      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[key];
      const permissionRows = Object.entries(defaultPerms)
        .filter(([, value]) => value !== false)
        .map(([module, value]) => ({
          roleId: newRole.id,
          module: module as RolePermission["module"],
          enabled: true,
          accessLevel: value === "exclusive" ? ("exclusive" as const) : ("full" as const),
        }));

      if (permissionRows.length > 0) {
        await db.insert(rolePermissions).values(permissionRows);
      }
    }
  },

  // ─── User Management ─────────────────────────────────────────────────────────

  async assignRoleToUser(
    clerkUserId: string,
    roleId: string | null,
    organizationId: string
  ): Promise<boolean> {
    const result = await db
      .update(orgMemberships)
      .set({ customRoleId: roleId })
      .where(
        and(
          eq(orgMemberships.clerkUserId, clerkUserId),
          eq(orgMemberships.organizationId, organizationId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  },

  async getUsersWithRoles(
    organizationId: string
  ): Promise<
    Array<{
      clerkUserId: string;
      userId: string;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
      isOwner: boolean;
      customRoleId: string | null;
      roleName: string | null;
      membershipId: string;
    }>
  > {
    const memberships = await db
      .select({
        membershipId: orgMemberships.id,
        clerkUserId: orgMemberships.clerkUserId,
        isOwner: orgMemberships.isOwner,
        customRoleId: orgMemberships.customRoleId,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        userId: users.id,
      })
      .from(orgMemberships)
      .leftJoin(users, eq(orgMemberships.clerkUserId, users.clerkUserId))
      .where(
        and(
          eq(orgMemberships.organizationId, organizationId),
          eq(orgMemberships.status, "active")
        )
      );

    // Collect all unique customRoleIds to resolve role names
    const roleIds = [...new Set(memberships.map((m) => m.customRoleId).filter(Boolean))] as string[];

    const roleMap = new Map<string, string>();
    if (roleIds.length > 0) {
      const roleRows = await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(eq(roles.organizationId, organizationId));
      for (const r of roleRows) {
        roleMap.set(r.id, r.name);
      }
    }

    return memberships.map((m) => ({
      membershipId: m.membershipId,
      clerkUserId: m.clerkUserId,
      userId: m.userId ?? "",
      name: m.name ?? null,
      email: m.email ?? null,
      avatarUrl: m.avatarUrl ?? null,
      isOwner: m.isOwner ?? false,
      customRoleId: m.customRoleId ?? null,
      roleName: m.isOwner
        ? "Owner"
        : m.customRoleId
        ? (roleMap.get(m.customRoleId) ?? null)
        : null,
    }));
  },

  // ─── Teams ────────────────────────────────────────────────────────────────────

  async getTeamsByOrg(
    organizationId: string
  ): Promise<Array<Team & { memberCount: number }>> {
    const teamRows = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        organizationId: teams.organizationId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberCount: sql<number>`count(${teamMembers.id})::int`,
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teams.organizationId, organizationId))
      .groupBy(
        teams.id,
        teams.name,
        teams.description,
        teams.organizationId,
        teams.createdAt,
        teams.updatedAt
      );

    return teamRows;
  },

  async createTeam(
    data: { name: string; description?: string },
    organizationId: string
  ): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values({ ...data, organizationId })
      .returning();
    return newTeam;
  },

  async deleteTeam(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(teams)
      .where(and(eq(teams.id, id), eq(teams.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  async addTeamMember(
    teamId: string,
    userId: string,
    organizationId: string
  ): Promise<TeamMember> {
    const [member] = await db
      .insert(teamMembers)
      .values({ teamId, userId, organizationId })
      .onConflictDoNothing()
      .returning();
    return member;
  },

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  },
};
