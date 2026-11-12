'use client';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { GridColDef } from '@mui/x-data-grid';
import { useEffect, useRef, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';

import {
  IMPORT_ROLLBACK_BLOCK_LABELS,
  IMPORT_SOURCE_LABELS,
  IMPORT_STATUS_LABELS,
} from '../constants';
import { importService } from '../services/import.service';
import type { ImportBatch, ImportStatus } from '../types';

const DEFAULT_SORT = { field: 'created_at', order: 'desc' } as const;

const STATUS_COLOR: Record<ImportStatus, 'info' | 'success' | 'warning' | 'default'> = {
  preview: 'info',
  applied: 'success',
  discarded: 'default',
  rolled_back: 'warning',
};

type Props = {
  /** Called when the user opens an import that is still a preview. */
  onOpenPreview: (batch: ImportBatch) => void;
  /** Whether the user holds `imports:rollback`; hides the rollback action otherwise. */
  canRollback?: boolean;
  /** Whether the user can delete non-applied/read-only batches (needs `imports:create`). */
  canDelete?: boolean;
  /** Called when the user asks to roll back an applied import. */
  onRollback?: (batch: ImportBatch) => void;
  /** Called after a batch is deleted from history. */
  onDeleted?: (batch: ImportBatch) => void;
  refreshTrigger?: number;
};

export const ImportHistory = ({
  onOpenPreview,
  canRollback = false,
  canDelete = false,
  onRollback,
  onDeleted,
  refreshTrigger,
}: Props) => {
  const notify = useNotify();
  const isFirstMount = useRef(true);
  const [deleteTarget, setDeleteTarget] = useState<ImportBatch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const grid = useServerGrid<ImportBatch>({
    fetcher: importService.list,
    defaultSort: DEFAULT_SORT,
    onError: notify.error,
  });
  const { reload } = grid;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    void reload();
  }, [refreshTrigger, reload]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const isApplied = deleteTarget.status === 'applied';
      await importService.delete(deleteTarget.id, isApplied);
      notify.success(
        deleteTarget.status === 'preview'
          ? 'Pratinjau impor dihapus.'
          : isApplied
            ? 'Riwayat dan data impor berhasil dihapus.'
            : 'Riwayat impor dihapus.',
      );
      onDeleted?.(deleteTarget);
      await reload();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal menghapus riwayat impor.'));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

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
      minWidth: 90,
      flex: 0.4,
      sortable: false,
      valueGetter: (_value, row) => row.summary.rows_valid,
    },
    {
      field: 'rows_error',
      headerName: 'Baris bermasalah',
      minWidth: 120,
      flex: 0.5,
      sortable: false,
      valueGetter: (_value, row) => row.summary.rows_error,
    },
    {
      field: 'created_by',
      headerName: 'Dibuat oleh',
      minWidth: 140,
      flex: 0.7,
      sortable: false,
      valueFormatter: (value) => (value ? String(value) : '-'),
    },
    {
      field: 'created_at',
      headerName: 'Dibuat pada',
      minWidth: 130,
      flex: 0.6,
      valueFormatter: (value) => formatDisplayDateTime(value ? String(value) : null),
    },
    {
      field: '__actions__',
      headerName: 'Aksi',
      sortable: false,
      filterable: false,
      width: getActionColumnWidth(2),
      renderCell: ({ row }) => {
        if (row.status === 'preview') {
          return (
            <Stack direction="row" spacing={0.5}>
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
              {canDelete ? (
                <Tooltip title="Hapus pratinjau">
                  <IconButton
                    aria-label={`Hapus pratinjau ${row.file_name}`}
                    size="small"
                    sx={gridActionButtonSx.delete}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTarget(row);
                    }}
                  >
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          );
        }
        if (row.status === 'applied') {
          const block = row.rollback_block;
          return (
            <Stack direction="row" spacing={0.5}>
              {canRollback ? (
                <Tooltip title={block ? IMPORT_ROLLBACK_BLOCK_LABELS[block] : 'Batalkan impor'}>
                  {/* a disabled button swallows pointer events, so the tooltip hangs on the wrapper */}
                  <span>
                    <IconButton
                      aria-label={`Batalkan impor ${row.file_name}`}
                      disabled={Boolean(block)}
                      size="small"
                      sx={gridActionButtonSx.delete}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRollback?.(row);
                      }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : null}
              {block && canDelete ? (
                <Tooltip title="Hapus paksa riwayat dan data impor">
                  <IconButton
                    aria-label={`Hapus paksa ${row.file_name}`}
                    size="small"
                    sx={gridActionButtonSx.delete}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTarget(row);
                    }}
                  >
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          );
        }
        if ((row.status === 'discarded' || row.status === 'rolled_back') && canDelete) {
          return (
            <Tooltip title="Hapus dari riwayat">
              <IconButton
                aria-label={`Hapus riwayat ${row.file_name}`}
                size="small"
                sx={gridActionButtonSx.delete}
                onClick={(event) => {
                  event.stopPropagation();
                  setDeleteTarget(row);
                }}
              >
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Card
      component="section"
      aria-label="Riwayat impor"
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        p: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography component="h2" variant="h6">
          Riwayat impor
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Klik impor berstatus Pratinjau untuk membukanya kembali dan menerapkannya.
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
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
      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.status === 'preview'
            ? 'Hapus pratinjau impor'
            : deleteTarget?.status === 'applied'
              ? 'Hapus paksa riwayat & data impor'
              : 'Hapus riwayat impor'
        }
        message={
          deleteTarget?.status === 'preview'
            ? `Hapus pratinjau impor "${deleteTarget.file_name}"? Berkas ini belum diterapkan dan akan dihapus dari riwayat.`
            : deleteTarget?.status === 'applied'
              ? `Impor "${deleteTarget.file_name}" berstatus Diterapkan${
                  deleteTarget.rollback_block
                    ? ` (${IMPORT_ROLLBACK_BLOCK_LABELS[deleteTarget.rollback_block]})`
                    : ''
                }. Hapus paksa riwayat impor ini beserta datanya dari sistem?`
              : `Hapus riwayat impor "${deleteTarget?.file_name}" dari daftar?`
        }
        confirmText={deleteTarget?.status === 'applied' ? 'Hapus paksa' : 'Hapus'}
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Card>
  );
};
