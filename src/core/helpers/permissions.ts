import { appConfig } from '@/core/config/app.config';
import { storageKeys } from '@/core/constants/storage.constant';

export type PermissionChecker = (permission: string) => boolean;

export type CurrentUserWithPermissions = {
  permission?: string[] | null;
  permissions?: string[] | null;
  rolesdivision?: unknown[];
  rolesDivision?: unknown[];
  roles_division?: unknown[];
  [key: string]: unknown;
} | null;

const normalizePermissionName = (value: string): string => value.trim().toLowerCase();

const extractPermissionName = (item: unknown): string | null => {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return null;

  const obj = item as Record<string, unknown>;

  if (typeof obj.name === 'string') return obj.name;
  if (typeof obj.permission === 'string') return obj.permission;
  if (typeof obj.code === 'string') return obj.code;
  if (typeof obj.slug === 'string') return obj.slug;
  if (typeof obj.permission_code === 'string') return obj.permission_code;

  const nestedPermission = obj.permission;
  if (nestedPermission && typeof nestedPermission === 'object') {
    const nestedName = extractPermissionName(nestedPermission);
    if (nestedName) return nestedName;
  }

  return null;
};

const collectRolesDivisionArrays = (user: CurrentUserWithPermissions): unknown[] => {
  if (!user) return [];

  const nestedUser = user.user as CurrentUserWithPermissions | undefined;
  const candidates = [
    user.rolesdivision,
    user.rolesDivision,
    user.roles_division,
    nestedUser?.rolesdivision,
    nestedUser?.rolesDivision,
    nestedUser?.roles_division,
  ];

  return candidates.filter((item): item is unknown[] => Array.isArray(item)).flat();
};

export const extractPermissionsFromRolesDivision = (user: CurrentUserWithPermissions): string[] => {
  const rolesDivisionItems = collectRolesDivisionArrays(user);
  const names: string[] = [];

  for (const division of rolesDivisionItems) {
    if (!division || typeof division !== 'object') continue;

    const roleHasPermissions = (
      (division as { rolehaspermissions?: unknown[]; roleHasPermissions?: unknown[] }).rolehaspermissions ??
      (division as { rolehaspermissions?: unknown[]; roleHasPermissions?: unknown[] }).roleHasPermissions ??
      []
    ) as unknown[];

    if (!Array.isArray(roleHasPermissions)) continue;

    for (const roleHasPermission of roleHasPermissions) {
      if (!roleHasPermission || typeof roleHasPermission !== 'object') continue;
      const rhp = roleHasPermission as Record<string, unknown>;
      const permissionNode = rhp.permission ?? rhp.Permission;
      if (permissionNode) {
        const name = extractPermissionName(permissionNode);
        if (name) names.push(name);
      }
    }
  }

  return names;
};

export const getCurrentUserFromStorage = (): CurrentUserWithPermissions => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(storageKeys.currentUser);
    if (!stored) return null;
    return JSON.parse(stored) as CurrentUserWithPermissions;
  } catch {
    return null;
  }
};

export const getPermissionList = (user: CurrentUserWithPermissions = getCurrentUserFromStorage()): string[] => {
  const rawCandidate =
    user?.permission ??
    user?.permissions ??
    (user as { user?: { permission?: unknown; permissions?: unknown } })?.user?.permission ??
    (user as { user?: { permission?: unknown; permissions?: unknown } })?.user?.permissions ??
    null;

  const raw = Array.isArray(rawCandidate) ? rawCandidate : [];
  const combined = [...raw, ...extractPermissionsFromRolesDivision(user)];
  const list = combined
    .map((item) => extractPermissionName(item))
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

  return Array.from(new Set(list.map(normalizePermissionName).filter(Boolean)));
};

export const permissionMatchesAppSlug = (permissionName: string): boolean => {
  const p = normalizePermissionName(permissionName);
  if (!p) return false;

  return appConfig.permissionPrefixes.some((slug) => {
    if (p === slug) return true;
    return p.startsWith(`${slug}_`) || p.startsWith(`${slug}-`);
  });
};

export const hasAnyAppAccess = (user?: CurrentUserWithPermissions): boolean => {
  const perms = getPermissionList(user ?? getCurrentUserFromStorage());
  if (!perms.length) return false;
  return perms.some(permissionMatchesAppSlug);
};

const buildPermissionCandidates = (permission: string): string[] => {
  const p = (permission || '').trim().toLowerCase();
  if (!p) return [];

  const trySplit = (value: string): { slug: string; action: string } | null => {
    const separators = ['-', '_', '.', ':', ' '];
    for (const sep of separators) {
      const idx = value.lastIndexOf(sep);
      if (idx > 0 && idx < value.length - 1) {
        return { slug: value.slice(0, idx), action: value.slice(idx + 1) };
      }
    }
    return null;
  };

  const split = trySplit(p);
  if (!split) return [p];
  const { slug, action } = split;
  const variants = new Set<string>([slug, slug.replace(/_/g, '-'), slug.replace(/-/g, '_')]);
  const out = new Set<string>();
  for (const s of variants) {
    for (const sep of ['-', '_']) {
      out.add(`${s}${sep}${action}`);
    }
  }
  return Array.from(out);
};

export const hasPermission = (code: string): boolean => {
  const perms = getPermissionList();
  const candidates = buildPermissionCandidates(code);
  return candidates.some((c) => perms.includes(c));
};

export const makeSlugPermissionChecker = (slug: string): PermissionChecker => {
  const prefix = `${slug}-`;
  return (action: string) => hasPermission(`${prefix}${action}`);
};

const getSlugForPath = (path: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKeys.menusMapping);
    if (!raw) return null;
    const mapping = JSON.parse(raw) as Record<string, string>;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return mapping[normalized] ?? mapping[normalized.replace(/\/+$/, '')] ?? null;
  } catch {
    return null;
  }
};

export const makeRoutePermissionChecker = (path: string): PermissionChecker => {
  return (action: string) => {
    const slug = getSlugForPath(path);
    if (!slug) return false;
    return hasPermission(`${slug}-${(action || '').trim().toLowerCase()}`);
  };
};

export const hasAnyMenuAccess = (): boolean => hasAnyAppAccess();
