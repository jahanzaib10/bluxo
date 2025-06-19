export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function isTokenExpired(error: Error): boolean {
  return error.message.includes('token expired') || error.message.includes('jwt expired');
}

export function clearAuthToken() {
  localStorage.removeItem('authToken');
  // Also clear httpOnly cookie if using cookies
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string) {
  localStorage.setItem('authToken', token);
}

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function canAccessUserManagement(userRole: UserRole): boolean {
  return hasRequiredRole(userRole, [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]);
}

export function canAccessSettings(userRole: UserRole): boolean {
  return hasRequiredRole(userRole, [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER]);
}

export function isReadOnlyUser(userRole: UserRole): boolean {
  return userRole === USER_ROLES.VIEWER;
}