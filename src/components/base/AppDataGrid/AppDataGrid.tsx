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
  /** When true, columns expand to container width and hide unnecessary horizontal scroll. */
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
    const lastIdx = Math.max(0, cols.length - 1);

    return cols.map((col, idx) => {
      const field = String(col.field ?? '');
      const isAction =
        field === '__actions__' || field === '__action__' || field.startsWith('__action');

      const withFixedWidth =
        col.flex === undefined && (col.width !== undefined || col.minWidth !== undefined)
          ? { ...col, flex: 0 as const }
          : col;

      if (!isAction) return withFixedWidth;

      const stickyClass =
        idx === 0 ? 'dg-sticky-left-actions' : idx === lastIdx ? 'dg-sticky-actions' : '';

      return {
        ...withFixedWidth,
        flex: withFixedWidth.flex ?? 0,
        headerClassName: [withFixedWidth.headerClassName, stickyClass].filter(Boolean).join(' '),
        cellClassName: [withFixedWidth.cellClassName, stickyClass].filter(Boolean).join(' '),
      };
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
        minWidth: 0,
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
        '& .MuiDataGrid-cell.dg-sticky-actions, & .MuiDataGrid-cell.dg-sticky-left-actions': {
          bgcolor: 'background.paper',
        },
        '& .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell.dg-sticky-actions, & .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell.dg-sticky-left-actions':
          {
            bgcolor: surfaceTokens.zebra,
          },
        '& .MuiDataGrid-row:hover .MuiDataGrid-cell.dg-sticky-actions, & .MuiDataGrid-row:hover .MuiDataGrid-cell.dg-sticky-left-actions':
          {
            bgcolor: surfaceTokens.hover,
          },
        '& .MuiDataGrid-columnHeader.dg-sticky-actions': {
          position: 'sticky',
          right: 0,
          zIndex: 3,
          bgcolor: 'background.paper',
          boxShadow: '-8px 0 8px -8px rgba(0,0,0,0.20)',
        },
        '& .MuiDataGrid-cell.dg-sticky-actions': {
          position: 'sticky',
          right: 0,
          zIndex: 2,
          boxShadow: '-8px 0 8px -8px rgba(0,0,0,0.12)',
        },
        '& .MuiDataGrid-columnHeader.dg-sticky-left-actions': {
          position: 'sticky',
          left: 0,
          zIndex: 3,
          bgcolor: 'background.paper',
          boxShadow: '8px 0 8px -8px rgba(0,0,0,0.20)',
          flexShrink: 0,
        },
        '& .MuiDataGrid-cell.dg-sticky-left-actions': {
          position: 'sticky',
          left: 0,
          zIndex: 2,
          boxShadow: '8px 0 8px -8px rgba(0,0,0,0.12)',
          flexShrink: 0,
          overflow: 'visible',
        },
        '& .MuiDataGrid-main': {
          overflowX: 'auto',
        },
        // Hide MUI overlay scrollbars; use native scrollbars on the scroller instead.
        '& .MuiDataGrid-scrollbar': {
          display: 'none !important',
        },
        '& .MuiDataGrid-virtualScroller': {
          overflowY: 'auto !important',
          overflowX: fillWidth ? 'hidden !important' : 'auto !important',
          msOverflowStyle: 'auto',
          scrollbarColor: `${surfaceTokens.scrollbarThumb} ${surfaceTokens.scrollbarTrack}`,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            display: 'block',
            height: 10,
            width: 10,
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
          ...(fillWidth
            ? {
                minWidth: '100% !important',
                width: '100% !important',
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
