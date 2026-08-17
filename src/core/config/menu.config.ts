import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';

import { routes } from '@/core/config/route.config';
import type { MenuItemConfig } from '@/core/types/menu.type';

export const menuIconMap = {
  DashboardOutlinedIcon,
  TableViewOutlinedIcon,
  SettingsOutlinedIcon,
  AdminPanelSettingsOutlinedIcon,
} as const;

export type MenuIconName = keyof typeof menuIconMap;

export const getMenuIconByName = (iconName?: string | null) => {
  if (!iconName) return undefined;
  return menuIconMap[iconName as MenuIconName];
};

/**
 * Fallback menu when IAM launcher menus are not available (local development).
 * Replace labels/paths/slugs with the project module when cloning this starter.
 */
export const menuConfig: MenuItemConfig[] = [
  { label: 'Dashboard', path: routes.dashboard, icon: DashboardOutlinedIcon },
  {
    label: 'Example Master',
    path: routes.example,
    slug: 'example',
    icon: TableViewOutlinedIcon,
  },
];

export const groupSettingsMenuConfig: MenuItemConfig[] = [
  {
    label: 'Menu Mapping',
    path: routes.settings.menuMapping,
    icon: SettingsOutlinedIcon,
  },
  {
    label: 'Role Access',
    path: routes.settings.appRoles,
    icon: AdminPanelSettingsOutlinedIcon,
  },
];

export const getStaticMenuSlugMapping = (): Record<string, string> => {
  const mapping: Record<string, string> = {};
  for (const item of menuConfig) {
    if (item.slug) mapping[item.path] = item.slug;
  }
  return mapping;
};
