import type { InvoiceSource, InvoiceStatus } from './types';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'Lunas',
  unpaid: 'Belum lunas',
};

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, 'success' | 'warning'> = {
  paid: 'success',
  unpaid: 'warning',
};

export const INVOICE_STATUS_OPTIONS = (Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map(
  (value) => ({ value, label: INVOICE_STATUS_LABELS[value] }),
);

export const INVOICE_SOURCE_LABELS: Record<InvoiceSource, string> = {
  siakad: 'SIAKAD/Civitas',
  sipema: 'SIPEMA',
};

/** Longest semester accepted by the list filter (`invoices/router.py`). */
export const INVOICE_SEMESTER_MAX = 50;

export const MARK_UNPAID_TEXT = {
  title: 'Tandai belum lunas',
  confirm: 'Tandai belum lunas',
  effect: 'Mahasiswa akan kembali menerima pengingat WhatsApp untuk tagihan ini.',
};

export const MARK_PAID_TEXT = {
  title: 'Tandai lunas',
  confirm: 'Tandai lunas',
  effect: 'Pengingat WhatsApp untuk tagihan ini akan dihentikan.',
};
