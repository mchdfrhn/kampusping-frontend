import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';

import { permissions } from '@/core/auth/permissions';
import { routes } from '@/core/config/route.config';
import type { MenuGroupConfig } from '@/core/types/menu.type';

/**
 * Sidebar navigation. Items with a `permission` are shown only to users who hold it; the page
 * and the API enforce the same permission independently.
 *
 * To add a module, add an entry here and a route under `src/app/(app)/`.
 */
export const menuConfig: MenuGroupConfig[] = [
  {
    items: [{ label: 'Dasbor', path: routes.dashboard, icon: DashboardOutlinedIcon }],
  },
  {
    title: 'Administrasi',
    items: [
      {
        label: 'Pengguna',
        path: routes.users,
        icon: GroupOutlinedIcon,
        permission: permissions.usersRead,
      },
      {
        label: 'Peran',
        path: routes.roles,
        icon: AdminPanelSettingsOutlinedIcon,
        permission: permissions.rolesRead,
      },
    ],
  },
];
