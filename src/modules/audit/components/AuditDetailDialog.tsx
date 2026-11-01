'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppDialog } from '@/components/base/AppDialog';
import { AppDialogCancelButton } from '@/components/base/AppDialog/AppDialogActions';
import { formatDisplayDateTime } from '@/core/utils/date.util';

import type { AuditEventRecord } from '../types';

type Props = {
  event: AuditEventRecord | null;
  onClose: () => void;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography color="text.secondary" variant="caption" component="dt">
      {label}
    </Typography>
    <Typography variant="body2" component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>
      {value}
    </Typography>
  </Box>
);

/** Read-only view of one audit event: who, when, what, and the recorded detail as JSON. */
export const AuditDetailDialog = ({ event, onClose }: Props) => (
  <AppDialog
    open={Boolean(event)}
    onClose={onClose}
    title="Detail peristiwa"
    maxWidth="sm"
    fullWidth
    actions={<AppDialogCancelButton label="Tutup" onClick={onClose} variant="outlined" />}
  >
    {event ? (
      <Stack spacing={2}>
        <Chip
          label={event.action}
          size="small"
          sx={{ alignSelf: 'flex-start', fontFamily: 'monospace' }}
          variant="outlined"
        />
        <Box
          component="dl"
          sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(2, 1fr)', m: 0 }}
        >
          <Field label="Waktu" value={formatDisplayDateTime(event.at)} />
          <Field label="Pelaku" value={event.actor} />
          <Field label="Entitas" value={event.entity} />
          <Field label="ID entitas" value={event.entity_id ?? '-'} />
        </Box>
        {event.detail ? (
          <Box
            component="pre"
            aria-label="Detail JSON"
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 13,
              m: 0,
              maxHeight: 360,
              overflow: 'auto',
              overflowWrap: 'anywhere',
              p: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {JSON.stringify(event.detail, null, 2)}
          </Box>
        ) : (
          <Typography color="text.secondary" variant="body2">
            Tidak ada detail untuk peristiwa ini.
          </Typography>
        )}
      </Stack>
    ) : null}
  </AppDialog>
);
