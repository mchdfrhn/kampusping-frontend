'use client';

import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

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

const Field = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'error' | 'warning';
}) => (
  <Box>
    <Typography color="text.secondary" variant="caption" component="dt">
      {label}
    </Typography>
    <Typography
      variant="body2"
      component="dd"
      color={tone === 'error' ? 'error.main' : tone === 'warning' ? 'warning.main' : 'text.primary'}
      sx={{ fontWeight: tone === 'default' ? 500 : 600, m: 0 }}
    >
      {value}
    </Typography>
  </Box>
);

/** Read-only view of one log entry: WhatsApp chat bubble preview plus its delivery timeline. */
export const MessageBodyDialog = ({ message, onClose }: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
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
          {/* WhatsApp Chat Mockup Container */}
          <Box
            sx={{
              borderRadius: 2.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: isDark ? 'grey.900' : '#E5DDD5',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {/* WhatsApp Header */}
            <Box
              sx={{
                bgcolor: isDark ? '#1F2C34' : '#075E54',
                color: '#FFFFFF',
                px: 2,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                <WhatsAppIcon sx={{ fontSize: 28, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }} noWrap>
                    {message.student.name} ({message.student.nim})
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.82)', display: 'block' }}
                    noWrap
                  >
                    {message.phone_masked ?? 'Tanpa nomor'} · Tagihan #{message.invoice_id}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Chip
                  size="small"
                  label={message.kind === 'manual' ? 'Manual' : 'Terjadwal'}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.16)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    height: 22,
                    fontSize: 11,
                  }}
                />
                <AppStatusChip
                  status={MESSAGE_STATUS_TONES[message.status]}
                  label={MESSAGE_STATUS_LABELS[message.status]}
                />
              </Stack>
            </Box>

            {/* WhatsApp Message Bubble Area */}
            <Box sx={{ p: 2, maxHeight: 340, overflowY: 'auto' }}>
              <Box
                sx={{
                  maxWidth: '92%',
                  p: 1.5,
                  borderRadius: '0px 10px 10px 10px',
                  bgcolor: isDark ? '#005C4B' : '#FFFFFF',
                  color: isDark ? '#E9EDEF' : '#111B21',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.14)',
                }}
              >
                <Box
                  component="pre"
                  aria-label="Isi pesan"
                  sx={{
                    fontFamily: 'inherit',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    m: 0,
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.body}
                </Box>

                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 0.75, opacity: 0.75 }}
                >
                  <Typography variant="caption" sx={{ fontSize: 11 }}>
                    {formatDisplayDateTime(
                      message.read_at ??
                      message.delivered_at ??
                      message.sent_at ??
                      message.queued_at,
                    )}
                  </Typography>
                  {message.status === 'sent' ||
                    message.status === 'delivered' ||
                    message.status === 'read' ? (
                    <DoneAllOutlinedIcon
                      sx={{
                        fontSize: 15,
                        color:
                          message.status === 'read'
                            ? isDark
                              ? '#53BDEB'
                              : '#34B7F1'
                            : 'currentColor',
                      }}
                    />
                  ) : (
                    <ScheduleOutlinedIcon sx={{ fontSize: 14 }} />
                  )}
                </Stack>
              </Box>
            </Box>
          </Box>

          {/* Delivery Metadata Grid */}
          <Box
            component="dl"
            sx={{
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              m: 0,
              p: 2,
            }}
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
                tone="warning"
                value={CANCEL_REASON_LABELS[message.cancel_reason] ?? message.cancel_reason}
              />
            ) : null}
            {message.error ? <Field label="Galat" tone="error" value={message.error} /> : null}
          </Box>
        </Stack>
      ) : null}
    </AppDialog>
  );
};
