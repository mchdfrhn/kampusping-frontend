'use client';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { appDialogActionsSx } from '@/components/base/AppDialog/appDialogActionsStyles';
import { ApiError, getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';

import { importService } from '../services/import.service';
import type { ImportBatch, RollbackConflict, RollbackPreview } from '../types';

/** Indonesian names for the field identifiers the API reports in a conflict (names only). */
const FIELD_LABELS: Record<string, string> = {
  name: 'Nama',
  study_program: 'Program studi',
  cohort: 'Angkatan',
  phone: 'Nomor HP',
  phone_status: 'Status nomor HP',
  semester: 'Semester',
  amount: 'Nominal',
  due_date: 'Jatuh tempo',
  status: 'Status',
  paid_at: 'Tanggal bayar',
  paid_via: 'Kanal bayar',
  source: 'Sumber',
  deleted_at: 'Status hapus',
  deleted_by: 'Status hapus',
  missing: 'Data tidak ditemukan',
};

const describeFields = (fields: string[]) =>
  [...new Set(fields.map((field) => FIELD_LABELS[field] ?? field))].join(', ');

const describeConflict = (conflict: RollbackConflict) =>
  `${conflict.entity === 'invoice' ? 'Tagihan' : 'Mahasiswa'} ${conflict.label}: ${describeFields(conflict.fields)}`;

type Props = {
  /** The applied import to roll back; `null` keeps the dialog closed. */
  batch: ImportBatch | null;
  onClose: () => void;
  /** Called after the import was rolled back, or found to be no longer eligible (409). */
  onChanged: () => void;
};

export const ImportRollbackDialog = ({ batch, onClose, onChanged }: Props) => {
  const notify = useNotify();
  // Kept with the batch it belongs to, so a preview left over from another batch never shows.
  const [loaded, setLoaded] = useState<{ batchId: number; data: RollbackPreview } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const batchId = batch?.id;
  const preview = loaded && loaded.batchId === batchId ? loaded.data : null;

  useEffect(() => {
    if (batchId === undefined) return;
    let cancelled = false;
    importService
      .rollbackPreview(batchId)
      .then((result) => {
        if (!cancelled) setLoaded({ batchId, data: result });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        notify.error(getErrorMessage(error, 'Gagal memuat dampak pembatalan impor.'));
        onClose();
        onChanged();
      });
    return () => {
      cancelled = true;
    };
  }, [batchId, notify, onClose, onChanged]);

  const handleConfirm = async () => {
    if (!batch || submitting) return;
    setSubmitting(true);
    try {
      await importService.rollback(batch.id);
      notify.success('Impor dikembalikan.');
      onClose();
      onChanged();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal membatalkan impor.'));
      // 409: no longer the latest import, or the data changed; the history is stale either way.
      if (error instanceof ApiError && error.status === 409) {
        onClose();
        onChanged();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const blocked = !preview || preview.conflicts_total > 0;
  const hiddenConflicts = preview ? preview.conflicts_total - preview.conflicts.length : 0;

  return (
    <Dialog
      open={batch !== null}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="import-rollback-dialog-title"
    >
      <DialogTitle
        id="import-rollback-dialog-title"
        sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', p: 2 }}
      >
        Batalkan impor
        <IconButton aria-label="Tutup dialog" size="small" disabled={submitting} onClick={onClose}>
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2.5 }}>
        <Typography sx={{ mb: 1.5 }} variant="body2">
          Data dari impor <strong>{batch?.file_name}</strong> akan dikembalikan seperti sebelum
          impor diterapkan.
        </Typography>
        {!preview ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress aria-label="Memuat dampak pembatalan" size={28} />
          </Box>
        ) : (
          <>
            <Box component="ul" sx={{ m: 0, mb: 1.5, pl: 2.5 }}>
              <li>{preview.students_deleted} mahasiswa baru dihapus</li>
              <li>{preview.invoices_deleted} tagihan baru dihapus</li>
              <li>{preview.students_reverted} mahasiswa dikembalikan ke data sebelumnya</li>
              <li>{preview.invoices_reverted} tagihan dikembalikan ke data sebelumnya</li>
              <li>{preview.queued_messages_cancelled} pesan antre dibatalkan</li>
            </Box>
            <Typography color="text.secondary" variant="body2">
              {preview.sent_messages > 0
                ? `${preview.sent_messages} pesan sudah terkirim untuk tagihan yang akan dihapus. `
                : ''}
              Pesan WhatsApp yang sudah terkirim tidak dapat ditarik kembali.
            </Typography>
            {preview.conflicts_total > 0 ? (
              <Box role="alert" sx={{ mt: 2 }}>
                <Typography color="error" sx={{ fontWeight: 600 }} variant="body2">
                  Impor tidak dapat dibatalkan karena data berubah sejak diterapkan:
                </Typography>
                <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                  {preview.conflicts.map((conflict) => (
                    <li key={`${conflict.entity}-${conflict.label}`}>
                      {describeConflict(conflict)}
                    </li>
                  ))}
                </Box>
                {hiddenConflicts > 0 ? (
                  <Typography variant="body2">dan {hiddenConflicts} lainnya</Typography>
                ) : null}
              </Box>
            ) : null}
          </>
        )}
      </DialogContent>
      <DialogActions sx={appDialogActionsSx}>
        <AppDialogCancelButton disabled={submitting} label="Kembali" onClick={onClose} />
        <AppDialogConfirmButton
          color="error"
          disabled={blocked}
          label="Batalkan impor"
          loading={submitting}
          onClick={() => void handleConfirm()}
        />
      </DialogActions>
    </Dialog>
  );
};
