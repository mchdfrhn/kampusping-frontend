import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';

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
    items: [
      { label: 'Dashboard', path: routes.dashboard, icon: DashboardOutlinedIcon },
      {
        label: 'Example items',
        path: routes.example,
        icon: TableViewOutlinedIcon,
        permission: permissions.examplesRead,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        path: routes.users,
        icon: GroupOutlinedIcon,
        permission: permissions.usersRead,
      },
      {
        label: 'Roles',
        path: routes.roles,
        icon: AdminPanelSettingsOutlinedIcon,
        permission: permissions.rolesRead,
      },
    ],
  },
];
