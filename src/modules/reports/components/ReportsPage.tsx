'use client';

import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { type ReactNode, useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDate, formatDisplayDateTime } from '@/core/utils/date.util';
import { saveBlob } from '@/core/utils/download.util';
import { formatNumber, formatRupiah } from '@/core/utils/format.util';
import { StatCard } from '@/modules/dashboard/components/StatCard';

import { reportsService } from '../services/reports.service';
import type { ReportFormat, ReportPreset, ReportPreview } from '../types';

const percentFormat = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const formatPercentValue = (value: number): string => `${percentFormat.format(value)}%`;

type Outcome = { key: string; preview: ReportPreview | null; error: string | null };

const cardGridSx = (columns: number) => ({
  display: 'grid',
  gap: 1.75,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${columns}, 1fr)` },
});

const CardGroup = ({
  title,
  columns,
  children,
}: {
  title: string;
  columns: number;
  children: ReactNode;
}) => (
  <Box component="section">
    <Typography
      component="h2"
      sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.6, mb: 1 }}
      variant="overline"
    >
      {title}
    </Typography>
    <Box sx={cardGridSx(columns)}>{children}</Box>
  </Box>
);

const PreviewBody = ({ preview }: { preview: ReportPreview }) => {
  const { invoices, payments_in_period: payments } = preview.summary;
  const periodTitle =
    preview.preset === 'weekly'
      ? `7 hari terakhir (${formatDisplayDate(preview.period_start)} sampai ${formatDisplayDate(preview.period_end)})`
      : `Semester ${preview.semester}`;
  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="p" sx={{ fontWeight: 600 }} variant="subtitle1">
          {periodTitle}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          Dibuat {formatDisplayDateTime(preview.generated_at)} oleh {preview.generated_by}
        </Typography>
      </Box>

      <CardGroup title="Status tagihan" columns={4}>
        <StatCard
          label="Total tagihan"
          value={formatNumber(invoices.total)}
          caption={formatRupiah(invoices.total_amount)}
        />
        <StatCard
          label="Lunas"
          value={formatNumber(invoices.paid)}
          caption={`${formatPercentValue(invoices.paid_percent_count)} · ${formatRupiah(invoices.paid_amount)}`}
        />
        <StatCard
          label="Belum lunas"
          value={formatNumber(invoices.unpaid)}
          caption={formatRupiah(invoices.unpaid_amount)}
        />
        <StatCard
          label="Lewat jatuh tempo"
          tone="error"
          value={formatNumber(invoices.overdue)}
          caption={formatRupiah(invoices.overdue_amount)}
        />
      </CardGroup>

      <CardGroup title="Pengecualian dan aktivitas" columns={payments ? 3 : 2}>
        <StatCard
          label="Dikecualikan"
          value={formatNumber(invoices.exempt)}
          caption={formatRupiah(invoices.exempt_amount)}
        />
        <StatCard
          label="Lunas setelah pesan"
          value={formatNumber(preview.summary.paid_after_message)}
          caption={`dari ${formatNumber(invoices.paid)} tagihan lunas`}
        />
        {payments ? (
          <StatCard
            label="Pembayaran 7 hari terakhir"
            value={formatNumber(payments.count)}
            caption={formatRupiah(payments.amount)}
          />
        ) : null}
      </CardGroup>

      <Card variant="outlined">
        <CardContent>
          <Typography component="h2" sx={{ fontWeight: 600, mb: 1.5 }} variant="subtitle1">
            Per prodi dan angkatan
          </Typography>
          {preview.groups.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              Belum ada data tagihan.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Prodi</TableCell>
                    <TableCell>Angkatan</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Lunas</TableCell>
                    <TableCell align="right">Belum</TableCell>
                    <TableCell align="right">Lewat tempo</TableCell>
                    <TableCell align="right">Nominal tunggakan</TableCell>
                    <TableCell align="right">% lunas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.groups.map((group) => (
                    <TableRow key={`${group.study_program}|${group.cohort}`}>
                      <TableCell>{group.study_program}</TableCell>
                      <TableCell>{group.cohort}</TableCell>
                      <TableCell align="right">{formatNumber(group.total)}</TableCell>
                      <TableCell align="right">{formatNumber(group.paid)}</TableCell>
                      <TableCell align="right">{formatNumber(group.unpaid)}</TableCell>
                      <TableCell align="right">{formatNumber(group.overdue)}</TableCell>
                      <TableCell align="right">{formatRupiah(group.overdue_amount)}</TableCell>
                      <TableCell align="right">{formatPercentValue(group.paid_percent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Alert severity="info" variant="outlined">
        {formatNumber(preview.arrears_count)} tagihan menunggak; rincian nama ada di berkas unduhan.
      </Alert>
    </Stack>
  );
};

export const ReportsPage = () => {
  const notify = useNotify();
  const canExport = usePermission(permissions.reportsExport);

  const [preset, setPreset] = useState<ReportPreset>('weekly');
  const [semester, setSemester] = useState('');
  const [semesters, setSemesters] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [downloading, setDownloading] = useState<ReportFormat | null>(null);

  const needsSemester = preset === 'semester' && !semester;
  const requestKey = `${preset}|${semester}|${attempt}`;
  const semesterArgument = preset === 'semester' ? semester : undefined;

  // The semester list is a convenience for the dropdown; the weekly report works without it.
  useEffect(() => {
    let cancelled = false;
    reportsService
      .options()
      .then((options) => {
        if (!cancelled) setSemesters(options.semesters);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (needsSemester) return;
    const controller = new AbortController();
    reportsService
      .preview(preset, semesterArgument, controller.signal)
      .then((preview) => {
        if (!controller.signal.aborted) setOutcome({ key: requestKey, preview, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setOutcome({
          key: requestKey,
          preview: null,
          error: getErrorMessage(error, 'Gagal memuat laporan.'),
        });
      });
    return () => controller.abort();
  }, [needsSemester, preset, semesterArgument, requestKey]);

  const settled = outcome?.key === requestKey ? outcome : null;
  const loading = !needsSemester && settled === null;
  const canDownload = !needsSemester && settled?.preview != null && downloading === null;

  const handleDownload = async (format: ReportFormat) => {
    setDownloading(format);
    try {
      const { blob, filename } = await reportsService.download(preset, semesterArgument, format);
      saveBlob(blob, filename ?? `laporan-penagihan.${format}`);
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal mengunduh laporan.'));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Laporan Penagihan"
        description="Ringkasan penagihan, rincian per prodi dan angkatan, serta daftar tunggakan. Unduh sebagai Excel atau PDF."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Laporan' }]}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
        >
          <ToggleButtonGroup
            aria-label="Cakupan laporan"
            color="primary"
            exclusive
            value={preset}
            sx={{ '& .MuiToggleButton-root': { fontWeight: 600, height: 40, px: 2 } }}
            onChange={(_, value: ReportPreset | null) => {
              if (value) setPreset(value);
            }}
          >
            <ToggleButton value="weekly">7 hari terakhir</ToggleButton>
            <ToggleButton value="semester">Per semester</ToggleButton>
          </ToggleButtonGroup>

          {preset === 'semester' ? (
            <TextField
              select
              label="Semester"
              size="small"
              sx={{ minWidth: 240 }}
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
            >
              {semesters.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
        </Stack>

        {canExport ? (
          <Stack direction="row" spacing={1}>
            <Button
              disabled={!canDownload}
              startIcon={<TableChartOutlinedIcon />}
              sx={{ height: 40 }}
              variant="outlined"
              onClick={() => void handleDownload('xlsx')}
            >
              Unduh Excel
            </Button>
            <Button
              disabled={!canDownload}
              startIcon={<PictureAsPdfOutlinedIcon />}
              sx={{ height: 40 }}
              variant="outlined"
              onClick={() => void handleDownload('pdf')}
            >
              Unduh PDF
            </Button>
          </Stack>
        ) : null}
      </Stack>

      {needsSemester ? (
        <Alert severity="info">Pilih semester untuk melihat laporan.</Alert>
      ) : loading ? (
        <Stack aria-busy="true" aria-label="Memuat laporan" spacing={3}>
          <Skeleton height={44} variant="rounded" width={320} />
          <Box sx={cardGridSx(4)}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} height={92} variant="rounded" />
            ))}
          </Box>
          <Box sx={cardGridSx(3)}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} height={92} variant="rounded" />
            ))}
          </Box>
          <Skeleton height={180} variant="rounded" />
        </Stack>
      ) : settled?.error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setAttempt((value) => value + 1)}>
              Coba lagi
            </Button>
          }
        >
          {settled.error}
        </Alert>
      ) : settled?.preview ? (
        <PreviewBody preview={settled.preview} />
      ) : null}
    </>
  );
};
