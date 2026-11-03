'use client';

import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridValidRowModel,
} from '@mui/x-data-grid';
import { idID } from '@mui/x-data-grid/locales';
import { useMemo } from 'react';

import { surfaceTokens } from '@/design-system/tokens/surface.token';

export type AppDataGridProps<R extends GridValidRowModel = GridValidRowModel> = Omit<
  DataGridProps<R>,
  'disableRowSelectionOnClick' | 'density' | 'pageSizeOptions' | 'components' | 'componentsProps'
> & {
  columns: GridColDef<R>[];
  pageSizeOptions?: number[];
  /** When true, columns expand to container width when they fit and scroll horizontally when they overflow. */
  fillWidth?: boolean;
};

export const AppDataGrid = <R extends GridValidRowModel = GridValidRowModel>({
  columns,
  pageSizeOptions = [20, 50, 100],
  fillWidth = false,
  sx,
  localeText,
  ...props
}: AppDataGridProps<R>) => {
  const normalizedColumns = useMemo(() => {
    const cols = columns || [];

    return cols.map((col) => {
      const withFixedWidth =
        col.flex === undefined && (col.width !== undefined || col.minWidth !== undefined)
          ? { ...col, flex: 0 as const }
          : col;

      return withFixedWidth;
    });
  }, [columns]);

  return (
    <DataGrid
      {...props}
      columns={normalizedColumns}
      columnHeaderHeight={props.columnHeaderHeight ?? 44}
      density="standard"
      disableRowSelectionOnClick
      disableVirtualization
      pageSizeOptions={pageSizeOptions}
      scrollbarSize={10}
      sx={{
        width: '100%',
        height: '100%',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        border: '1px solid',
        borderColor: 'divider',
        '& .MuiDataGrid-columnHeaders': {
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: '44px !important',
        },
        '& .MuiDataGrid-columnHeader': {
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: '44px !important',
          maxHeight: '44px !important',
        },
        '& .MuiDataGrid-columnHeader--last': {
          overflow: 'hidden',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 600,
        },
        '& .MuiDataGrid-row:nth-of-type(even), & .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell':
          {
            bgcolor: surfaceTokens.zebra,
          },
        '& .MuiDataGrid-row:hover, & .MuiDataGrid-row:hover .MuiDataGrid-cell': {
          bgcolor: surfaceTokens.hover,
        },
        '& .MuiDataGrid-main': {
          overflowX: 'auto',
          flex: 1,
          minHeight: 0,
        },
        '& .MuiDataGrid-filler--horizontal': {
          width: '0px !important',
          minWidth: '0px !important',
          flex: '1 1 0px',
        },
        '& .MuiDataGrid-virtualScroller': {
          overflowY: 'auto !important',
          overflowX: 'auto !important',
          msOverflowStyle: 'auto',
          scrollbarColor: `${surfaceTokens.scrollbarThumb} ${surfaceTokens.scrollbarTrack}`,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            display: 'block',
            height: 8,
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: surfaceTokens.scrollbarTrack,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: surfaceTokens.scrollbarThumb,
            borderRadius: 999,
          },
          '&::-webkit-scrollbar-corner': {
            background: surfaceTokens.scrollbarTrack,
          },
        },
        '& .MuiDataGrid-virtualScrollerContent': {
          pb: 0,
          width: 'var(--DataGrid-columnsTotalWidth) !important',
          ...(fillWidth
            ? {
                minWidth: '100% !important',
              }
            : {}),
        },
        '& .MuiDataGrid-columnHeaders, & .MuiDataGrid-row, & .MuiDataGrid-filler:not(.MuiDataGrid-filler--horizontal)':
          {
            width: 'var(--DataGrid-columnsTotalWidth)',
            ...(fillWidth
              ? {
                  minWidth: '100%',
                }
              : {}),
          },
        '& .MuiDataGrid-cell': {
          display: 'flex',
          alignItems: 'center',
        },
        '& .MuiDataGrid-cellContent': {
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
          {
            outline: 'none !important',
          },
        '& .MuiDataGrid-cell .MuiIconButton-root:focus, & .MuiDataGrid-cell .MuiIconButton-root:focus-visible':
          {
            outline: 'none !important',
          },
        '& .MuiDataGrid-footerContainer': {
          minHeight: 52,
        },
        '& .MuiTablePagination-toolbar': {
          alignItems: 'center',
          minHeight: 52,
          py: 0,
        },
        '& .MuiTablePagination-spacer': {
          flex: 1,
        },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
          alignItems: 'center',
          display: 'inline-flex',
          height: 32,
          lineHeight: '32px',
          margin: 0,
        },
        '& .MuiTablePagination-input': {
          alignItems: 'center',
          display: 'inline-flex',
          height: 32,
          marginBottom: 0,
          marginTop: 0,
        },
        '& .MuiTablePagination-select': {
          alignItems: 'center',
          display: 'inline-flex',
          height: 32,
          lineHeight: '32px',
          paddingBottom: 0,
          paddingTop: 0,
        },
        '& .MuiTablePagination-selectIcon': {
          top: '50%',
          transform: 'translateY(-50%)',
        },
        '& .MuiTablePagination-actions': {
          alignItems: 'center',
          display: 'inline-flex',
          height: 32,
          marginLeft: 1,
        },
        '& .MuiTablePagination-actions .MuiIconButton-root': {
          height: 32,
          padding: 0.5,
          width: 32,
        },
        ...sx,
      }}
      localeText={
        {
          ...idID.components.MuiDataGrid.defaultProps.localeText,
          // The bundled Indonesian locale has typos in these two strings.
          noRowsLabel: 'Tidak ada data',
          noColumnsOverlayManageColumns: 'Kelola kolom',
          ...localeText,
          MuiTablePagination: {
            labelDisplayedRows: ({
              from,
              to,
              count,
            }: {
              from: number;
              to: number;
              count: number;
            }) => `${from}-${to} dari ${count} data`,
            ...(localeText as { MuiTablePagination?: object } | undefined)?.MuiTablePagination,
          },
        } as DataGridProps<R>['localeText']
      }
    />
  );
};
