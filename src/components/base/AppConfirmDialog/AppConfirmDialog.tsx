'use client';

import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import {
  AppDialogBackButton,
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { appDialogActionsSx } from '@/components/base/AppDialog/appDialogActionsStyles';
import { invokeAsyncAction } from '@/core/utils/async-action.util';

export type AppConfirmDialogProps = Omit<DialogProps, 'children'> & {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'error' | 'primary' | 'success';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export const AppConfirmDialog = ({
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmColor,
  loading = false,
  onClose,
  onConfirm,
  maxWidth = 'xs',
  fullWidth = true,
  open,
  ...props
}: AppConfirmDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const resolvedConfirmColor = confirmColor ?? (/delete/i.test(confirmText) ? 'error' : 'primary');
  const isBackAction = cancelText.toLowerCase() === 'back';
  const isBusy = loading || submitting;

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isBusy) return;
    onClose?.(event, 'backdropClick');
  };

  const handleConfirm = async () => {
    if (isBusy) return;
    setSubmitting(true);
    try {
      await invokeAsyncAction(onConfirm, []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      {...props}
      open={open}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      onClose={isBusy ? undefined : onClose}
    >
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700, py: 1.5 }}>{title}</DialogTitle>
      <Divider />

      <DialogContent dividers sx={{ py: 2.5 }}>
        <Typography sx={{ color: 'text.primary', fontSize: 14 }}>{message}</Typography>
      </DialogContent>

      <Divider />
      <DialogActions sx={appDialogActionsSx}>
        {isBackAction ? (
          <AppDialogBackButton disabled={isBusy} label={cancelText} onClick={handleClose} />
        ) : (
          <AppDialogCancelButton disabled={isBusy} label={cancelText} onClick={handleClose} />
        )}
        <AppDialogConfirmButton
          color={resolvedConfirmColor}
          label={confirmText}
          loading={isBusy}
          onClick={() => void handleConfirm()}
        />
      </DialogActions>
    </Dialog>
  );
};
