'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

import { confirmNoAccessAndRedirectToMasterApp } from '@/core/auth/auth.service';

type Props = {
  open: boolean;
};

export const NoAccessDialog = ({ open }: Props) => (
  <Dialog
    open={open}
    onClose={() => undefined}
    maxWidth="xs"
    fullWidth
    slotProps={{
      backdrop: {
        sx: { bgcolor: 'rgba(0, 0, 0, 0.5)' },
      },
      paper: {
        sx: { borderRadius: 2 },
      },
    }}
  >
    <DialogTitle sx={{ fontSize: 18, fontWeight: 700, pb: 1 }}>Tidak Ada Akses</DialogTitle>
    <DialogContent dividers>
      <Typography sx={{ m: 0 }}>
        Anda belum memiliki akses ke aplikasi ini. Anda akan kembali ke aplikasi utama.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 2.5, py: 1.5 }}>
      <Button variant="contained" onClick={confirmNoAccessAndRedirectToMasterApp}>
        OK
      </Button>
    </DialogActions>
  </Dialog>
);
