'use client';

import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';

import { IMPORT_SOURCE_LABELS } from '../constants';
import { importService } from '../services/import.service';
import type { ImportBatch, ImportSummary } from '../types';
import { ImportDetailsPanel } from './ImportDetailsPanel';

type CountTone = 'default' | 'success' | 'error' | 'warning' | 'info';

const COUNTS: {
  key: keyof ImportSummary;
  label: string;
  rekapOnly?: boolean;
  tone?: CountTone;
}[] = [
  { key: 'rows_total', label: 'Baris dibaca', tone: 'default' },
  { key: 'rows_valid', label: 'Baris valid', tone: 'success' },
  { key: 'rows_error', label: 'Baris bermasalah', tone: 'error' },
  { key: 'students_new', label: 'Mahasiswa baru', tone: 'info' },
  { key: 'students_updated', label: 'Mahasiswa diperbarui', tone: 'info' },
  { key: 'invoices_new', label: 'Tagihan baru', tone: 'success' },
  { key: 'invoices_updated', label: 'Tagihan diperbarui', tone: 'info' },
  { key: 'invoices_unchanged', label: 'Tagihan tidak berubah', tone: 'default' },
  { key: 'invoices_skipped', label: 'Tagihan dilewati', tone: 'default' },
  { key: 'paid_suspected', label: 'Diduga lunas', rekapOnly: true, tone: 'warning' },
];

const getStatCardStyles = (tone: CountTone = 'default', value: number) => {
  const activeTone: CountTone = value === 0 && tone !== 'default' ? 'default' : tone;
  const borderAccent: Record<CountTone, string> = {
    default: 'divider',
    success: 'success.main',
    error: 'error.main',
    warning: 'warning.main',
    info: 'primary.main',
  };
  const valueColor: Record<CountTone, string> = {
    default: 'text.primary',
    success: 'success.main',
    error: 'error.main',
    warning: 'warning.main',
    info: 'primary.main',
  };
  return {
    cardSx: {
      bgcolor: activeTone === 'default' ? 'background.default' : 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderLeft: '4px solid',
      borderLeftColor: borderAccent[activeTone],
      borderRadius: 2,
      px: 1.75,
      py: 1.25,
    },
    valueColor: valueColor[activeTone],
  };
};

type Props = {
  batch: ImportBatch;
  /** Show Terapkan and Batalkan (needs `imports:create`). */
  canManage: boolean;
  /** `markPaidInvoiceIds` is only given for a rekap batch: the suspected-paid invoices approved. */
  onApply: (batch: ImportBatch, markPaidInvoiceIds?: number[]) => Promise<void>;
  onDiscard: (batch: ImportBatch) => Promise<void>;
};

export const ImportPreview = ({ batch, canManage, onApply, onDiscard }: Props) => {
  const notify = useNotify();
  const rootRef = useRef<HTMLElement>(null);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  // A ref, not only the disabled state: a second click can arrive before React re-renders.
  const applyInFlight = useRef(false);

  useEffect(() => {
    rootRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [batch.id]);

  const isPreview = batch.status === 'preview';
  const isRekap = batch.kind === 'rekap';
  const suspectedCount = batch.summary.paid_suspected ?? 0;
  const incomplete = batch.summary.incomplete_warning === 1;
  const needsSelection = isPreview && isRekap && suspectedCount > 0;

  // Suspected-paid invoices staff approve; the ids of every page come from one call so "Pilih
  // semua" and the default selection do not depend on which page is loaded.
  const [allIds, setAllIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [idsReady, setIdsReady] = useState(!needsSelection);

  useEffect(() => {
    if (!needsSelection) return;
    let cancelled = false;
    importService
      .detailIds(batch.id)
      .then(({ ids }) => {
        if (cancelled) return;
        setAllIds(ids);
        // An export that looks partial starts with nothing selected: staff opt in deliberately.
        setSelectedIds(incomplete ? new Set() : new Set(ids));
        setIdsReady(true);
      })
      .catch((error) => {
        if (!cancelled) notify.error(getErrorMessage(error, 'Gagal memuat daftar tagihan.'));
      });
    return () => {
      cancelled = true;
    };
  }, [batch.id, incomplete, needsSelection, notify]);

  const canApply = isPreview && batch.summary.rows_valid > 0 && idsReady && !applying;
  const markPaidCount = isRekap ? selectedIds.size : 0;

  const handleApply = async () => {
    if (applyInFlight.current || !canApply) return;
    applyInFlight.current = true;
    setApplying(true);
    try {
      await onApply(batch, isRekap ? [...selectedIds] : undefined);
    } finally {
      applyInFlight.current = false;
      setApplying(false);
    }
  };

  const handleApplyClick = () => {
    if (markPaidCount > 0) setApplyConfirmOpen(true);
    else void handleApply();
  };

  const handleDiscard = async () => {
    try {
      await onDiscard(batch);
    } finally {
      setConfirmOpen(false);
    }
  };

  // flexShrink 0: a Card clips its content (overflow hidden), so as a flex item it would shrink to
  // the viewport and hide the action buttons instead of letting the page scroll.
  return (
    <Card
      component="section"
      aria-label="Pratinjau impor"
      ref={rootRef}
      sx={{ p: 2.5, flexShrink: 0 }}
    >
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
          gap: 1.5,
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
          m: 0,
          mb: 2.5,
        }}
      >
        {COUNTS.filter(
          ({ key, rekapOnly }) => batch.summary[key] !== undefined && (!rekapOnly || isRekap),
        ).map(({ key, label, tone }) => {
          const val = Number(batch.summary[key] ?? 0);
          const { cardSx, valueColor } = getStatCardStyles(tone, val);
          return (
            <Box key={key} sx={cardSx}>
              <Typography
                component="dt"
                color="text.secondary"
                variant="caption"
                sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}
              >
                {label}
              </Typography>
              <Typography
                component="dd"
                variant="h5"
                color={valueColor}
                sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', m: 0 }}
              >
                {batch.summary[key]}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {isPreview ? (
        <Alert role="note" severity="info" sx={{ mb: 2 }}>
          {isRekap
            ? 'Belum ada data yang disimpan. Tagihan yang hilang dari berkas ditampilkan sebagai Diduga lunas dan hanya ditandai lunas bila dipilih. Tunggakan semester yang tidak ada di berkas tidak diubah, dan tagihan baru tidak melunasi tagihan lama.'
            : 'Belum ada data yang disimpan. Periksa ringkasan dan baris bermasalah di bawah, lalu pilih Terapkan untuk menyimpan atau Batalkan untuk membuang pratinjau ini. Hanya baris valid yang diterapkan. Tagihan dengan kode sama akan diperbarui, dan tagihan lama belum lunas milik mahasiswa yang menerima tagihan baru akan otomatis ditandai lunas.'}
        </Alert>
      ) : null}
      {isPreview && incomplete ? (
        <Alert role="alert" severity="warning" sx={{ mb: 2 }}>
          Lebih dari 30% tagihan semester ini hilang dari berkas. Kemungkinan ekspor tidak lengkap.
          Tidak ada yang dipilih; periksa daftar sebelum menandai lunas.
        </Alert>
      ) : null}
      {isPreview && batch.summary.rows_valid === 0 ? (
        <Alert role="note" severity="warning" sx={{ mb: 2 }}>
          Tidak ada baris valid, jadi impor ini tidak dapat diterapkan. Perbaiki berkas lalu unggah
          ulang.
        </Alert>
      ) : null}

      <ImportDetailsPanel
        batch={batch}
        selectedIds={selectedIds}
        allIds={allIds}
        disabled={!isPreview || applying}
        onSelectedChange={setSelectedIds}
      />

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
            onClick={handleApplyClick}
          >
            Terapkan
          </Button>
        </Stack>
      ) : null}

      <AppConfirmDialog
        open={applyConfirmOpen}
        title="Terapkan impor"
        message={`${markPaidCount} tagihan akan ditandai lunas dan pengingatnya dihentikan. Tagihan lain yang diduga lunas tetap belum lunas.`}
        confirmText="Terapkan"
        cancelText="Kembali"
        onConfirm={async () => {
          setApplyConfirmOpen(false);
          await handleApply();
        }}
        onClose={() => setApplyConfirmOpen(false)}
      />

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
