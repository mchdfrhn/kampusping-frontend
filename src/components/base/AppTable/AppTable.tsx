import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';

export type AppTableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
};
export type AppTableProps<T> = {
  columns: AppTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
};

export const AppTable = <T,>({ columns, rows, getRowKey }: AppTableProps<T>) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableCell key={String(column.key)}>{column.label}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowKey(row)} hover>
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
