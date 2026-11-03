'use client';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import type { ImportBatch } from '../types';
import { ImportUploadForm } from './ImportUploadForm';

type ImportUploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onPreviewed: (batch: ImportBatch) => void;
};

export const ImportUploadDialog = ({ open, onClose, onPreviewed }: ImportUploadDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="import-upload-dialog-title">
    <DialogTitle
      id="import-upload-dialog-title"
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        m: 0,
        p: 2,
      }}
    >
      Unggah berkas
      <IconButton aria-label="Tutup dialog" size="small" onClick={onClose}>
        <CloseOutlinedIcon fontSize="small" />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ p: 2.5 }}>
      <ImportUploadForm
        inDialog
        onCancel={onClose}
        onPreviewed={(batch) => {
          onClose();
          onPreviewed(batch);
        }}
      />
    </DialogContent>
  </Dialog>
);
