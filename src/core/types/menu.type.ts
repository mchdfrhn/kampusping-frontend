import type { SvgIconComponent } from '@mui/icons-material';

export type MenuItemConfig = {
  label: string;
  path: string;
  icon: SvgIconComponent;
  /** Permission code required to see this item. Omit for items every signed-in user can see. */
  permission?: string;
};

export type MenuGroupConfig = {
  /** Optional heading shown above the group. */
  title?: string;
  items: MenuItemConfig[];
};
