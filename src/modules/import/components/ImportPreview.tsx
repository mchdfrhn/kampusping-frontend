'use client';

import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GridColDef } from '@mui/x-data-grid';
import { useEffect, useRef, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';

import { IMPORT_SOURCE_LABELS } from '../constants';
import { importService } from '../services/import.service';
import type { ImportBatch, ImportRowError, ImportSummary } from '../types';

type ErrorRow = ImportRowError & { id: string };

const ERROR_SORT = { field: 'row_number', order: 'asc' } as const;

const ERROR_COLUMNS: GridColDef<ErrorRow>[] = [
  { field: 'row_number', headerName: 'Baris', width: 100, type: 'number', headerAlign: 'left' },
  { field: 'field', headerName: 'Kolom', width: 160 },
  { field: 'message', headerName: 'Masalah', minWidth: 240, flex: 1, sortable: false },
];

const COUNTS: { key: keyof ImportSummary; label: string }[] = [
  { key: 'rows_total', label: 'Baris dibaca' },
  { key: 'rows_valid', label: 'Baris valid' },
  { key: 'rows_error', label: 'Baris bermasalah' },
  { key: 'students_new', label: 'Mahasiswa baru' },
  { key: 'students_updated', label: 'Mahasiswa diperbarui' },
  { key: 'invoices_new', label: 'Tagihan baru' },
  { key: 'invoices_updated', label: 'Tagihan diperbarui' },
  { key: 'invoices_skipped', label: 'Tagihan dilewati' },
];

type Props = {
  batch: ImportBatch;
  /** Show Terapkan and Batalkan (needs `imports:create`). */
  canManage: boolean;
  onApply: (batch: ImportBatch) => Promise<void>;
  onDiscard: (batch: ImportBatch) => Promise<void>;
};

export const ImportPreview = ({ batch, canManage, onApply, onDiscard }: Props) => {
  const notify = useNotify();
  const rootRef = useRef<HTMLElement>(null);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // A ref, not only the disabled state: a second click can arrive before React re-renders.
  const applyInFlight = useRef(false);

  const grid = useServerGrid<ErrorRow, { batch_id: number }>({
    fetcher: async ({ batch_id, ...query }) => {
      const result = await importService.errors(batch_id, query);
      return {
        ...result,
        items: result.items.map((item, index) => ({ ...item, id: `${result.page}-${index}` })),
      };
    },
    defaultSort: ERROR_SORT,
    filters: { batch_id: batch.id },
    onError: notify.error,
  });

  useEffect(() => {
    rootRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [batch.id]);

  const isPreview = batch.status === 'preview';
  const canApply = isPreview && batch.summary.rows_valid > 0 && !applying;

  const handleApply = async () => {
    if (applyInFlight.current || !canApply) return;
    applyInFlight.current = true;
    setApplying(true);
    try {
      await onApply(batch);
    } finally {
      applyInFlight.current = false;
      setApplying(false);
    }
  };

  const handleDiscard = async () => {
    try {
      await onDiscard(batch);
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <Card component="section" aria-label="Pratinjau impor" ref={rootRef} sx={{ p: 2.5 }}>
      <Typography component="h2" variant="h6">
        Pratinjau impor
      </Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
        {batch.file_name} · {IMPORT_SOURCE_LABELS[batch.source]}
        {batch.semester ? ` · Semester ${batch.semester}` : ''} ·{' '}
        {formatDisplayDateTime(batch.created_at)}
      </Typography>

      <Box
        component="dl"
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          m: 0,
          mb: 2,
        }}
      >
        {COUNTS.map(({ key, label }) => (
          <Box key={key}>
            <Typography component="dt" color="text.secondary" variant="body2">
              {label}
            </Typography>
            <Typography component="dd" variant="h5" sx={{ m: 0 }}>
              {batch.summary[key]}
            </Typography>
          </Box>
        ))}
      </Box>

      {isPreview ? (
        <Alert role="note" severity="info" sx={{ mb: 2 }}>
          Belum ada data yang disimpan. Periksa ringkasan dan baris bermasalah di bawah, lalu pilih
          Terapkan untuk menyimpan atau Batalkan untuk membuang pratinjau ini. Hanya baris valid
          yang diterapkan. Tagihan dengan kode sama akan diperbarui, dan tagihan lama belum lunas
          milik mahasiswa yang menerima tagihan baru akan otomatis ditandai lunas.
        </Alert>
      ) : null}
      {isPreview && batch.summary.rows_valid === 0 ? (
        <Alert role="note" severity="warning" sx={{ mb: 2 }}>
          Tidak ada baris valid, jadi impor ini tidak dapat diterapkan. Perbaiki berkas lalu unggah
          ulang.
        </Alert>
      ) : null}

      <Typography component="h3" variant="subtitle1" sx={{ mb: 1 }}>
        Rincian masalah pada berkas
      </Typography>
      <Box sx={{ height: 340, mb: 2 }}>
        <AppDataGrid
          columns={ERROR_COLUMNS}
          fillWidth
          getRowId={(row: ErrorRow) => row.id}
          pageSizeOptions={[20, 50, 100]}
          {...grid.gridProps}
        />
      </Box>

      {canManage ? (
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button
            color="inherit"
            variant="outlined"
            disabled={!isPreview || applying}
            sx={{ borderColor: 'divider' }}
            onClick={() => setConfirmOpen(true)}
          >
            Batalkan
          </Button>
          <Button
            variant="contained"
            disabled={!canApply}
            startIcon={
              applying ? <CircularProgress color="inherit" size={16} /> : <CheckOutlinedIcon />
            }
            onClick={() => void handleApply()}
          >
            Terapkan
          </Button>
        </Stack>
      ) : null}

      <AppConfirmDialog
        open={confirmOpen}
        title="Batalkan impor"
        message="Batalkan pratinjau ini? Tidak ada data yang disimpan dan berkas perlu diunggah ulang bila ingin mengimpor lagi."
        confirmText="Ya, batalkan"
        cancelText="Kembali"
        onConfirm={handleDiscard}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
};
