'use client';

import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';

export type ExportFormat = 'excel' | 'pdf';

type Props = {
  disabled?: boolean;
  onExport: (format: ExportFormat) => Promise<void>;
};

export const ExportDataButton = ({ disabled = false, onExport }: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClose = () => {
    if (!exporting) setAnchorEl(null);
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      await onExport(format);
      setAnchorEl(null);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        disabled={disabled || exporting}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={exporting ? <CircularProgress color="inherit" size={16} /> : <IosShareOutlinedIcon />}
        sx={{
          bgcolor: '#ede9fe',
          borderRadius: 1,
          color: '#7c3aed',
          minWidth: 136,
          px: 2,
        }}
      >
        Export Data
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem disabled={exporting} onClick={() => void handleExport('excel')}>
          <ListItemIcon>
            <TableViewOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Excel</ListItemText>
        </MenuItem>
        <MenuItem disabled={exporting} onClick={() => void handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdfOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export PDF</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
