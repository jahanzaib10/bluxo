import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { rolesStorage } from "./storage";
import { insertRoleSchema, updateRolePermissionsSchema, insertTeamSchema } from "@shared/schema";

const router = Router();

router.use("/api", requireOrg);

// ─── Roles ────────────────────────────────────────────────────────────────────

// GET /api/roles — list all roles (seeds system roles on first access)
router.get("/api/roles", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    await rolesStorage.seedSystemRoles(organizationId);
    const result = await rolesStorage.getRolesByOrg(organizationId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
});

// GET /api/roles/:id — get role with permissions
router.get("/api/roles/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const result = await rolesStorage.getRoleWithPermissions(id, organizationId);
    if (!result) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ message: "Failed to fetch role" });
  }
});

// POST /api/roles — create custom role
router.post("/api/roles", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const validatedData = insertRoleSchema.parse(req.body) as { name: string; description?: string };
    const newRole = await rolesStorage.createRole(validatedData, organizationId);
    res.status(201).json(newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Failed to create role" });
  }
});

// PUT /api/roles/:id — update role
router.put("/api/roles/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const validatedData = insertRoleSchema.partial().parse(req.body);
    const updated = await rolesStorage.updateRole(id, validatedData, organizationId);
    if (!updated) {
      return res.status(404).json({ message: "Role not found or is a system role" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
});

// DELETE /api/roles/:id — delete role
router.delete("/api/roles/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const success = await rolesStorage.deleteRole(id, organizationId);
    if (!success) {
      return res.status(404).json({ message: "Role not found or is a system role" });
    }
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Failed to delete role" });
  }
});

// PUT /api/roles/:id/permissions — set role permissions
router.put("/api/roles/:id/permissions", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);

    // Verify role belongs to org
    const role = await rolesStorage.getRoleById(id, organizationId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const { permissions } = updateRolePermissionsSchema.parse(req.body);
    const result = await rolesStorage.setRolePermissions(id, permissions as any);
    res.json(result);
  } catch (error) {
    console.error("Error setting role permissions:", error);
    res.status(500).json({ message: "Failed to set role permissions" });
  }
});

// ─── Org Users ────────────────────────────────────────────────────────────────

// GET /api/org-users — list users with roles
router.get("/api/org-users", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const result = await rolesStorage.getUsersWithRoles(organizationId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching org users:", error);
    res.status(500).json({ message: "Failed to fetch org users" });
  }
});

// PUT /api/org-users/:clerkUserId/role — assign role to user
router.put("/api/org-users/:clerkUserId/role", async (req: AuthenticatedRequest, res) => {
  try {
    const { clerkUserId } = req.params;
    const organizationId = getOrgId(req);
    const { roleId } = req.body;

    // roleId can be null to unassign
    const success = await rolesStorage.assignRoleToUser(
      clerkUserId,
      roleId ?? null,
      organizationId
    );

    if (!success) {
      return res.status(404).json({ message: "User membership not found" });
    }

    res.json({ message: "Role assigned successfully" });
  } catch (error) {
    console.error("Error assigning role to user:", error);
    res.status(500).json({ message: "Failed to assign role" });
  }
});

// ─── Teams ────────────────────────────────────────────────────────────────────

// GET /api/teams — list teams with member counts
router.get("/api/teams", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const result = await rolesStorage.getTeamsByOrg(organizationId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
});

// POST /api/teams — create team
router.post("/api/teams", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const validatedData = insertTeamSchema.parse(req.body) as { name: string; description?: string };
    const newTeam = await rolesStorage.createTeam(validatedData, organizationId);
    res.status(201).json(newTeam);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Failed to create team" });
  }
});

// DELETE /api/teams/:id — delete team
router.delete("/api/teams/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const success = await rolesStorage.deleteTeam(id, organizationId);
    if (!success) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Failed to delete team" });
  }
});

// POST /api/teams/:id/members — add team member
router.post("/api/teams/:id/members", async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId } = req.params;
    const organizationId = getOrgId(req);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const member = await rolesStorage.addTeamMember(teamId, userId, organizationId);
    res.status(201).json(member);
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({ message: "Failed to add team member" });
  }
});

// DELETE /api/teams/:id/members/:userId — remove team member
router.delete("/api/teams/:id/members/:userId", async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId, userId } = req.params;
    const success = await rolesStorage.removeTeamMember(teamId, userId);
    if (!success) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ message: "Team member removed successfully" });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({ message: "Failed to remove team member" });
  }
});

export default router;
