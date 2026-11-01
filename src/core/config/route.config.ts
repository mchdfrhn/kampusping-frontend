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

/** Where signed-in users land when no `next` target is given. */
export const DEFAULT_AUTHENTICATED_ROUTE = routes.dashboard;
