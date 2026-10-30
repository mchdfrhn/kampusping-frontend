'use client';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { MouseEvent } from 'react';

import {
  appDialogBackButtonSx,
  appDialogCancelButtonSx,
  appDialogOutlinedCancelButtonSx,
} from '@/components/base/AppDialog/appDialogActionsStyles';

type BackButtonProps = {
  disabled?: boolean;
  label?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

export const AppDialogBackButton = ({
  disabled = false,
  label = 'Back',
  onClick,
}: BackButtonProps) => (
  <Button
    color="inherit"
    disabled={disabled}
    onClick={onClick}
    startIcon={<ArrowBackOutlinedIcon />}
    sx={appDialogBackButtonSx}
    variant="outlined"
  >
    {label}
  </Button>
);

type CancelButtonProps = {
  color?: 'error' | 'inherit';
  disabled?: boolean;
  label?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'outlined' | 'text';
};

export const AppDialogCancelButton = ({
  color = 'inherit',
  disabled = false,
  label = 'Cancel',
  onClick,
  variant = 'text',
}: CancelButtonProps) => (
  <Button
    color={color}
    disabled={disabled}
    onClick={onClick}
    startIcon={<CloseOutlinedIcon />}
    sx={
      color === 'error'
        ? { fontWeight: 600 }
        : variant === 'outlined'
          ? appDialogOutlinedCancelButtonSx
          : appDialogCancelButtonSx
    }
    variant={variant}
  >
    {label}
  </Button>
);

type ConfirmButtonProps = {
  color?: 'error' | 'primary' | 'success';
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  onClick: () => void;
  showCheckIcon?: boolean;
  showRejectIcon?: boolean;
};

export const AppDialogConfirmButton = ({
  color = 'primary',
  disabled = false,
  label = 'Confirm',
  loading = false,
  onClick,
  showCheckIcon = false,
  showRejectIcon = false,
}: ConfirmButtonProps) => (
  <Button
    color={color}
    disabled={disabled || loading}
    onClick={onClick}
    startIcon={
      loading ? (
        <CircularProgress color="inherit" size={16} />
      ) : showRejectIcon ? (
        <CancelOutlinedIcon />
      ) : showCheckIcon ? (
        <CheckOutlinedIcon />
      ) : undefined
    }
    sx={{ fontWeight: 600 }}
    variant="contained"
  >
    {label}
  </Button>
);
