import type { SvgIconComponent } from '@mui/icons-material';

export type MenuItemConfig = {
  label: string;
  path: string;
  slug?: string;
  icon?: SvgIconComponent;
  children?: MenuItemConfig[];
};
