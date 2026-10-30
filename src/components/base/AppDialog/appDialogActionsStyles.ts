import type { SxProps, Theme } from '@mui/material/styles';

export const appDialogActionsSx: SxProps<Theme> = {
  px: 3,
  py: 2,
};

export const appDialogCancelButtonSx: SxProps<Theme> = {
  color: 'text.secondary',
  fontWeight: 600,
};

export const appDialogOutlinedCancelButtonSx: SxProps<Theme> = {
  ...appDialogCancelButtonSx,
  borderColor: 'divider',
  '&:hover': {
    bgcolor: 'action.hover',
    borderColor: 'text.disabled',
  },
};

export const appDialogBackButtonSx: SxProps<Theme> = {
  fontWeight: 600,
};
