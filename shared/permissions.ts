// shared/permissions.ts
// Permission constants shared between client and server

export const MODULES = {
  DASHBOARD: "dashboard",
  FINANCE: "finance",
  PEOPLE: "people",
  CLIENTS: "clients",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
  INTEGRATIONS: "integrations",
  DATA_ROOM: "data_room",
  PAYROLL: "payroll",
  INVOICING: "invoicing",
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export const ACCESS_LEVELS = {
  FULL: "full",
  EXCLUSIVE: "exclusive",
} as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];

export const SYSTEM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  ACCOUNTANT: "accountant",
  HR_MANAGER: "hr_manager",
  MANAGER: "manager",
  VIEWER: "viewer",
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

// Default module access per system role
// true = full access, false = no access, "exclusive" = own data only
export const DEFAULT_ROLE_PERMISSIONS: Record<
  SystemRoleName,
  Record<ModuleName, boolean | "exclusive">
> = {
  owner: {
    dashboard: true,
    finance: true,
    people: true,
    clients: true,
    analytics: true,
    settings: true,
    integrations: true,
    data_room: true,
    payroll: true,
    invoicing: true,
  },
  admin: {
    dashboard: true,
    finance: true,
    people: true,
    clients: true,
    analytics: true,
    settings: true,
    integrations: true,
    data_room: true,
    payroll: true,
    invoicing: true,
  },
  accountant: {
    dashboard: true,
    finance: true,
    people: false,
    clients: "exclusive",
    analytics: true,
    settings: false,
    integrations: false,
    data_room: "exclusive",
    payroll: true,
    invoicing: true,
  },
  hr_manager: {
    dashboard: true,
    finance: false,
    people: true,
    clients: false,
    analytics: "exclusive",
    settings: false,
    integrations: false,
    data_room: true,
    payroll: true,
    invoicing: false,
  },
  manager: {
    dashboard: true,
    finance: "exclusive",
    people: "exclusive",
    clients: "exclusive",
    analytics: "exclusive",
    settings: false,
    integrations: false,
    data_room: "exclusive",
    payroll: false,
    invoicing: "exclusive",
  },
  viewer: {
    dashboard: true,
    finance: "exclusive",
    people: "exclusive",
    clients: "exclusive",
    analytics: "exclusive",
    settings: false,
    integrations: false,
    data_room: "exclusive",
    payroll: false,
    invoicing: false,
  },
};
