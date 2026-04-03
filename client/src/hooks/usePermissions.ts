import { type ModuleName } from "@shared/permissions";

export function usePermissions() {
  // Stub: Plan 2 will fetch role_permissions from the API
  return {
    canAccess: (module: ModuleName) => true,
    isOwner: false,
    isLoaded: true,
  };
}
