import type { AuthUser } from '@/core/auth/auth.service';
import { appConfig } from '@/core/config/app.config';

const toInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const extractRolesDivisionRoleIds = (user?: AuthUser | null): number[] => {
  if (!user) return [];

  const nestedUser = user.user as AuthUser | undefined;
  const candidates = [user.rolesdivision, user.rolesDivision, user.roles_division, nestedUser?.rolesdivision]
    .filter((item): item is unknown[] => Array.isArray(item))
    .flat();

  const roleIds: number[] = [];
  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const roleId = toInt(row.role_id ?? row.roleId ?? (row.role as { id?: unknown } | undefined)?.id ?? row.id);
    if (roleId) roleIds.push(roleId);
  }

  return Array.from(new Set(roleIds)).sort((a, b) => a - b);
};

export const hasDeveloperRole = (user?: AuthUser | null): boolean =>
  extractRolesDivisionRoleIds(user).includes(appConfig.groupAdminRoleId);

export const hasGroupAdminRole = (user?: AuthUser | null): boolean => hasDeveloperRole(user);
