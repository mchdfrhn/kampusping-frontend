import type { CancelReason, MessageStatus } from './types';

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  queued: 'Antre',
  sending: 'Mengirim',
  sent: 'Terkirim',
  delivered: 'Diterima',
  read: 'Dibaca',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};

export const MESSAGE_STATUS_TONES: Record<
  MessageStatus,
  'default' | 'info' | 'success' | 'error' | 'warning'
> = {
  queued: 'default',
  sending: 'info',
  sent: 'info',
  delivered: 'success',
  read: 'success',
  failed: 'error',
  cancelled: 'warning',
};

export const MESSAGE_STATUS_OPTIONS = (Object.keys(MESSAGE_STATUS_LABELS) as MessageStatus[]).map(
  (value) => ({ value, label: MESSAGE_STATUS_LABELS[value] }),
);

export const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  paid: 'Sudah lunas',
  opted_out: 'Berhenti berlangganan',
  exempt: 'Dikecualikan',
  phone_invalid: 'Nomor tidak valid',
  expired: 'Kedaluwarsa',
  superseded: 'Digantikan pesan yang lebih baru',
  manual: 'Dibatalkan staf',
  escalated: 'Eskalasi ke staf',
};

/** Only a message still waiting in the queue can be cancelled (the server answers 409 otherwise). */
export const CANCELLABLE_STATUS: MessageStatus = 'queued';
