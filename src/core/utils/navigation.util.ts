import type { AuthUser } from '@/core/auth/auth.type';
import { hasPermission } from '@/core/auth/permissions';
import { menuConfig } from '@/core/config/menu.config';
import { DEFAULT_AUTHENTICATED_ROUTE, routes } from '@/core/config/route.config';
import type { MenuGroupConfig } from '@/core/types/menu.type';

/**
 * Accept a post-login redirect target only when it is an in-app path. Anything else (absolute URLs,
 * protocol-relative `//host`, backslash tricks) falls back to the default, which prevents using the
 * `?next=` parameter as an open redirect.
 */
export const safeNextPath = (
  next: string | null | undefined,
  fallback: string = DEFAULT_AUTHENTICATED_ROUTE,
): string => {
  if (!next || !next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
};

/**
 * Keep only the menu items the user may open, and drop groups left empty. The sidebar uses this;
 * the pages and the API enforce the same permissions on their own.
 */
export const filterMenuByPermission = (
  menu: MenuGroupConfig[],
  user: Pick<AuthUser, 'permissions'> | null | undefined,
): MenuGroupConfig[] =>
  menu
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

/**
 * Where a signed-in user lands when no `next` target is given: the first sidebar entry they may
 * open, in menu order. The profile is open to everyone, so it is the last resort. Callers pass
 * the signed-in user; `DEFAULT_AUTHENTICATED_ROUTE` is only a generic default for `safeNextPath`.
 */
export const firstAccessibleRoute = (
  user: Pick<AuthUser, 'permissions'> | null | undefined,
  menu: MenuGroupConfig[] = menuConfig,
): string => filterMenuByPermission(menu, user)[0]?.items[0]?.path ?? routes.profile;
