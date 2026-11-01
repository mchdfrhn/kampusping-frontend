import type { WhatsAppState } from '@/modules/settings/types';

import type { InvoiceSummary, MessageSummary } from './types';

export const SEMESTER_MAX_LENGTH = 20;
/** BRD KPI T4: at least this share of sent messages should reach the student's phone. */
export const RECEIVED_TARGET_PERCENT = 95;

/** `part` as a whole percent of `whole`, or `null` when there is nothing to divide by. */
export const percentOf = (part: number, whole: number): number | null =>
  whole > 0 ? Math.round((part / whole) * 100) : null;

export const formatPercent = (value: number | null): string => (value === null ? '-' : `${value}%`);

export type MessageStats = {
  /** Messages that left for WhatsApp: sent + delivered + read. */
  sentTotal: number;
  /** (delivered + read) / sentTotal. */
  receivedPercent: number | null;
  /** read / sentTotal. */
  readPercent: number | null;
  failed: number;
  /** queued + sending. */
  queued: number;
};

export const messageStats = (messages: MessageSummary): MessageStats => {
  const sentTotal = messages.sent + messages.delivered + messages.read;
  return {
    sentTotal,
    receivedPercent: percentOf(messages.delivered + messages.read, sentTotal),
    readPercent: percentOf(messages.read, sentTotal),
    failed: messages.failed,
    queued: messages.queued + messages.sending,
  };
};

export type PieSlice = {
  id: 'paid' | 'unpaid' | 'overdue';
  label: string;
  value: number;
  /** Theme palette token, e.g. `success-main` (becomes `var(--mui-palette-success-main)`). */
  token: string;
};

/** Paid / unpaid and not yet due / overdue. The three slices add up to the total. */
export const invoicePieData = (invoices: InvoiceSummary): PieSlice[] => [
  { id: 'paid', label: 'Lunas', value: invoices.paid, token: 'success-main' },
  {
    id: 'unpaid',
    label: 'Belum lunas',
    value: Math.max(invoices.unpaid - invoices.overdue, 0),
    token: 'warning-main',
  },
  { id: 'overdue', label: 'Tunggakan', value: invoices.overdue, token: 'error-main' },
];

const WHATSAPP_STATE_LABELS: Record<WhatsAppState, string> = {
  connected: 'terhubung',
  connecting: 'menyambungkan',
  qr: 'menunggu pemindaian kode QR',
  disconnected: 'terputus',
};

export const whatsappStateLabel = (state: WhatsAppState): string => WHATSAPP_STATE_LABELS[state];
