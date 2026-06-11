import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { RESOURCE_STORAGE_KEY } from "./constants";
import type { Session } from "./types";

export const resources = [
  { key: "dashboard", icon: <DashboardIcon fontSize="small" /> },
  { key: "employees", icon: <BadgeIcon fontSize="small" /> },
  { key: "departments", icon: <BusinessIcon fontSize="small" /> },
  { key: "accounts", icon: <AccountCircleIcon fontSize="small" /> },
  { key: "roles", icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { key: "permissions", icon: <VpnKeyIcon fontSize="small" /> },
  { key: "settings", icon: <SettingsIcon fontSize="small" /> },
] as const;

export type ResourceKey = (typeof resources)[number]["key"];

export const resourceKeys = resources.map((resource) => resource.key);

export const resourceAuthorities: Record<ResourceKey, string[]> = {
  dashboard: [],
  employees: ["EMPLOYEE_VIEW", "ROLE_SYSTEM_ADMIN"],
  departments: ["DEPARTMENT_VIEW", "ROLE_SYSTEM_ADMIN"],
  accounts: ["ROLE_SYSTEM_ADMIN"],
  roles: ["ROLE_SYSTEM_ADMIN"],
  permissions: ["ROLE_SYSTEM_ADMIN"],
  settings: [],
};

export const resourceActionAuthorities: Partial<
  Record<ResourceKey, { create: string[]; edit: string[]; delete: string[] }>
> = {
  employees: {
    create: ["EMPLOYEE_CREATE", "ROLE_SYSTEM_ADMIN"],
    edit: ["EMPLOYEE_EDIT", "ROLE_SYSTEM_ADMIN"],
    delete: ["EMPLOYEE_DELETE", "ROLE_SYSTEM_ADMIN"],
  },
  departments: {
    create: ["DEPARTMENT_CREATE", "ROLE_SYSTEM_ADMIN"],
    edit: ["DEPARTMENT_EDIT", "ROLE_SYSTEM_ADMIN"],
    delete: ["DEPARTMENT_DELETE", "ROLE_SYSTEM_ADMIN"],
  },
  accounts: {
    create: ["ROLE_SYSTEM_ADMIN"],
    edit: ["ROLE_SYSTEM_ADMIN"],
    delete: ["ROLE_SYSTEM_ADMIN"],
  },
  roles: {
    create: ["ROLE_SYSTEM_ADMIN"],
    edit: ["ROLE_SYSTEM_ADMIN"],
    delete: ["ROLE_SYSTEM_ADMIN"],
  },
  permissions: {
    create: ["ROLE_SYSTEM_ADMIN"],
    edit: ["ROLE_SYSTEM_ADMIN"],
    delete: ["ROLE_SYSTEM_ADMIN"],
  },
};

export function getStoredResource() {
  const stored = localStorage.getItem(RESOURCE_STORAGE_KEY);
  return resourceKeys.includes(stored as (typeof resourceKeys)[number])
    ? stored!
    : "dashboard";
}

export function getResourceFromPath() {
  const pathResource = window.location.pathname.split("/").filter(Boolean)[0];
  return resourceKeys.includes(pathResource as (typeof resourceKeys)[number])
    ? pathResource!
    : undefined;
}

export function getInitialResource() {
  return getResourceFromPath() ?? getStoredResource();
}

export function resourcePath(resource: string) {
  return `/${resource}`;
}

export function canViewResource(resource: string, session: Session) {
  const requiredAuthorities = resourceAuthorities[resource as ResourceKey];
  if (!requiredAuthorities) return false;
  return (
    requiredAuthorities.length === 0 ||
    requiredAuthorities.some((authority) =>
      session.authorities.includes(authority),
    )
  );
}

export function hasAnyAuthority(session: Session, authorities: string[] = []) {
  return authorities.some((authority) =>
    session.authorities.includes(authority),
  );
}

export function canUseResourceAction(
  resource: string,
  action: "create" | "edit" | "delete",
  session: Session,
) {
  const actionAuthorities =
    resourceActionAuthorities[resource as ResourceKey]?.[action] ?? [];
  return hasAnyAuthority(session, actionAuthorities);
}

export function firstAllowedResource(session: Session) {
  return (
    resources.find((resource) => canViewResource(resource.key, session))?.key ??
    "settings"
  );
}

export function allowedResource(candidate: string | undefined, session: Session) {
  return candidate && canViewResource(candidate, session)
    ? candidate
    : firstAllowedResource(session);
}

export function navigate(path: string, replace = false) {
  if (window.location.pathname === path) return;
  if (replace) window.history.replaceState(null, "", path);
  else window.history.pushState(null, "", path);
}
