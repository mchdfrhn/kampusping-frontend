import type { SxProps, Theme } from '@mui/material/styles';

export const appDialogActionsSx: SxProps<Theme> = {
  px: 3,
  py: 2,
};

export const appDialogCancelButtonSx: SxProps<Theme> = {
  color: 'text.secondary',
  fontWeight: 700,
};

export const appDialogOutlinedCancelButtonSx: SxProps<Theme> = {
  ...appDialogCancelButtonSx,
  borderColor: '#d0d5dd',
  color: '#667085',
  '&:hover': {
    bgcolor: '#f9fafb',
    borderColor: '#98a2b3',
  },
};

export const appDialogBackButtonSx: SxProps<Theme> = {
  fontWeight: 700,
};
