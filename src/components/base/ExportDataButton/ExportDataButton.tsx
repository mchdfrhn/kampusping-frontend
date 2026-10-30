'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { ReactNode } from 'react';
import { useState } from 'react';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

const FORMATS: Record<ExportFormat, { label: string; icon: ReactNode }> = {
  csv: { label: 'CSV', icon: <TableViewOutlinedIcon fontSize="small" /> },
  excel: { label: 'Excel', icon: <TableViewOutlinedIcon fontSize="small" /> },
  pdf: { label: 'PDF', icon: <PictureAsPdfOutlinedIcon fontSize="small" /> },
};

type Props = {
  /** Offered formats. A single format renders a plain button; several open a menu. */
  formats?: ExportFormat[];
  disabled?: boolean;
  onExport: (format: ExportFormat) => Promise<void>;
};

export const ExportDataButton = ({ formats = ['csv'], disabled = false, onExport }: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  const run = async (format: ExportFormat) => {
    setExporting(true);
    try {
      await onExport(format);
      setAnchorEl(null);
    } finally {
      setExporting(false);
    }
  };

  const single = formats.length === 1 ? formats[0] : null;

  return (
    <>
      <Button
        color="inherit"
        disabled={disabled || exporting}
        onClick={(event) => (single ? void run(single) : setAnchorEl(event.currentTarget))}
        startIcon={
          exporting ? <CircularProgress color="inherit" size={16} /> : <FileDownloadOutlinedIcon />
        }
        sx={{ borderColor: 'divider', minWidth: 120 }}
        variant="outlined"
      >
        {single ? `Export ${FORMATS[single].label}` : 'Export'}
      </Button>
      {single ? null : (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => !exporting && setAnchorEl(null)}
        >
          {formats.map((format) => (
            <MenuItem key={format} disabled={exporting} onClick={() => void run(format)}>
              <ListItemIcon>{FORMATS[format].icon}</ListItemIcon>
              <ListItemText>Export {FORMATS[format].label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};
