import type { AuthUser } from './auth.type';

/**
 * Permission codes, mirrored from the backend (`app/core/permissions.py`), which is the source of
 * truth. Hiding a control with these is a convenience; the API enforces every permission.
 */
export const permissions = {
  usersRead: 'users:read',
  usersCreate: 'users:create',
  usersUpdate: 'users:update',
  usersDelete: 'users:delete',
  rolesRead: 'roles:read',
  rolesCreate: 'roles:create',
  rolesUpdate: 'roles:update',
  rolesDelete: 'roles:delete',
  examplesRead: 'examples:read',
  examplesCreate: 'examples:create',
  examplesUpdate: 'examples:update',
  examplesDelete: 'examples:delete',
} as const;

export type PermissionCode = (typeof permissions)[keyof typeof permissions];

/** True when the user holds every one of the given permissions. */
export const hasPermission = (
  user: Pick<AuthUser, 'permissions'> | null | undefined,
  ...required: string[]
): boolean => {
  if (!user) return false;
  const granted = new Set(user.permissions);
  return required.every((code) => granted.has(code));
};

/** True when the user holds at least one of the given permissions. */
export const hasAnyPermission = (
  user: Pick<AuthUser, 'permissions'> | null | undefined,
  ...candidates: string[]
): boolean => candidates.some((code) => hasPermission(user, code));
