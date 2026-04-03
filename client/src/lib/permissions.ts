import { MODULES, type ModuleName } from "@shared/permissions";

// Re-export for convenient frontend usage
export { MODULES, type ModuleName };

// Stub: in Plan 2, this will check against the user's role permissions
export function hasModuleAccess(module: ModuleName): boolean {
  // Allow all access in Plan 1 — permissions enforced in Plan 2
  return true;
}
