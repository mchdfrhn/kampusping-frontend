'use client';

import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import RemoveDoneOutlinedIcon from '@mui/icons-material/RemoveDoneOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { GridColDef } from '@mui/x-data-grid';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { routes } from '@/core/config/route.config';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDate } from '@/core/utils/date.util';
import { formatRupiah } from '@/core/utils/format.util';
import { templatesService } from '@/modules/templates/services/templates.service';
import type { TemplateRecord } from '@/modules/templates/types';

import { messagesService } from '../services/messages.service';
import type {
  ManualFilterOptions,
  ManualMessagePreviewResponse,
  ManualMessageSendResponse,
  ManualRecipientItem,
} from '../types';

type GridItem = ManualRecipientItem & { id: number };

export const ManualSendPage = () => {
  const notify = useNotify();
  const theme = useTheme();

  // Reference data
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<ManualFilterOptions>({
    cohorts: [],
    study_programs: [],
    semesters: [],
  });
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Form filter state
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [studyProgram, setStudyProgram] = useState('');
  const [cohort, setCohort] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('unpaid');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [search, setSearch] = useState('');

  // Preview & execution state
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ManualMessagePreviewResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<ManualMessageSendResponse | null>(null);

  // Load initial options & active templates
  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoadingRefs(true);
      try {
        const [templatesRes, optionsRes] = await Promise.all([
          templatesService.list({ is_active: true, page_size: 100 }),
          messagesService.getFilterOptions(),
        ]);
        if (!active) return;
        setTemplates(templatesRes.items);
        setFilterOptions(optionsRes);
        if (templatesRes.items.length > 0) {
          setTemplateId(templatesRes.items[0].id);
        }
      } catch (err) {
        if (active) {
          notify.error(getErrorMessage(err, 'Gagal memuat data opsi filter atau templat pesan.'));
        }
      } finally {
        if (active) setLoadingRefs(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [notify]);

  const handleResetFilters = () => {
    setStudyProgram('');
    setCohort('');
    setInvoiceStatus('unpaid');
    setAmountMin('');
    setAmountMax('');
    setSearch('');
    setPreviewData(null);
    setSelectedIds(new Set());
    setSendResult(null);
  };

  const handleFetchPreview = async () => {
    if (!templateId) {
      notify.error('Pilih templat pesan terlebih dahulu.');
      return;
    }

    setLoadingPreview(true);
    setSendResult(null);
    try {
      const res = await messagesService.previewManual({
        template_id: Number(templateId),
        study_program: studyProgram || undefined,
        cohort: cohort || undefined,
        status: invoiceStatus || undefined,
        amount_min: amountMin ? Number(amountMin) : undefined,
        amount_max: amountMax ? Number(amountMax) : undefined,
        search: search.trim() || undefined,
      });
      setPreviewData(res);
      // Select all eligible invoices by default
      const eligibleIds = new Set(
        res.items.filter((item) => item.is_eligible).map((item) => item.invoice_id),
      );
      setSelectedIds(eligibleIds);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Gagal memuat pratinjau penerima pesan.'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const eligibleItems = useMemo(() => {
    if (!previewData) return [];
    return previewData.items.filter((item) => item.is_eligible);
  }, [previewData]);

  const handleSelectAllEligible = useCallback(() => {
    const allEligible = new Set(eligibleItems.map((item) => item.invoice_id));
    setSelectedIds(allEligible);
  }, [eligibleItems]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((invoiceId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }
      return next;
    });
  }, []);

  const handleConfirmSend = async () => {
    if (!templateId || selectedIds.size === 0) return;

    setSending(true);
    try {
      const res = await messagesService.sendManual({
        template_id: Number(templateId),
        invoice_ids: Array.from(selectedIds),
      });
      setSendResult(res);
      notify.success(
        `Berhasil menjadwalkan ${res.queued_count} pesan manual ke antrean (Batch: ${res.batch_ref}).`,
      );
      setConfirmOpen(false);
      setSelectedIds(new Set());
    } catch (err) {
      notify.error(getErrorMessage(err, 'Gagal mengeksekusi pengiriman pesan manual.'));
    } finally {
      setSending(false);
    }
  };

  const allEligibleSelected =
    eligibleItems.length > 0 && eligibleItems.every((item) => selectedIds.has(item.invoice_id));
  const someEligibleSelected =
    eligibleItems.some((item) => selectedIds.has(item.invoice_id)) && !allEligibleSelected;

  const toggleSelectAllEligible = useCallback(() => {
    if (allEligibleSelected) {
      handleDeselectAll();
    } else {
      handleSelectAllEligible();
    }
  }, [allEligibleSelected, handleDeselectAll, handleSelectAllEligible]);

  const columns = useMemo<GridColDef<GridItem>[]>(
    () => [
      {
        field: 'selection',
        headerName: '',
        width: 50,
        sortable: false,
        renderHeader: () => (
          <Checkbox
            size="small"
            checked={allEligibleSelected}
            indeterminate={someEligibleSelected}
            onChange={toggleSelectAllEligible}
            aria-label="Pilih semua penerima yang memenuhi syarat"
          />
        ),
        renderCell: ({ row }) => (
          <Checkbox
            size="small"
            checked={selectedIds.has(row.invoice_id)}
            disabled={!row.is_eligible}
            onChange={() => toggleSelect(row.invoice_id)}
            aria-label={`Pilih ${row.student_name}`}
          />
        ),
      },
      {
        field: 'nim',
        headerName: 'NIM',
        minWidth: 100,
        flex: 0.7,
      },
      {
        field: 'student_name',
        headerName: 'Nama Mahasiswa',
        minWidth: 150,
        flex: 1.1,
      },
      {
        field: 'phone_masked',
        headerName: 'No. WhatsApp',
        minWidth: 130,
        flex: 0.9,
        valueGetter: (_val, row) => row.phone_masked || '-',
      },
      {
        field: 'study_program',
        headerName: 'Program Studi',
        minWidth: 140,
        flex: 1,
        valueGetter: (_val, row) =>
          row.study_program ? `${row.study_program} (${row.cohort ?? '-'})` : '-',
      },
      {
        field: 'invoice_code',
        headerName: 'Kode Tagihan',
        minWidth: 130,
        flex: 0.9,
      },
      {
        field: 'amount',
        headerName: 'Nominal',
        minWidth: 110,
        flex: 0.8,
        type: 'number',
        valueFormatter: (val) => formatRupiah(Number(val)),
      },
      {
        field: 'due_date',
        headerName: 'Jatuh Tempo',
        minWidth: 110,
        flex: 0.8,
        valueFormatter: (val) => formatDisplayDate(val ? String(val) : null),
      },
      {
        field: 'is_eligible',
        headerName: 'Kelayakan',
        minWidth: 120,
        flex: 0.8,
        renderCell: ({ row }) => (
          <AppStatusChip
            status={row.is_eligible ? 'success' : 'default'}
            label={row.is_eligible ? 'Siap Dikirim' : 'Dikecualikan'}
          />
        ),
      },
      {
        field: 'exclude_reason',
        headerName: 'Keterangan',
        minWidth: 160,
        flex: 1.2,
        renderCell: ({ row }) =>
          row.exclude_reason ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {row.exclude_reason}
            </Typography>
          ) : (
            <Typography variant="body2" color="success.main">
              Memenuhi syarat
            </Typography>
          ),
      },
    ],
    [allEligibleSelected, someEligibleSelected, selectedIds, toggleSelect, toggleSelectAllEligible],
  );

  const gridRows = useMemo<GridItem[]>(() => {
    if (!previewData) return [];
    return previewData.items.map((item) => ({ ...item, id: item.invoice_id }));
  }, [previewData]);

  const selectedCount = selectedIds.size;

  return (
    <>
      <PageHeader
        title="Kirim Pesan Manual"
        description="Filter data tagihan mahasiswa, pilih templat pesan, tinjau pratinjau penerima beserta pengecualiannya, dan eksekusi pengiriman pesan WhatsApp secara massal."
        breadcrumbs={[
          { label: 'Dasbor', href: routes.dashboard },
          { label: 'Pengiriman', href: routes.messages },
          { label: 'Kirim Manual' },
        ]}
        actions={
          <Button
            component={Link}
            href={routes.messages}
            color="inherit"
            variant="outlined"
            startIcon={<HistoryOutlinedIcon />}
            sx={{ borderColor: 'divider' }}
          >
            Riwayat Pengiriman
          </Button>
        }
      />

      <Stack spacing={3} sx={{ pb: 6 }}>
        {sendResult ? (
          <Alert
            severity="success"
            action={
              <Button
                component={Link}
                href={routes.messages}
                color="inherit"
                size="small"
                variant="outlined"
              >
                Lihat Log Pengiriman
              </Button>
            }
          >
            Pengiriman pesan manual berhasil dijadwalkan! Sebanyak{' '}
            <strong>{sendResult.queued_count}</strong> pesan telah masuk ke dalam antrean (Batch:{' '}
            <code>{sendResult.batch_ref}</code>).
          </Alert>
        ) : null}

        {/* Form Filter & Templat */}
        <Card sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
            Kriteria Penerima & Templat Pesan
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(12, 1fr)' },
              gap: 2,
            }}
          >
            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 6' } }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Pilih Templat Pesan"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : '')}
                disabled={loadingRefs}
                helperText={
                  templates.length === 0 && !loadingRefs
                    ? 'Belum ada templat pesan aktif. Buat di menu Template Pesan.'
                    : 'Pesan akan diformat menggunakan templat ini.'
                }
              >
                {templates.map((tpl) => (
                  <MenuItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 3' } }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Program Studi"
                value={studyProgram}
                onChange={(e) => setStudyProgram(e.target.value)}
              >
                <MenuItem value="">Semua Program Studi</MenuItem>
                {filterOptions.study_programs.map((prog) => (
                  <MenuItem key={prog} value={prog}>
                    {prog}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 3' } }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Angkatan"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
              >
                <MenuItem value="">Semua Angkatan</MenuItem>
                {filterOptions.cohorts.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 3' } }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status Tagihan"
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value)}
              >
                <MenuItem value="unpaid">Belum Lunas (Unpaid)</MenuItem>
                <MenuItem value="all">Semua Status</MenuItem>
                <MenuItem value="paid">Sudah Lunas (Paid)</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 3' } }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Nominal Minimal (Rp)"
                placeholder="Contoh: 1000000"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 3' } }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Nominal Maksimal (Rp)"
                placeholder="Contoh: 5000000"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 12' } }}>
              <TextField
                fullWidth
                size="small"
                label="Pencarian Mahasiswa"
                placeholder="Cari berdasarkan nama mahasiswa, NIM, atau kode tagihan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltOutlinedIcon />}
              onClick={handleResetFilters}
            >
              Reset Filter
            </Button>
            <Button
              variant="contained"
              startIcon={
                loadingPreview ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <VisibilityOutlinedIcon />
                )
              }
              onClick={handleFetchPreview}
              disabled={!templateId || loadingPreview || loadingRefs}
            >
              Tampilkan Pratinjau
            </Button>
          </Stack>
        </Card>

        {/* Hasil Pratinjau */}
        {previewData ? (
          <Stack spacing={3}>
            {/* KPI Cards Ringkasan */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <Card sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Total Tagihan Cocok
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: 'text.primary' }}>
                  {previewData.total_matched}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Berdasarkan filter yang dipilih
                </Typography>
              </Card>

              <Card
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  borderTop: '3px solid',
                  borderColor: 'success.main',
                }}
              >
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  Siap Dikirim (Memenuhi Syarat)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: 'success.main' }}>
                  {previewData.eligible_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tagihan aktif, bukan opt-out, nomor valid
                </Typography>
              </Card>

              <Card
                sx={{
                  p: 2,
                  height: '100%',
                  borderTop: '3px solid',
                  borderColor: 'warning.main',
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                    Dikecualikan
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {previewData.excluded_count}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}
                >
                  <Chip size="small" label={`Lunas: ${previewData.excluded_breakdown.paid}`} />
                  <Chip
                    size="small"
                    label={`Opt-out: ${previewData.excluded_breakdown.opted_out}`}
                  />
                  <Chip
                    size="small"
                    label={`Dispensasi: ${previewData.excluded_breakdown.exempt}`}
                  />
                  <Chip
                    size="small"
                    label={`No. HP Invalid: ${previewData.excluded_breakdown.invalid_phone}`}
                  />
                  <Chip
                    size="small"
                    label={`Sudah dalam antrean: ${previewData.excluded_breakdown.already_queued}`}
                  />
                </Stack>
              </Card>
            </Box>

            {/* Split Grid & WhatsApp Mockup */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              {/* Kolom Kiri: Tabel Calon Penerima */}
              <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 600 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Daftar Penerima
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Centang penerima yang ingin dikirimi pesan manual.
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DoneAllOutlinedIcon />}
                      onClick={handleSelectAllEligible}
                      disabled={previewData.eligible_count === 0}
                    >
                      Pilih Semua yang Siap
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      variant="outlined"
                      startIcon={<RemoveDoneOutlinedIcon />}
                      onClick={handleDeselectAll}
                      disabled={selectedCount === 0}
                    >
                      Hapus Pilihan
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <AppDataGrid<GridItem> rows={gridRows} columns={columns} />
                </Box>
              </Card>

              {/* Kolom Kanan: Simulasi WhatsApp */}
              <Card sx={{ p: 2, height: 600, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Pratinjau Pesan WhatsApp
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                  Simulasi tampilan pesan yang dikirimkan ke calon penerima pertama.
                </Typography>

                {previewData.sample_preview ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : '#E5DDD5',
                    }}
                  >
                    {/* WA Header */}
                    <Box
                      sx={{
                        bgcolor: theme.palette.mode === 'dark' ? '#1F2C34' : '#075E54',
                        color: '#FFFFFF',
                        px: 2,
                        py: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <WhatsAppIcon sx={{ fontSize: 28 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: '#FFFFFF' }}
                          noWrap
                        >
                          {previewData.sample_preview.student_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.8)' }}
                          noWrap
                        >
                          {previewData.sample_preview.phone_masked ?? 'Tidak ada nomor'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* WA Chat Body */}
                    <Box
                      sx={{
                        flex: 1,
                        p: 2,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          alignSelf: 'flex-start',
                          maxWidth: '90%',
                          p: 1.5,
                          borderRadius: '8px 8px 8px 0px',
                          bgcolor: theme.palette.mode === 'dark' ? '#005C4B' : '#FFFFFF',
                          color: theme.palette.mode === 'dark' ? '#E9EDEF' : '#111B21',
                          boxShadow: '0 1px 1px rgba(0,0,0,0.13)',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: 13,
                            lineHeight: 1.5,
                          }}
                        >
                          {previewData.sample_preview.body}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      textAlign: 'center',
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada data penerima yang memenuhi syarat untuk menampilkan contoh pesan.
                    </Typography>
                  </Box>
                )}
              </Card>
            </Box>

            {/* Bottom Execution Bar */}
            <Card
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {selectedCount > 0
                    ? `${selectedCount} mahasiswa siap dikirimkan pesan manual.`
                    : 'Pilih minimal satu penerima dari tabel di atas.'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pesan akan dimasukkan ke antrean pengiriman WhatsApp dan dikirim sesuai jadwal
                  operasional.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<SendOutlinedIcon />}
                disabled={selectedCount === 0 || sending}
                onClick={() => setConfirmOpen(true)}
              >
                {sending ? 'Mengirim...' : `Eksekusi Pengiriman (${selectedCount})`}
              </Button>
            </Card>
          </Stack>
        ) : null}
      </Stack>

      <AppConfirmDialog
        open={confirmOpen}
        title="Konfirmasi Pengiriman Pesan Manual"
        message={`Apakah Anda yakin ingin mengirim pesan penagihan manual ke ${selectedCount} mahasiswa terpilih? Pesan akan langsung dimasukkan ke dalam antrean pengiriman WhatsApp.`}
        confirmText={sending ? 'Memproses...' : 'Kirim Sekarang'}
        cancelText="Batal"
        onConfirm={handleConfirmSend}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
};
