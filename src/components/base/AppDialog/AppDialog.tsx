'use client';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';

import { appDialogContentFormSx } from './appDialogFormStyles';

export type AppDialogProps = Omit<DialogProps, 'title'> & {
  title?: ReactNode;
  actions?: ReactNode;
  showCloseButton?: boolean;
  contentDividers?: boolean;
};

export const AppDialog = ({
  title,
  actions,
  showCloseButton = true,
  contentDividers = true,
  children,
  onClose,
  ...props
}: AppDialogProps) => (
  <Dialog {...props} onClose={onClose}>
    {(title != null || showCloseButton) && (
      <DialogTitle sx={{ fontSize: 16, pr: showCloseButton ? 6 : undefined, py: 1.5 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>{title}</span>
        </Stack>
        {showCloseButton ? (
          <IconButton
            aria-label="Close"
            onClick={(event) => onClose?.(event, 'backdropClick')}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseOutlinedIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
    )}

    <DialogContent
      dividers={contentDividers}
      sx={{
        ...appDialogContentFormSx,
      }}
    >
      {children}
    </DialogContent>

    {actions != null ? <DialogActions sx={{ px: 2.5, py: 1.5 }}>{actions}</DialogActions> : null}
  </Dialog>
);
