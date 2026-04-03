import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./clerk";

// Requires an active organization context.
// Used on all org-scoped API routes.
export function requireOrg(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.bluxoOrg) {
    return res.status(400).json({
      message: "No organization selected. Please select an organization.",
    });
  }
  if (!req.membership) {
    return res.status(403).json({
      message: "You are not a member of this organization.",
    });
  }
  next();
}

// Helper to get the current org ID from the request.
// Call AFTER requireOrg middleware.
export function getOrgId(req: AuthenticatedRequest): string {
  return req.bluxoOrg!.id;
}

// Helper to get the current user's Clerk ID from the request.
export function getUserClerkId(req: AuthenticatedRequest): string {
  return req.bluxoUser!.clerkUserId;
}
