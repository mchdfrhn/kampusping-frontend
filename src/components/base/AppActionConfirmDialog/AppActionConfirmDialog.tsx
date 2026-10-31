'use client';

import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { appDialogActionsSx } from '@/components/base/AppDialog/appDialogActionsStyles';
import { invokeAsyncAction } from '@/core/utils/async-action.util';
import { formatOptionalText } from '@/core/utils/display.util';

export type ActionConfirmSummaryRow = {
  label: string;
  value?: ReactNode;
  emphasize?: boolean;
};

export type ActionConfirmSummary = {
  rows?: ActionConfirmSummaryRow[];
};

export type AppActionConfirmDialogProps = Omit<DialogProps, 'children'> & {
  title: string;
  message: string;
  summary?: ActionConfirmSummary | ActionConfirmSummaryRow[] | null;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'error' | 'primary' | 'success';
  loading?: boolean;
  notesLabel?: string;
  notesRequired?: boolean;
  notesPlaceholder?: string;
  initialNotes?: string;
  showNotes?: boolean;
  onConfirm: (notes?: string) => void | Promise<void>;
};

const emphasizedValueSx = {
  color: 'primary.main',
  fontSize: 14,
  fontWeight: 700,
};

const normalizeSummaryRows = (
  summary?: ActionConfirmSummary | ActionConfirmSummaryRow[] | null,
): ActionConfirmSummaryRow[] => {
  if (!summary) return [];
  const rows = Array.isArray(summary) ? summary : (summary.rows ?? []);
  return rows.filter((row) => formatOptionalText(row.value));
};

const ActionConfirmSummaryPanel = ({ rows }: { rows: ActionConfirmSummaryRow[] }) => {
  const items = useMemo(() => rows, [rows]);
  if (!items.length) return null;

  return (
    <TableContainer
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 2,
        overflow: 'hidden',
      }}
    >
      <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.label}>
              <TableCell
                component="th"
                sx={{
                  bgcolor: 'background.default',
                  color: 'text.secondary',
                  fontWeight: 700,
                  verticalAlign: 'top',
                  whiteSpace: 'nowrap',
                  width: 180,
                }}
              >
                {row.label}
              </TableCell>
              <TableCell sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                {row.emphasize ? (
                  <Typography component="span" sx={emphasizedValueSx}>
                    {row.value}
                  </Typography>
                ) : (
                  row.value
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const AppActionConfirmDialog = ({
  title,
  message,
  summary,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmColor,
  loading = false,
  notesLabel = 'Catatan',
  notesRequired = false,
  notesPlaceholder = 'Catatan (opsional)',
  initialNotes = '',
  showNotes = true,
  onClose,
  onConfirm,
  maxWidth,
  fullWidth = true,
  open,
  ...props
}: AppActionConfirmDialogProps) => {
  const [notes, setNotes] = useState(initialNotes);
  const [submitting, setSubmitting] = useState(false);
  const summaryRows = normalizeSummaryRows(summary);

  // Start every opening with fresh notes. Adjusting state during render (rather than in an effect)
  // avoids painting the previous dialog's text for one frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setNotes(initialNotes);
  }

  const isRejectAction = confirmText.toLowerCase().includes('reject');
  const resolvedConfirmColor = confirmColor ?? (isRejectAction ? 'error' : 'primary');
  const resolvedMaxWidth = maxWidth ?? (summaryRows.length ? 'md' : 'xs');
  const isBusy = loading || submitting;

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isBusy) return;
    onClose?.(event, 'backdropClick');
  };

  const handleConfirm = async () => {
    if (isBusy) return;
    const trimmed = notes.trim();
    if (notesRequired && !trimmed) return;

    setSubmitting(true);
    try {
      await invokeAsyncAction(onConfirm, [trimmed || undefined]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      {...props}
      open={open}
      fullWidth={fullWidth}
      maxWidth={resolvedMaxWidth}
      onClose={isBusy ? undefined : onClose}
    >
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700, py: 1.5 }}>{title}</DialogTitle>
      <Divider />

      <DialogContent dividers sx={{ py: 2.5 }}>
        {summaryRows.length ? <ActionConfirmSummaryPanel rows={summaryRows} /> : null}
        <Typography
          sx={{ color: 'text.primary', fontSize: 14, lineHeight: 1.6, mb: showNotes ? 2 : 0 }}
        >
          {message}
        </Typography>
        {showNotes ? (
          <TextField
            disabled={isBusy}
            fullWidth
            label={notesLabel}
            multiline
            minRows={3}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={notesPlaceholder}
            required={notesRequired}
            size="small"
            value={notes}
          />
        ) : null}
      </DialogContent>

      <Divider />
      <DialogActions sx={appDialogActionsSx}>
        <AppDialogCancelButton
          disabled={isBusy}
          label={cancelText}
          onClick={handleClose}
          variant="outlined"
        />
        <AppDialogConfirmButton
          color={resolvedConfirmColor}
          disabled={isBusy || (notesRequired && !notes.trim())}
          label={confirmText}
          loading={isBusy}
          onClick={() => void handleConfirm()}
          showCheckIcon={!isRejectAction}
          showRejectIcon={isRejectAction}
        />
      </DialogActions>
    </Dialog>
  );
};
