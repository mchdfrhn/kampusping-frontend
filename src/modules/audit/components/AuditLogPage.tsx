'use client';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import { AppDataGrid } from '@/components/base/AppDataGrid';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { routes } from '@/core/config/route.config';
import { SEARCH_DEBOUNCE_MS } from '@/core/constants/app.constant';
import { useDebounce } from '@/core/hooks/useDebounce';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';

import { AUDIT_SORT_FIELD } from '../constants';
import { auditService } from '../services/audit.service';
import type { AuditEventRecord, AuditFilters } from '../types';
import { AuditDetailDialog } from './AuditDetailDialog';

const DEFAULT_SORT = { field: AUDIT_SORT_FIELD, order: 'desc' } as const;

const columns: GridColDef<AuditEventRecord>[] = [
  {
    field: AUDIT_SORT_FIELD,
    headerName: 'Waktu',
    minWidth: 170,
    flex: 0.6,
    valueFormatter: (value) => formatDisplayDateTime(value ? String(value) : null),
  },
  { field: 'actor', headerName: 'Pelaku', minWidth: 200, flex: 0.9, sortable: false },
  {
    field: 'action',
    headerName: 'Aksi',
    minWidth: 190,
    flex: 0.8,
    sortable: false,
    renderCell: ({ row }) => (
      <Chip label={row.action} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
    ),
  },
  { field: 'entity', headerName: 'Entitas', minWidth: 150, flex: 0.6, sortable: false },
  {
    field: 'entity_id',
    headerName: 'ID entitas',
    minWidth: 110,
    flex: 0.4,
    sortable: false,
    valueFormatter: (value) => (value ? String(value) : '-'),
  },
];

export const AuditLogPage = () => {
  const notify = useNotify();

  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [viewing, setViewing] = useState<AuditEventRecord | null>(null);

  // Typing in a text filter should not fire one request per keystroke.
  const debouncedAction = useDebounce(action.trim(), SEARCH_DEBOUNCE_MS);
  const debouncedEntity = useDebounce(entity.trim(), SEARCH_DEBOUNCE_MS);
  const filters = useMemo<AuditFilters>(
    () => ({ action: debouncedAction || undefined, entity: debouncedEntity || undefined }),
    [debouncedAction, debouncedEntity],
  );

  const grid = useServerGrid<AuditEventRecord, AuditFilters>({
    fetcher: auditService.list,
    defaultSort: DEFAULT_SORT,
    filters,
    onError: notify.error,
  });

  const gridColumns = useMemo<GridColDef<AuditEventRecord>[]>(
    () => [
      ...columns,
      {
        field: '__detail__',
        headerName: 'Detail',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(1),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title="Lihat detail">
              <IconButton
                aria-label={`Lihat detail ${row.action} #${row.id}`}
                size="small"
                sx={gridActionButtonSx.view}
                onClick={() => setViewing(row)}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Log Audit"
        description="Jejak siapa mengubah apa dan kapan: impor, template, jadwal, pengaturan, dan lainnya."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Log Audit' }]}
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
          <TextField
            label="Aksi"
            placeholder="mis. import.applied"
            value={action}
            onChange={(event) => setAction(event.target.value)}
            sx={{ width: 240 }}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField
            label="Entitas"
            placeholder="mis. import_batch"
            value={entity}
            onChange={(event) => setEntity(event.target.value)}
            sx={{ width: 240 }}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
          <AppDataGrid
            columns={gridColumns}
            fillWidth
            rowHeight={52}
            getRowId={(row: AuditEventRecord) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <AuditDetailDialog event={viewing} onClose={() => setViewing(null)} />
    </>
  );
};
