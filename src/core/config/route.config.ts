export const routes = {
  home: '/',
  dashboard: '/dashboard',
  example: '/example',
  notifications: '/notifications',
  settings: {
    appRoles: '/settings/app-roles',
    menuMapping: '/settings/menu-mapping',
  },
  auth: {
    login: '/auth/login',
  },
} as const;
