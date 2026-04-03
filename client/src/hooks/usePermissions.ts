import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { type ModuleName } from "@shared/permissions";

interface PermissionData {
  enabled: boolean;
  accessLevel: "full" | "exclusive";
  additionalPerms: Record<string, boolean> | null;
}

interface PermissionsResponse {
  permissions: Record<string, PermissionData>;
  isOwner: boolean;
  roleName: string | null;
}

export function usePermissions() {
  const { isSignedIn, organization } = useAuth();

  const { data, isLoading } = useQuery<PermissionsResponse>({
    queryKey: ["/api/auth/permissions", organization?.id],
    enabled: !!isSignedIn && !!organization,
    staleTime: 2 * 60 * 1000,
  });

  const canAccess = (module: ModuleName): boolean => {
    if (!data) return false;
    if (data.isOwner) return true;
    return data.permissions[module]?.enabled ?? false;
  };

  const getAccessLevel = (module: ModuleName): "full" | "exclusive" | null => {
    if (!data) return null;
    if (data.isOwner) return "full";
    return data.permissions[module]?.accessLevel ?? null;
  };

  const hasAdditionalPerm = (module: ModuleName, perm: string): boolean => {
    if (!data) return false;
    if (data.isOwner) return true;
    return data.permissions[module]?.additionalPerms?.[perm] ?? false;
  };

  return {
    canAccess,
    getAccessLevel,
    hasAdditionalPerm,
    isOwner: data?.isOwner ?? false,
    roleName: data?.roleName ?? null,
    isLoaded: !isLoading,
    permissions: data?.permissions ?? {},
  };
}
