import { DEFAULT_AUTHENTICATED_ROUTE } from '@/core/config/route.config';

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
