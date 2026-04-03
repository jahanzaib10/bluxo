import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./clerk";
import { ModuleName } from "@shared/permissions";

// Stub permission check — allows everything in Plan 1.
// Plan 2 will implement full role_permissions table lookup.
export function requireModule(moduleName: ModuleName) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // TODO: Plan 2 — check role_permissions for req.membership.customRoleId
    // For now, any authenticated org member can access any module
    if (!req.bluxoUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
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
