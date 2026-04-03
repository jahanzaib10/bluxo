import { ReactNode } from "react";
import { type ModuleName } from "@shared/permissions";
import { usePermissions } from "../../hooks/usePermissions";

interface PermissionGateProps {
  module: ModuleName;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ module, children, fallback = null }: PermissionGateProps) {
  const { canAccess } = usePermissions();

  if (!canAccess(module)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
