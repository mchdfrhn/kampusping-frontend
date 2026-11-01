'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppDialog } from '@/components/base/AppDialog';
import { AppDialogCancelButton } from '@/components/base/AppDialog/AppDialogActions';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { formatDisplayDate, formatDisplayDateTime } from '@/core/utils/date.util';

import { CANCEL_REASON_LABELS, MESSAGE_STATUS_LABELS, MESSAGE_STATUS_TONES } from '../constants';
import type { MessageRecord } from '../types';

type Props = {
  message: MessageRecord | null;
  onClose: () => void;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography color="text.secondary" variant="caption" component="dt">
      {label}
    </Typography>
    <Typography variant="body2" component="dd" sx={{ m: 0 }}>
      {value}
    </Typography>
  </Box>
);

/** Read-only view of one log entry: the text exactly as rendered, plus its timestamps. */
export const MessageBodyDialog = ({ message, onClose }: Props) => (
  <AppDialog
    open={Boolean(message)}
    onClose={onClose}
    title="Isi pesan"
    maxWidth="sm"
    fullWidth
    actions={<AppDialogCancelButton label="Tutup" onClick={onClose} variant="outlined" />}
  >
    {message ? (
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600 }}>
            {message.student.name} ({message.student.nim})
          </Typography>
          <AppStatusChip
            status={MESSAGE_STATUS_TONES[message.status]}
            label={MESSAGE_STATUS_LABELS[message.status]}
          />
        </Stack>

        <Box
          component="pre"
          aria-label="Isi pesan"
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: 13,
            m: 0,
            maxHeight: 320,
            overflow: 'auto',
            p: 1.5,
            overflowWrap: 'anywhere',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.body}
        </Box>

        <Box
          component="dl"
          sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(2, 1fr)', m: 0 }}
        >
          <Field label="Jadwal" value={formatDisplayDate(message.scheduled_date)} />
          <Field label="Percobaan" value={String(message.attempts)} />
          <Field label="Waktu antre" value={formatDisplayDateTime(message.queued_at)} />
          <Field label="Dikirim" value={formatDisplayDateTime(message.sent_at)} />
          <Field label="Diterima" value={formatDisplayDateTime(message.delivered_at)} />
          <Field label="Dibaca" value={formatDisplayDateTime(message.read_at)} />
          {message.cancel_reason ? (
            <Field
              label="Alasan pembatalan"
              value={CANCEL_REASON_LABELS[message.cancel_reason] ?? message.cancel_reason}
            />
          ) : null}
          {message.error ? <Field label="Galat" value={message.error} /> : null}
        </Box>
      </Stack>
    ) : null}
  </AppDialog>
);
