import type { SxProps, Theme } from '@mui/material/styles';

import { mixToken } from '@/design-system/tokens/surface.token';

/** Tinted square icon buttons for the sticky action column. Colors follow the active theme. */
const tinted = (token: 'primary' | 'success' | 'error' | 'warning' | 'info'): SxProps<Theme> => ({
  bgcolor: mixToken(`${token}-main`, 12),
  borderRadius: 2,
  color: `${token}.main`,
  '&:hover': { bgcolor: mixToken(`${token}-main`, 20) },
  '&.Mui-disabled': {
    bgcolor: 'action.disabledBackground',
    color: 'action.disabled',
  },
});

export const gridActionButtonSx = {
  view: tinted('info'),
  edit: tinted('primary'),
  download: tinted('primary'),
  approve: tinted('success'),
  reject: tinted('warning'),
  delete: tinted('error'),
} as const;
