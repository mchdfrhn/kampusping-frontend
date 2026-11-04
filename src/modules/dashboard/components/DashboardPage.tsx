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

import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { getErrorMessage } from '@/core/http/api-error';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { formatNumber, formatRupiah } from '@/core/utils/format.util';
import { describePausedReason } from '@/modules/settings/paused-reason';
import { whatsappService } from '@/modules/settings/services/whatsapp.service';
import type { WhatsAppState } from '@/modules/settings/types';

import {
  RECEIVED_TARGET_PERCENT,
  formatPercent,
  invoicePieData,
  messageStats,
  whatsappStateLabel,
} from '../dashboard.utils';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardSummary } from '../types';
import { StatCard } from './StatCard';

const SettingsLink = () => (
  <Button color="inherit" component={Link} href={routes.settings} size="small">
    Buka Pengaturan
  </Button>
);

const LoadingState = () => (
  <Box
    aria-label="Memuat ringkasan"
    aria-busy="true"
    sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2 }}
  >
    <Box sx={{ display: 'grid', gap: 1.75, gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} height={92} variant="rounded" />
      ))}
    </Box>
    <Box
      sx={{
        display: 'grid',
        gap: 1.75,
        gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
        flex: 1,
      }}
    >
      <Skeleton height="100%" variant="rounded" />
      <Skeleton height="100%" variant="rounded" />
    </Box>
  </Box>
);

const InvoiceStatusChart = ({ invoices }: { invoices: DashboardSummary['invoices'] }) => {
  const slices = invoicePieData(invoices);
  const hasData = slices.some((slice) => slice.value > 0);
  const summary = `Status tagihan: ${slices.map((slice) => `${slice.label} ${slice.value}`).join(', ')}`;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader
        sx={{ pb: 0, pt: 2, px: 2.5 }}
        title="Status Tagihan"
        subheader="Perbandingan tagihan yang sudah dan belum dibayar."
        slotProps={{
          title: { variant: 'subtitle1', fontWeight: 600, fontSize: '1rem' },
          subheader: { variant: 'caption', fontSize: '0.8125rem', color: 'text.secondary' },
        }}
      />
      <CardContent
        sx={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          p: '16px 24px 20px 24px !important',
        }}
      >
        {hasData ? (
          <Stack
            direction="row"
            spacing={3.5}
            sx={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}
          >
            <Box aria-label={summary} role="img" sx={{ flexShrink: 0, lineHeight: 0 }}>
              <PieChart
                height={180}
                hideLegend
                width={180}
                series={[
                  {
                    data: slices.map((slice) => ({
                      id: slice.id,
                      label: slice.label,
                      value: slice.value,
                      color: `var(--mui-palette-${slice.token})`,
                    })),
                    innerRadius: 48,
                    outerRadius: 82,
                    paddingAngle: 3,
                    cornerRadius: 4,
                  },
                ]}
              />
            </Box>
            <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0, flex: 1 }}>
              {slices.map((slice) => {
                const total = invoices.total || 1;
                const pct = Math.round((slice.value / total) * 100);
                return (
                  <Stack
                    component="li"
                    direction="row"
                    key={slice.id}
                    spacing={1.25}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                      <Box
                        aria-hidden="true"
                        sx={{
                          bgcolor: `var(--mui-palette-${slice.token})`,
                          borderRadius: '50%',
                          height: 12,
                          width: 12,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {slice.label}: {formatNumber(slice.value)}{' '}
                        <Typography
                          component="span"
                          sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}
                        >
                          ({pct}%)
                        </Typography>
                      </Typography>
                    </Stack>
                  </Stack>
                );
              })}
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

  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);
  const [whatsappState, setWhatsappState] = useState<WhatsAppState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    dashboardService
      .summary(undefined, controller.signal)
      .then((summary) => {
        if (controller.signal.aborted) return;
        setData(summary);
        setError(null);
        setLoadedKey(attempt);
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(getErrorMessage(failure, 'Gagal memuat ringkasan.'));
        setLoadedKey(attempt);
      });
    return () => controller.abort();
  }, [attempt]);

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
  const refreshing = loadedKey !== attempt;

  return (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        title="Dasbor"
        description="Ringkasan tagihan uang kuliah dan pengiriman pengingat WhatsApp."
        sx={{ mb: 1.75, flexShrink: 0 }}
      />

      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
        {data?.warnings.paused_reason ? (
          <Alert
            action={canReadSettings ? <SettingsLink /> : undefined}
            severity="warning"
            sx={{ mb: 1.5, py: 0.5, flexShrink: 0 }}
          >
            Pengiriman otomatis dijeda ({describePausedReason(data.warnings.paused_reason)}). Buka
            Pengaturan untuk melanjutkan.
          </Alert>
        ) : null}
        {data && !data.warnings.auto_send_enabled ? (
          <Alert
            action={canReadSettings ? <SettingsLink /> : undefined}
            severity="info"
            sx={{ mb: 1.5, py: 0.5, flexShrink: 0 }}
          >
            Pengiriman otomatis belum diaktifkan. Pesan tidak akan dikirim sampai diaktifkan di
            Pengaturan.
          </Alert>
        ) : null}
        {whatsappState && whatsappState !== 'connected' ? (
          <Alert
            action={<SettingsLink />}
            severity="warning"
            sx={{ mb: 1.5, py: 0.5, flexShrink: 0 }}
          >
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
            sx={{ flexShrink: 0 }}
          >
            {error}
          </Alert>
        ) : !data || !stats ? (
          <LoadingState />
        ) : (
          <Box
            aria-busy={refreshing}
            sx={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              minHeight: 0,
              gap: 1.75,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {/* Row 1: 4 Financial Cards */}
            <Box
              sx={{
                display: 'grid',
                gap: 1.75,
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                flexShrink: 0,
              }}
            >
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

            {/* Row 2: 2 Side-by-Side Panels (Status Tagihan Chart & WhatsApp Messages Activity) */}
            <Box
              sx={{
                display: 'grid',
                gap: 1.75,
                gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
                flex: 1,
                minHeight: 0,
                alignItems: 'stretch',
              }}
            >
              {/* Left Panel: Invoice Status Chart */}
              <InvoiceStatusChart invoices={data.invoices} />

              {/* Right Panel: WhatsApp Delivery Overview */}
              <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardHeader
                  sx={{ pb: 0, pt: 2, px: 2.5 }}
                  title="Pengiriman WhatsApp"
                  subheader="Performa pengiriman pengingat jatuh tempo."
                  slotProps={{
                    title: { variant: 'subtitle1', fontWeight: 600, fontSize: '1rem' },
                    subheader: {
                      variant: 'caption',
                      fontSize: '0.8125rem',
                      color: 'text.secondary',
                    },
                  }}
                />
                <CardContent
                  sx={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    p: '16px 20px 20px 20px !important',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      flex: 1,
                    }}
                  >
                    <StatCard label="Pesan terkirim" value={formatNumber(stats.sentTotal)} />
                    <StatCard
                      caption={`Target ≥ ${RECEIVED_TARGET_PERCENT}%`}
                      label="Diterima"
                      value={formatPercent(stats.receivedPercent)}
                    />
                    <StatCard label="Dibaca" value={formatPercent(stats.readPercent)} />
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      flex: 1,
                    }}
                  >
                    <StatCard label="Gagal" value={formatNumber(stats.failed)} />
                    <StatCard label="Antre" value={formatNumber(stats.queued)} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Typography
              color="text.secondary"
              variant="caption"
              sx={{ flexShrink: 0, display: 'block' }}
            >
              Diperbarui {formatDisplayDateTime(data.generated_at)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
