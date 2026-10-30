const PREFIX = 'webapp';

/**
 * Per-browser UI conveniences only. Never put tokens or other secrets here: the access token
 * lives in memory and the refresh token in an HttpOnly cookie.
 */
export const storageKeys = {
  sidebarCollapsed: `${PREFIX}:sidebar-collapsed`,
} as const;
