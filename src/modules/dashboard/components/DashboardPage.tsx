'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { AppTextField } from '@/components/base/AppTextField';
import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { useDebounce } from '@/core/hooks/useDebounce';
import { getErrorMessage } from '@/core/http/api-error';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { formatNumber, formatRupiah } from '@/core/utils/format.util';
import { describePausedReason } from '@/modules/settings/paused-reason';
import { whatsappService } from '@/modules/settings/services/whatsapp.service';
import type { WhatsAppState } from '@/modules/settings/types';

import {
  RECEIVED_TARGET_PERCENT,
  SEMESTER_MAX_LENGTH,
  formatPercent,
  invoicePieData,
  messageStats,
  whatsappStateLabel,
} from '../dashboard.utils';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardSummary } from '../types';
import { StatCard } from './StatCard';

const CARD_GRID_SX = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
} as const;

const SettingsLink = () => (
  <Button color="inherit" component={Link} href={routes.settings} size="small">
    Buka Pengaturan
  </Button>
);

const LoadingState = () => (
  <Stack aria-label="Memuat ringkasan" aria-busy="true" spacing={3}>
    <Box sx={CARD_GRID_SX}>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} height={112} variant="rounded" />
      ))}
    </Box>
    <Box sx={CARD_GRID_SX}>
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} height={112} variant="rounded" />
      ))}
    </Box>
    <Skeleton height={260} variant="rounded" />
  </Stack>
);

const InvoiceStatusChart = ({ invoices }: { invoices: DashboardSummary['invoices'] }) => {
  const slices = invoicePieData(invoices);
  const hasData = slices.some((slice) => slice.value > 0);
  const summary = `Status tagihan: ${slices.map((slice) => `${slice.label} ${slice.value}`).join(', ')}`;

  return (
    <Card>
      <CardHeader
        title="Status tagihan"
        subheader="Perbandingan tagihan yang sudah dan belum dibayar."
      />
      <CardContent>
        {hasData ? (
          <Stack
            spacing={3}
            sx={{ alignItems: 'center', flexDirection: { sm: 'row' }, justifyContent: 'center' }}
          >
            <Box aria-label={summary} role="img" sx={{ flexShrink: 0, lineHeight: 0 }}>
              <PieChart
                height={200}
                hideLegend
                width={200}
                series={[
                  {
                    data: slices.map((slice) => ({
                      id: slice.id,
                      label: slice.label,
                      value: slice.value,
                      color: `var(--mui-palette-${slice.token})`,
                    })),
                    innerRadius: 55,
                    outerRadius: 95,
                    paddingAngle: 2,
                    cornerRadius: 3,
                  },
                ]}
              />
            </Box>
            <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {slices.map((slice) => (
                <Stack
                  component="li"
                  direction="row"
                  key={slice.id}
                  spacing={1}
                  sx={{ alignItems: 'center' }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      bgcolor: `var(--mui-palette-${slice.token})`,
                      borderRadius: '50%',
                      height: 12,
                      width: 12,
                    }}
                  />
                  <Typography variant="body2">
                    {slice.label}: {formatNumber(slice.value)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="body2">
            Belum ada tagihan.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardPage = () => {
  const canReadSettings = usePermission(permissions.settingsRead);

  const [semesterInput, setSemesterInput] = useState('');
  const semester = useDebounce(semesterInput.trim());
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [whatsappState, setWhatsappState] = useState<WhatsAppState | null>(null);

  const requestKey = `${semester}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    dashboardService
      .summary(semester || undefined, controller.signal)
      .then((summary) => {
        if (controller.signal.aborted) return;
        setData(summary);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(getErrorMessage(failure, 'Gagal memuat ringkasan.'));
        setLoadedKey(requestKey);
      });
    return () => controller.abort();
  }, [semester, requestKey]);

  // One look at the connection on load; a failed call simply shows nothing. The Pengaturan page
  // is where the live status (and the QR) are polled.
  useEffect(() => {
    if (!canReadSettings) return;
    const controller = new AbortController();
    whatsappService
      .status(controller.signal)
      .then((status) => {
        if (!controller.signal.aborted) setWhatsappState(status.state);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [canReadSettings]);

  const retry = () => {
    setError(null);
    setData(null);
    setAttempt((value) => value + 1);
  };

  const stats = useMemo(() => (data ? messageStats(data.messages) : null), [data]);
  const refreshing = loadedKey !== requestKey;

  return (
    <>
      <PageHeader
        title="Dasbor"
        description="Ringkasan tagihan uang kuliah dan pengiriman pengingat WhatsApp."
        actions={
          <AppTextField
            label="Semester"
            placeholder="Semua semester"
            size="small"
            slotProps={{ htmlInput: { maxLength: SEMESTER_MAX_LENGTH } }}
            value={semesterInput}
            onChange={(event) => setSemesterInput(event.target.value)}
          />
        }
      />

      <Stack spacing={3}>
        {data?.warnings.paused_reason ? (
          <Alert action={canReadSettings ? <SettingsLink /> : undefined} severity="warning">
            Pengiriman otomatis dijeda ({describePausedReason(data.warnings.paused_reason)}). Buka
            Pengaturan untuk melanjutkan.
          </Alert>
        ) : null}
        {data && !data.warnings.auto_send_enabled ? (
          <Alert action={canReadSettings ? <SettingsLink /> : undefined} severity="info">
            Pengiriman otomatis belum diaktifkan. Pesan tidak akan dikirim sampai diaktifkan di
            Pengaturan.
          </Alert>
        ) : null}
        {whatsappState && whatsappState !== 'connected' ? (
          <Alert action={<SettingsLink />} severity="warning">
            WhatsApp belum terhubung ({whatsappStateLabel(whatsappState)}).
          </Alert>
        ) : null}

        {error ? (
          <Alert
            action={
              <Button color="inherit" size="small" onClick={retry}>
                Coba lagi
              </Button>
            }
            severity="error"
          >
            {error}
          </Alert>
        ) : !data || !stats ? (
          <LoadingState />
        ) : (
          <Stack aria-busy={refreshing} spacing={3} sx={{ opacity: refreshing ? 0.6 : 1 }}>
            <Box sx={CARD_GRID_SX}>
              <StatCard
                caption={formatRupiah(data.invoices.total_amount)}
                label="Total tagihan"
                value={formatNumber(data.invoices.total)}
              />
              <StatCard
                caption={formatRupiah(data.invoices.paid_amount)}
                label="Lunas"
                value={formatNumber(data.invoices.paid)}
              />
              <StatCard
                caption={formatRupiah(data.invoices.unpaid_amount)}
                label="Belum lunas"
                value={formatNumber(data.invoices.unpaid)}
              />
              <StatCard
                caption={formatRupiah(data.invoices.overdue_amount)}
                label="Tunggakan"
                tone={data.invoices.overdue > 0 ? 'error' : 'default'}
                value={formatNumber(data.invoices.overdue)}
              />
            </Box>

            <Box sx={CARD_GRID_SX}>
              <StatCard label="Pesan terkirim" value={formatNumber(stats.sentTotal)} />
              <StatCard
                caption={`Target ≥ ${RECEIVED_TARGET_PERCENT}%`}
                label="Diterima"
                value={formatPercent(stats.receivedPercent)}
              />
              <StatCard label="Dibaca" value={formatPercent(stats.readPercent)} />
              <StatCard label="Gagal" value={formatNumber(stats.failed)} />
              <StatCard label="Antre" value={formatNumber(stats.queued)} />
            </Box>

            <InvoiceStatusChart invoices={data.invoices} />

            <Typography color="text.secondary" variant="caption">
              Diperbarui {formatDisplayDateTime(data.generated_at)}
            </Typography>
          </Stack>
        )}
      </Stack>
    </>
  );
};
