'use client';

import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import ScheduleSendOutlinedIcon from '@mui/icons-material/ScheduleSendOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { getErrorMessage } from '@/core/http/api-error';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { formatNumber, formatRupiah } from '@/core/utils/format.util';
import { describePausedReason, formatWorkerOfflineMessage } from '@/modules/settings/paused-reason';
import { whatsappService } from '@/modules/settings/services/whatsapp.service';
import type { WhatsAppState } from '@/modules/settings/types';

import {
  RECEIVED_TARGET_PERCENT,
  formatPercent,
  invoiceBreakdown,
  messageStats,
  percentOf,
  whatsappStateLabel,
} from '../dashboard.utils';
import type { MessageStats } from '../dashboard.utils';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardSummary, InvoiceSummary } from '../types';

const tabular = { fontVariantNumeric: 'tabular-nums' } as const;
const paletteVar = (token: string) => `var(--mui-palette-${token})`;

const SettingsLink = () => (
  <Button color="inherit" component={Link} href={routes.settings} size="small">
    Buka Pengaturan
  </Button>
);

const PanelTitle = ({ title, description }: { title: string; description: string }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 }}>
      {title}
    </Typography>
    <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', mt: 0.25 }}>
      {description}
    </Typography>
  </Box>
);

const panelSx = { p: { xs: 2.5, md: 3 }, height: '100%' } as const;

const LoadingState = () => (
  <Box
    aria-busy="true"
    aria-label="Memuat ringkasan"
    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
  >
    <Skeleton height={228} variant="rounded" />
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' } }}>
      <Skeleton height={260} variant="rounded" />
      <Skeleton height={260} variant="rounded" />
    </Box>
  </Box>
);

/**
 * The hero: how much of the billed amount has come in, with one bar split into paid, not yet due
 * and overdue (by rupiah) and the counts and sums under it.
 */
const CollectionPanel = ({
  invoices,
  semester,
}: {
  invoices: InvoiceSummary;
  semester: string | null;
}) => {
  const slices = invoiceBreakdown(invoices);
  const paidPercent = percentOf(invoices.paid_amount, invoices.total_amount);
  const summary = `Status tagihan: ${slices
    .map((slice) => `${slice.label} ${slice.value} tagihan ${formatRupiah(slice.amount)}`)
    .join(', ')}`;

  return (
    <Card component="section" aria-labelledby="collection-title" sx={panelSx}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
      >
        <Box>
          <Typography
            component="h2"
            id="collection-title"
            sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 }}
          >
            Pelunasan tagihan{semester ? ` semester ${semester}` : ''}
          </Typography>
          <Typography
            component="p"
            sx={{
              ...tabular,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mt: 1.5,
            }}
          >
            {formatRupiah(invoices.paid_amount)}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem', mt: 0.5 }}>
            sudah dibayar dari {formatRupiah(invoices.total_amount)}
          </Typography>
        </Box>

        <Box data-stat="" sx={{ textAlign: { sm: 'right' } }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            Total tagihan
          </Typography>
          <Typography
            component="p"
            sx={{ ...tabular, fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 }}
          >
            {formatNumber(invoices.total)}
          </Typography>
          <Typography color="text.secondary" sx={{ ...tabular, fontSize: '0.8125rem' }}>
            {formatRupiah(invoices.total_amount)}
          </Typography>
        </Box>
      </Stack>

      {invoices.total > 0 ? (
        <>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 3 }}>
            <Box
              aria-label={summary}
              role="img"
              sx={{
                bgcolor: 'action.hover',
                borderRadius: 1,
                display: 'flex',
                flex: 1,
                gap: '2px',
                height: 14,
                overflow: 'hidden',
              }}
            >
              {slices.map((slice) =>
                slice.amount > 0 ? (
                  <Box
                    key={slice.id}
                    sx={{
                      bgcolor: paletteVar(slice.token),
                      flexBasis: `${(slice.amount / invoices.total_amount) * 100}%`,
                      flexGrow: 0,
                      flexShrink: 1,
                      // A sliver stays visible even when a slice is a fraction of a percent.
                      minWidth: 6,
                    }}
                  />
                ) : null,
              )}
            </Box>
            <Typography
              sx={{
                ...tabular,
                fontSize: '0.875rem',
                fontWeight: 600,
                minWidth: 40,
                textAlign: 'right',
              }}
            >
              {formatPercent(paidPercent)}
            </Typography>
          </Stack>

          <Box
            component="ul"
            sx={{
              display: 'grid',
              gap: { xs: 2, sm: 3 },
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              listStyle: 'none',
              m: 0,
              mt: 2.5,
              p: 0,
            }}
          >
            {slices.map((slice) => {
              const alarming = slice.id === 'overdue' && slice.value > 0;
              return (
                <Box
                  component="li"
                  data-stat=""
                  data-tone={alarming ? 'error' : 'default'}
                  key={slice.id}
                  sx={{
                    borderLeft: 3,
                    borderColor: paletteVar(slice.token),
                    pl: 1.5,
                  }}
                >
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                  >
                    {slice.label}
                  </Typography>
                  <Typography
                    component="p"
                    sx={{
                      ...tabular,
                      color: alarming ? 'error.main' : 'text.primary',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    {formatRupiah(slice.amount)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ ...tabular, fontSize: '0.8125rem' }}>
                    <span>{formatNumber(slice.value)}</span> tagihan
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </>
      ) : (
        <Typography color="text.secondary" sx={{ fontSize: '0.875rem', mt: 3 }}>
          Belum ada tagihan. Impor data dari SIAKAD atau SIPEMA untuk mulai menagih.
        </Typography>
      )}
    </Card>
  );
};

type FunnelRow = {
  label: string;
  count: number;
  percent: number | null;
  /** The first row is the base (100%): it shows the count, the others show a share of it. */
  base?: boolean;
  /** Bar strength, lighter for the earlier stages. */
  opacity: number;
  /** Show the BRD target as a marker on this row. */
  target?: number;
};

/** Terkirim, diterima, dibaca: each bar is a share of the messages that left for WhatsApp. */
const DeliveryPanel = ({ stats }: { stats: MessageStats }) => {
  const rows: FunnelRow[] = [
    {
      label: 'Terkirim',
      count: stats.sentTotal,
      percent: stats.sentTotal > 0 ? 100 : null,
      base: true,
      opacity: 0.35,
    },
    {
      label: 'Diterima',
      count: stats.receivedCount,
      percent: stats.receivedPercent,
      opacity: 0.7,
      target: RECEIVED_TARGET_PERCENT,
    },
    { label: 'Dibaca', count: stats.readCount, percent: stats.readPercent, opacity: 1 },
  ];
  const meetsTarget =
    stats.receivedPercent === null ? null : stats.receivedPercent >= RECEIVED_TARGET_PERCENT;

  return (
    <Card component="section" sx={panelSx}>
      <PanelTitle
        title="Pengiriman WhatsApp"
        description="Dari pesan yang terkirim, berapa yang sampai dan dibaca mahasiswa."
      />
      <Stack component="ul" spacing={2.25} sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {rows.map((row) => (
          <Box component="li" data-stat="" key={row.label}>
            <Stack
              direction="row"
              sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 0.75 }}
            >
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{row.label}</Typography>
              <Typography sx={{ ...tabular, fontSize: '0.875rem' }}>
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {row.base ? formatNumber(row.count) : formatPercent(row.percent)}
                </Box>
                {row.base ? null : (
                  <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                    {formatNumber(row.count)} pesan
                  </Box>
                )}
              </Typography>
            </Stack>
            <Box
              aria-hidden="true"
              sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 10, position: 'relative' }}
            >
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                  height: '100%',
                  opacity: row.opacity,
                  width: `${row.percent ?? 0}%`,
                }}
              />
              {row.target ? (
                <Box
                  sx={{
                    bgcolor: 'text.primary',
                    borderRadius: 0.5,
                    height: 18,
                    left: `${row.target}%`,
                    position: 'absolute',
                    top: -4,
                    width: 2,
                  }}
                />
              ) : null}
            </Box>
          </Box>
        ))}
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 2.5, rowGap: 1 }}
      >
        <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
          Target ≥ {RECEIVED_TARGET_PERCENT}% diterima
        </Typography>
        {meetsTarget === null ? null : (
          <Chip
            color={meetsTarget ? 'success' : 'warning'}
            label={meetsTarget ? 'Tercapai' : 'Belum tercapai'}
            size="small"
            variant="outlined"
          />
        )}
      </Stack>
    </Card>
  );
};

type FollowUp = {
  label: string;
  hint: string;
  value: number;
  icon: ReactNode;
  /** Highlight when the value is above zero. */
  alarming: boolean;
  href?: string;
  linkLabel?: string;
};

/** What staff should look at next. Links only appear for screens the user may open. */
const FollowUpPanel = ({ items }: { items: FollowUp[] }) => (
  <Card component="section" sx={panelSx}>
    <PanelTitle title="Perlu ditindaklanjuti" description="Hal yang butuh perhatian staf." />
    <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((item, index) => {
        const tone = item.alarming && item.value > 0 ? 'error' : 'default';
        return (
          <Stack
            component="li"
            data-stat=""
            data-tone={tone}
            direction="row"
            key={item.label}
            spacing={1.75}
            sx={{
              alignItems: 'center',
              borderTop: index === 0 ? 0 : 1,
              borderColor: 'divider',
              py: 1.5,
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                alignItems: 'center',
                bgcolor:
                  tone === 'error'
                    ? `color-mix(in srgb, ${paletteVar('error-main')} 14%, transparent)`
                    : 'action.hover',
                borderRadius: 1.5,
                color: tone === 'error' ? 'error.main' : 'text.secondary',
                display: 'flex',
                flexShrink: 0,
                height: 36,
                justifyContent: 'center',
                width: 36,
              }}
            >
              {item.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {item.hint}
              </Typography>
            </Box>
            <Typography
              component="p"
              sx={{
                ...tabular,
                color: tone === 'error' ? 'error.main' : 'text.primary',
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              {formatNumber(item.value)}
            </Typography>
            {item.href ? (
              <Button
                aria-label={item.linkLabel}
                component={Link}
                href={item.href}
                size="small"
                sx={{ minWidth: 0, px: 0.5 }}
              >
                <ChevronRightRoundedIcon fontSize="small" />
              </Button>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  </Card>
);

export const DashboardPage = () => {
  const canReadSettings = usePermission(permissions.settingsRead);
  const canReadMessages = usePermission(permissions.messagesRead);
  const canReadInvoices = usePermission(permissions.invoicesRead);

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

  const followUps: FollowUp[] =
    data && stats
      ? [
          {
            label: 'Pesan gagal',
            hint: 'Periksa nomor atau kirim ulang dari log.',
            value: stats.failed,
            icon: <ErrorOutlineRoundedIcon fontSize="small" />,
            alarming: true,
            href: canReadMessages ? routes.messages : undefined,
            linkLabel: 'Buka log pengiriman',
          },
          {
            label: 'Tagihan menunggak',
            hint: 'Lewat jatuh tempo dan belum dibayar.',
            value: data.invoices.overdue,
            icon: <EventBusyOutlinedIcon fontSize="small" />,
            alarming: true,
            href: canReadInvoices ? routes.invoices : undefined,
            linkLabel: 'Buka daftar tagihan',
          },
          {
            label: 'Dalam antrean',
            hint: 'Menunggu jam kirim berikutnya.',
            value: stats.queued,
            icon: <ScheduleSendOutlinedIcon fontSize="small" />,
            alarming: false,
          },
        ]
      : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Dasbor"
        description="Ringkasan tagihan uang kuliah dan pengiriman pengingat WhatsApp."
        sx={{ mb: 2, flexShrink: 0 }}
      />

      {data?.warnings.worker_alive === false ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {formatWorkerOfflineMessage(data.warnings.worker_last_seen_at)}
        </Alert>
      ) : null}
      {data?.warnings.paused_reason ? (
        <Alert
          action={canReadSettings ? <SettingsLink /> : undefined}
          severity="warning"
          sx={{ mb: 1.5 }}
        >
          Pengiriman otomatis dijeda ({describePausedReason(data.warnings.paused_reason)}). Buka
          Pengaturan untuk melanjutkan.
        </Alert>
      ) : null}
      {data && !data.warnings.auto_send_enabled ? (
        <Alert
          action={canReadSettings ? <SettingsLink /> : undefined}
          severity="info"
          sx={{ mb: 1.5 }}
        >
          Pengiriman otomatis belum diaktifkan. Pesan tidak akan dikirim sampai diaktifkan di
          Pengaturan.
        </Alert>
      ) : null}
      {whatsappState && whatsappState !== 'connected' ? (
        <Alert action={<SettingsLink />} severity="warning" sx={{ mb: 1.5 }}>
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
        <Box
          aria-busy={refreshing}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <CollectionPanel invoices={data.invoices} semester={data.semester} />

          <Box
            sx={{
              alignItems: 'stretch',
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
            }}
          >
            <DeliveryPanel stats={stats} />
            <FollowUpPanel items={followUps} />
          </Box>

          <Typography color="text.secondary" sx={{ display: 'block' }} variant="caption">
            Diperbarui {formatDisplayDateTime(data.generated_at)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
