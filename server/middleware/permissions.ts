import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./clerk";
import { ModuleName } from "@shared/permissions";
import { db } from "../db";
import { rolePermissions, roles } from "@shared/schema";
import { eq } from "drizzle-orm";

async function loadPermissions(req: AuthenticatedRequest): Promise<Map<string, { enabled: boolean; accessLevel: string; additionalPerms: Record<string, boolean> | null }>> {
  if ((req as any)._permissionsCache) return (req as any)._permissionsCache;

  const cache = new Map<string, { enabled: boolean; accessLevel: string; additionalPerms: Record<string, boolean> | null }>();

  if (req.membership?.isOwner) {
    const allModules: ModuleName[] = [
      "dashboard", "finance", "people", "clients", "analytics",
      "settings", "integrations", "data_room", "payroll", "invoicing",
    ];
    for (const mod of allModules) {
      cache.set(mod, { enabled: true, accessLevel: "full", additionalPerms: null });
    }
    (req as any)._permissionsCache = cache;
    return cache;
  }

  const roleId = req.membership?.customRoleId;
  if (roleId) {
    const perms = await db.select().from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    for (const p of perms) {
      cache.set(p.module, {
        enabled: p.enabled ?? true,
        accessLevel: p.accessLevel ?? "full",
        additionalPerms: p.additionalPerms as Record<string, boolean> | null,
      });
    }
  }

  (req as any)._permissionsCache = cache;
  return cache;
}

export function requireModule(moduleName: ModuleName) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.bluxoUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!req.membership) {
      return res.status(403).json({ message: "No organization membership" });
    }
    if (req.membership.isOwner) {
      return next();
    }
    if (!req.membership.customRoleId) {
      return res.status(403).json({ message: "No role assigned. Contact your organization admin." });
    }

    const perms = await loadPermissions(req);
    const modulePerm = perms.get(moduleName);

    if (!modulePerm || !modulePerm.enabled) {
      return res.status(403).json({ message: `Access denied to ${moduleName} module` });
    }

    (req as any).moduleAccessLevel = modulePerm.accessLevel;
    (req as any).moduleAdditionalPerms = modulePerm.additionalPerms;
    next();
  };
}

export function requireOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.membership?.isOwner) {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
}

export async function getUserPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.bluxoUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!req.membership) {
      return res.json({ permissions: {}, isOwner: false, roleName: null });
    }
    if (req.membership.isOwner) {
      const allPerms: Record<string, any> = {};
      const allModules: ModuleName[] = [
        "dashboard", "finance", "people", "clients", "analytics",
        "settings", "integrations", "data_room", "payroll", "invoicing",
      ];
      for (const mod of allModules) {
        allPerms[mod] = { enabled: true, accessLevel: "full", additionalPerms: null };
      }
      return res.json({ permissions: allPerms, isOwner: true, roleName: "Owner" });
    }

    const perms = await loadPermissions(req);
    const permObj: Record<string, any> = {};
    for (const [key, val] of perms) {
      permObj[key] = val;
    }

    let roleName = "No Role";
    if (req.membership.customRoleId) {
      const [role] = await db.select().from(roles)
        .where(eq(roles.id, req.membership.customRoleId));
      if (role) roleName = role.name;
    }

    res.json({ permissions: permObj, isOwner: false, roleName });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
