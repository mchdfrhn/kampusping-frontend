export const routes = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  example: '/example',
  users: '/users',
  roles: '/roles',
  profile: '/profile',
} as const;

/** Where signed-in users land when no `next` target is given. */
export const DEFAULT_AUTHENTICATED_ROUTE = routes.dashboard;
