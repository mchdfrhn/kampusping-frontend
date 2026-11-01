'use client';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { GridColDef } from '@mui/x-data-grid';

import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';

import { IMPORT_SOURCE_LABELS, IMPORT_STATUS_LABELS } from '../constants';
import { importService } from '../services/import.service';
import type { ImportBatch, ImportStatus } from '../types';

const DEFAULT_SORT = { field: 'created_at', order: 'desc' } as const;

const STATUS_COLOR: Record<ImportStatus, 'info' | 'success' | 'default'> = {
  preview: 'info',
  applied: 'success',
  discarded: 'default',
};

type Props = {
  /** Called when the user opens an import that is still a preview. */
  onOpenPreview: (batch: ImportBatch) => void;
};

export const ImportHistory = ({ onOpenPreview }: Props) => {
  const notify = useNotify();
  const grid = useServerGrid<ImportBatch>({
    fetcher: importService.list,
    defaultSort: DEFAULT_SORT,
    onError: notify.error,
  });

  const columns: GridColDef<ImportBatch>[] = [
    { field: 'file_name', headerName: 'File', minWidth: 200, flex: 1.2 },
    {
      field: 'source',
      headerName: 'Sumber',
      minWidth: 140,
      flex: 0.6,
      sortable: false,
      valueGetter: (_value, row) => IMPORT_SOURCE_LABELS[row.source],
    },
    {
      field: 'semester',
      headerName: 'Semester',
      minWidth: 110,
      flex: 0.5,
      sortable: false,
      valueFormatter: (value) => (value ? String(value) : '-'),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 130,
      flex: 0.5,
      renderCell: ({ row }) => (
        <AppStatusChip status={STATUS_COLOR[row.status]} label={IMPORT_STATUS_LABELS[row.status]} />
      ),
    },
    {
      field: 'rows_valid',
      headerName: 'Baris valid',
      minWidth: 110,
      flex: 0.4,
      sortable: false,
      valueGetter: (_value, row) => row.summary.rows_valid,
    },
    {
      field: 'rows_error',
      headerName: 'Baris bermasalah',
      minWidth: 150,
      flex: 0.5,
      sortable: false,
      valueGetter: (_value, row) => row.summary.rows_error,
    },
    {
      field: 'created_by',
      headerName: 'Dibuat oleh',
      minWidth: 170,
      flex: 0.8,
      sortable: false,
      valueFormatter: (value) => (value ? String(value) : '-'),
    },
    {
      field: 'created_at',
      headerName: 'Dibuat pada',
      minWidth: 170,
      flex: 0.7,
      valueFormatter: (value) => formatDisplayDateTime(value ? String(value) : null),
    },
    {
      field: '__actions__',
      headerName: 'Aksi',
      sortable: false,
      filterable: false,
      width: getActionColumnWidth(1),
      renderCell: ({ row }) =>
        row.status === 'preview' ? (
          <Tooltip title="Buka pratinjau">
            <IconButton
              aria-label={`Buka pratinjau ${row.file_name}`}
              size="small"
              sx={gridActionButtonSx.view}
              onClick={(event) => {
                event.stopPropagation(); // the row click would open it a second time
                onOpenPreview(row);
              }}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null,
    },
  ];

  return (
    <Card component="section" aria-label="Riwayat impor" sx={{ p: 2.5 }}>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography component="h2" variant="h6">
            Riwayat impor
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Klik impor berstatus Pratinjau untuk membukanya kembali dan menerapkannya.
          </Typography>
        </Box>
        <Button
          color="inherit"
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => void grid.reload()}
          sx={{ borderColor: 'divider' }}
        >
          Muat ulang
        </Button>
      </Box>
      <Box sx={{ height: 440 }}>
        <AppDataGrid
          columns={columns}
          fillWidth
          rowHeight={52}
          getRowId={(row: ImportBatch) => row.id}
          getRowClassName={({ row }) => (row.status === 'preview' ? 'import-row-openable' : '')}
          onRowClick={({ row }) => {
            if (row.status === 'preview') onOpenPreview(row);
          }}
          sx={{ '& .import-row-openable': { cursor: 'pointer' } }}
          {...grid.gridProps}
        />
      </Box>
    </Card>
  );
};
