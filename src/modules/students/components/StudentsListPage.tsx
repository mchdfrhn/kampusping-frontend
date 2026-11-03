'use client';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppSearchField } from '@/components/base/AppSearchField';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { useDebounce } from '@/core/hooks/useDebounce';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { SEARCH_DEBOUNCE_MS } from '@/core/constants/app.constant';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDate, formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';

import {
  OPTED_OUT_NO,
  OPTED_OUT_YES,
  PHONE_STATUS_LABELS,
  PHONE_STATUS_OPTIONS,
  PHONE_STATUS_TONES,
} from '../constants';
import { studentsService } from '../services/students.service';
import type { PhoneStatus, StudentFilters, StudentRecord } from '../types';
import { PhoneDialog } from './PhoneDialog';

const DEFAULT_SORT = { field: 'updated_at', order: 'desc' } as const;

export const StudentsListPage = () => {
  const notify = useNotify();
  const canUpdate = usePermission(permissions.studentsUpdate);

  const [studyProgram, setStudyProgram] = useState('');
  const [cohort, setCohort] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus | ''>('');
  const [editing, setEditing] = useState<StudentRecord | null>(null);

  // Typing in a text filter should not fire one request per keystroke.
  const debouncedProgram = useDebounce(studyProgram.trim(), SEARCH_DEBOUNCE_MS);
  const debouncedCohort = useDebounce(cohort.trim(), SEARCH_DEBOUNCE_MS);

  const filters = useMemo<StudentFilters>(
    () => ({
      study_program: debouncedProgram || undefined,
      cohort: debouncedCohort || undefined,
      phone_status: phoneStatus || undefined,
    }),
    [debouncedProgram, debouncedCohort, phoneStatus],
  );

  const grid = useServerGrid<StudentRecord, StudentFilters>({
    fetcher: studentsService.list,
    defaultSort: DEFAULT_SORT,
    filters,
    onError: notify.error,
  });

  const handleUpdatePhone = async (phone: string) => {
    if (!editing) return;
    await studentsService.updatePhone(editing.id, phone);
    notify.success('Nomor WhatsApp diperbarui.');
    setEditing(null);
    await grid.reload();
  };

  const columns = useMemo<GridColDef<StudentRecord>[]>(() => {
    const base: GridColDef<StudentRecord>[] = [
      { field: 'nim', headerName: 'NIM', minWidth: 105, flex: 0.6 },
      { field: 'name', headerName: 'Nama', minWidth: 150, flex: 1.2 },
      {
        field: 'study_program',
        headerName: 'Prodi',
        minWidth: 140,
        flex: 1.0,
        valueFormatter: (value) => (value ? String(value) : '-'),
      },
      {
        field: 'cohort',
        headerName: 'Angkatan',
        minWidth: 80,
        flex: 0.4,
        valueFormatter: (value) => (value ? String(value) : '-'),
      },
      {
        field: 'phone',
        headerName: 'No. WhatsApp',
        minWidth: 135,
        flex: 0.7,
        sortable: false,
        valueFormatter: (value) => (value ? String(value) : '-'),
      },
      {
        field: 'phone_status',
        headerName: 'Status nomor',
        minWidth: 110,
        flex: 0.5,
        sortable: false,
        renderCell: ({ row }) => (
          <AppStatusChip
            status={PHONE_STATUS_TONES[row.phone_status]}
            label={PHONE_STATUS_LABELS[row.phone_status]}
          />
        ),
      },
      {
        field: 'opted_out_at',
        headerName: 'Opt-out',
        minWidth: 90,
        flex: 0.4,
        sortable: false,
        valueGetter: (_value, row) =>
          row.opted_out_at
            ? `${OPTED_OUT_YES} (${formatDisplayDate(row.opted_out_at)})`
            : OPTED_OUT_NO,
      },
      {
        field: 'updated_at',
        headerName: 'Diperbarui',
        minWidth: 130,
        flex: 0.7,
        valueFormatter: (value) => formatDisplayDateTime(value ? String(value) : null),
      },
    ];
    if (!canUpdate) return base;

    return [
      ...base,
      {
        field: '__actions__',
        headerName: 'Aksi',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(1),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title="Ubah nomor">
              <IconButton
                aria-label={`Ubah nomor ${row.nim}`}
                size="small"
                sx={gridActionButtonSx.edit}
                onClick={() => setEditing(row)}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ];
  }, [canUpdate]);

  return (
    <>
      <PageHeader
        title="Mahasiswa"
        description="Data mahasiswa dari impor SIAKAD/Civitas dan SIPEMA, termasuk nomor WhatsApp dan status berhenti berlangganan."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Mahasiswa' }]}
        actions={
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => void grid.reload()}
            sx={{ borderColor: 'divider' }}
          >
            Muat ulang
          </Button>
        }
      />

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
          <AppSearchField
            placeholder="Cari NIM atau nama"
            value={grid.search}
            onChange={grid.setSearch}
          />
          <TextField
            label="Prodi"
            value={studyProgram}
            onChange={(event) => setStudyProgram(event.target.value)}
            sx={{ width: 200 }}
            slotProps={{ htmlInput: { maxLength: 150 } }}
          />
          <TextField
            label="Angkatan"
            value={cohort}
            onChange={(event) => setCohort(event.target.value)}
            sx={{ width: 120 }}
            slotProps={{ htmlInput: { maxLength: 20 } }}
          />
          <TextField
            select
            label="Status nomor"
            value={phoneStatus}
            onChange={(event) => setPhoneStatus(event.target.value as PhoneStatus | '')}
            sx={{ width: 180 }}
          >
            <MenuItem value="">Semua</MenuItem>
            {PHONE_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
          <AppDataGrid
            columns={columns}
            fillWidth
            rowHeight={52}
            getRowId={(row: StudentRecord) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <PhoneDialog
        open={Boolean(editing)}
        student={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdatePhone}
      />
    </>
  );
};
