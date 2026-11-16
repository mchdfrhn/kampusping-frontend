'use client';

import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { GridColDef } from '@mui/x-data-grid';
import type { Dayjs } from 'dayjs';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppDatePicker } from '@/components/base/AppDatePicker';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { DATE_API_FORMAT, formatDisplayDate, formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';
import { whatsappStateLabel } from '@/modules/dashboard/dashboard.utils';
import { describePausedReason, formatWorkerOfflineMessage } from '@/modules/settings/paused-reason';
import { settingsService } from '@/modules/settings/services/settings.service';
import { whatsappService } from '@/modules/settings/services/whatsapp.service';
import type { SettingsRecord, WhatsAppState } from '@/modules/settings/types';

import {
  CANCEL_REASON_LABELS,
  CANCELLABLE_STATUS,
  MESSAGE_STATUS_LABELS,
  MESSAGE_STATUS_OPTIONS,
  MESSAGE_STATUS_TONES,
} from '../constants';
import { messagesService } from '../services/messages.service';
import type { MessageFilters, MessageRecord, MessageStatus } from '../types';
import { MessageBodyDialog } from './MessageBodyDialog';

const DEFAULT_SORT = { field: 'queued_at', order: 'desc' } as const;

const DELETABLE_STATUSES = new Set<MessageStatus>(['queued', 'sending', 'failed', 'cancelled']);

/** A half-typed date is an invalid Dayjs; it must not reach the API. */
const toApiDate = (value: Dayjs | null): string | undefined =>
  value?.isValid() ? value.format(DATE_API_FORMAT) : undefined;

const dateTimeColumn = (
  field: 'queued_at' | 'sent_at' | 'delivered_at' | 'read_at',
  headerName: string,
  sortable: boolean,
): GridColDef<MessageRecord> => ({
  field,
  headerName,
  minWidth: 130,
  flex: 0.7,
  sortable,
  valueFormatter: (value) => formatDisplayDateTime(value ? String(value) : null),
});

export const MessagesListPage = () => {
  const notify = useNotify();
  const canCancel = usePermission(permissions.messagesCancel);
  const canSend = usePermission(permissions.messagesSend);
  const canReadSettings = usePermission(permissions.settingsRead);

  const [status, setStatus] = useState<MessageStatus | ''>('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [viewing, setViewing] = useState<MessageRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MessageRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MessageRecord | null>(null);
  const [sendSettings, setSendSettings] = useState<SettingsRecord | null>(null);
  const [whatsappState, setWhatsappState] = useState<WhatsAppState | null>(null);

  const loadDeliveryStatus = useCallback(
    (signal?: AbortSignal) => {
      if (!canReadSettings) return;
      settingsService
        .get()
        .then((loaded) => {
          if (!signal?.aborted) setSendSettings(loaded);
        })
        .catch(() => {});
      whatsappService
        .status(signal)
        .then((wa) => {
          if (!signal?.aborted) setWhatsappState(wa.state);
        })
        .catch(() => {});
    },
    [canReadSettings],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadDeliveryStatus(controller.signal);
    return () => controller.abort();
  }, [loadDeliveryStatus]);

  const dateFromParam = toApiDate(dateFrom);
  const dateToParam = toApiDate(dateTo);
  const filters = useMemo<MessageFilters>(
    () => ({ status: status || undefined, date_from: dateFromParam, date_to: dateToParam }),
    [status, dateFromParam, dateToParam],
  );

  const grid = useServerGrid<MessageRecord, MessageFilters>({
    fetcher: messagesService.list,
    defaultSort: DEFAULT_SORT,
    filters,
    onError: notify.error,
  });

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await messagesService.cancel(cancelTarget.id);
      notify.success('Pesan dibatalkan.');
    } catch (error) {
      // 404 (gone) or 409 (already claimed by the worker): show the server's reason.
      notify.error(getErrorMessage(error, 'Gagal membatalkan pesan.'));
    } finally {
      setCancelTarget(null);
      await grid.reload(); // the row on screen may be stale either way
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await messagesService.delete(deleteTarget.id);
      notify.success('Pesan dihapus.');
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal menghapus pesan.'));
    } finally {
      setDeleteTarget(null);
      await grid.reload();
    }
  };

  const columns = useMemo<GridColDef<MessageRecord>[]>(
    () => [
      dateTimeColumn('queued_at', 'Waktu antre', true),
      {
        field: 'student',
        headerName: 'Penerima',
        minWidth: 170,
        flex: 1.1,
        sortable: false,
        valueGetter: (_value, row) => `${row.student.name} ${row.student.nim}`,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.3, minWidth: 0 }}>
            <Typography noWrap variant="body2">
              {row.student.name}{' '}
              <Typography color="text.secondary" component="span" variant="caption">
                {row.student.nim}
              </Typography>
            </Typography>
            <Typography color="text.secondary" noWrap variant="caption">
              {row.phone_masked ?? '-'}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'invoice_id',
        headerName: 'Tagihan',
        minWidth: 85,
        flex: 0.4,
        sortable: false,
        valueFormatter: (value) => `#${value}`,
      },
      {
        field: 'scheduled_date',
        headerName: 'Jadwal',
        minWidth: 105,
        flex: 0.5,
        valueFormatter: (value) => formatDisplayDate(value ? String(value) : null),
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 105,
        flex: 0.5,
        renderCell: ({ row }) => (
          <AppStatusChip
            status={MESSAGE_STATUS_TONES[row.status]}
            label={MESSAGE_STATUS_LABELS[row.status]}
          />
        ),
      },
      {
        field: 'cancel_reason',
        headerName: 'Alasan',
        minWidth: 150,
        flex: 0.8,
        sortable: false,
        renderCell: ({ row }) => {
          const reason = row.cancel_reason
            ? (CANCEL_REASON_LABELS[row.cancel_reason] ?? row.cancel_reason)
            : null;
          const text = reason ?? row.error ?? '-';
          return row.error ? (
            <Tooltip title={row.error}>
              <Typography noWrap variant="body2">
                {text}
              </Typography>
            </Tooltip>
          ) : (
            <Typography noWrap variant="body2">
              {text}
            </Typography>
          );
        },
      },
      {
        field: 'attempts',
        headerName: 'Percobaan',
        type: 'number',
        minWidth: 85,
        flex: 0.3,
        sortable: false,
      },
      dateTimeColumn('sent_at', 'Dikirim', true),
      dateTimeColumn('delivered_at', 'Diterima', false),
      dateTimeColumn('read_at', 'Dibaca', false),
      {
        field: '__actions__',
        headerName: 'Aksi',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(canCancel ? 3 : 1),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title="Lihat pesan">
              <IconButton
                aria-label={`Lihat pesan ${row.student.name}`}
                size="small"
                sx={gridActionButtonSx.view}
                onClick={() => setViewing(row)}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canCancel && row.status === CANCELLABLE_STATUS ? (
              <Tooltip title="Batalkan">
                <IconButton
                  aria-label={`Batalkan pesan ${row.student.name}`}
                  size="small"
                  sx={gridActionButtonSx.delete}
                  onClick={() => setCancelTarget(row)}
                >
                  <CancelOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            {canCancel && DELETABLE_STATUSES.has(row.status) ? (
              <Tooltip title="Hapus">
                <IconButton
                  aria-label={`Hapus pesan ${row.student.name}`}
                  size="small"
                  sx={gridActionButtonSx.delete}
                  onClick={() => setDeleteTarget(row)}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ],
    [canCancel],
  );

  return (
    <>
      <PageHeader
        title="Pengiriman"
        description="Log pesan WhatsApp: yang antre, terkirim, gagal, dan dibatalkan beserta alasannya."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Pengiriman' }]}
        actions={
          <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            {sendSettings && sendSettings.worker_alive !== undefined ? (
              <Chip
                color={sendSettings.worker_alive ? 'success' : 'error'}
                label={sendSettings.worker_alive ? 'Worker aktif' : 'Worker mati'}
                size="small"
                variant="outlined"
              />
            ) : null}
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => {
                loadDeliveryStatus();
                void grid.reload();
              }}
              sx={{ borderColor: 'divider' }}
            >
              Muat ulang
            </Button>
            {canSend ? (
              <Button
                component={Link}
                href={routes.manualSend}
                variant="contained"
                startIcon={<SendOutlinedIcon />}
              >
                Kirim Manual
              </Button>
            ) : null}
          </Stack>
        }
      />

      {sendSettings?.worker_alive === false ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {formatWorkerOfflineMessage(sendSettings.worker_last_seen_at)}
        </Alert>
      ) : null}
      {sendSettings?.paused_reason ? (
        <Alert
          action={
            <Button color="inherit" component={Link} href={routes.settings} size="small">
              Buka Pengaturan
            </Button>
          }
          severity="warning"
          sx={{ mb: 1.5 }}
        >
          Pengiriman dijeda otomatis ({describePausedReason(sendSettings.paused_reason)}). Buka
          Pengaturan untuk melanjutkan pengiriman antrean.
        </Alert>
      ) : null}
      {whatsappState && whatsappState !== 'connected' ? (
        <Alert
          action={
            <Button color="inherit" component={Link} href={routes.settings} size="small">
              Buka Pengaturan
            </Button>
          }
          severity="warning"
          sx={{ mb: 1.5 }}
        >
          WhatsApp belum terhubung ({whatsappStateLabel(whatsappState)}). Pesan dalam antrean akan
          tertahan sampai tersambung kembali.
        </Alert>
      ) : null}
      {sendSettings && !sendSettings.auto_send_enabled ? (
        <Alert
          action={
            <Button color="inherit" component={Link} href={routes.settings} size="small">
              Buka Pengaturan
            </Button>
          }
          severity="info"
          sx={{ mb: 1.5 }}
        >
          Pengiriman otomatis terjadwal masih mati — pesan terjadwal (auto) menunggu di antrean,
          sedangkan pesan manual tetap dikirim pada jam kirim (
          {sendSettings.window_start.slice(0, 5)}–{sendSettings.window_end.slice(0, 5)} WIB) selama
          worker aktif.
        </Alert>
      ) : null}

      <Card
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
          p: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as MessageStatus | '')}
            sx={{ width: { xs: '100%', sm: 180 } }}
          >
            <MenuItem value="">Semua</MenuItem>
            {MESSAGE_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <AppDatePicker label="Jadwal dari" value={dateFrom} onChange={setDateFrom} />
          <AppDatePicker label="Jadwal sampai" value={dateTo} onChange={setDateTo} />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
          <AppDataGrid
            columns={columns}
            fillWidth
            rowHeight={60}
            getRowId={(row: MessageRecord) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <MessageBodyDialog message={viewing} onClose={() => setViewing(null)} />

      <AppConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan pesan"
        message={`Pesan tidak akan dikirim. Penerima: ${cancelTarget?.student.name ?? ''} (${cancelTarget?.student.nim ?? ''}).`}
        confirmText="Batalkan pesan"
        cancelText="Kembali"
        confirmColor="error"
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus pesan"
        message={`Pesan akan dihapus dari daftar log/antrean. Penerima: ${deleteTarget?.student.name ?? ''} (${deleteTarget?.student.nim ?? ''}).`}
        confirmText="Hapus pesan"
        cancelText="Kembali"
        confirmColor="error"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
