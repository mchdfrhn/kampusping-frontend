export const routes = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  import: '/import',
  students: '/students',
  invoices: '/invoices',
  templates: '/templates',
  schedules: '/schedules',
  messages: '/messages',
  settings: '/settings',
  audit: '/audit',
  users: '/users',
  roles: '/roles',
  profile: '/profile',
} as const;

/**
 * Generic fallback for `safeNextPath`. The dashboard needs `dashboard:read`, so real landings use
 * `firstAccessibleRoute(user)` instead.
 */
export const DEFAULT_AUTHENTICATED_ROUTE = routes.dashboard;
