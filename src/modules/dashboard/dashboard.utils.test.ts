import { describe, expect, it } from 'vitest';

import {
  formatPercent,
  invoicePieData,
  messageStats,
  percentOf,
  whatsappStateLabel,
} from './dashboard.utils';
import type { InvoiceSummary, MessageSummary } from './types';

const messages = (overrides: Partial<MessageSummary> = {}): MessageSummary => ({
  queued: 0,
  sending: 0,
  sent: 0,
  delivered: 0,
  read: 0,
  failed: 0,
  cancelled: 0,
  ...overrides,
});

const invoices = (overrides: Partial<InvoiceSummary> = {}): InvoiceSummary => ({
  total: 0,
  total_amount: 0,
  paid: 0,
  paid_amount: 0,
  unpaid: 0,
  unpaid_amount: 0,
  overdue: 0,
  overdue_amount: 0,
  ...overrides,
});

describe('percentOf', () => {
  it('rounds to a whole percent', () => {
    expect(percentOf(19, 20)).toBe(95);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(20, 20)).toBe(100);
    expect(percentOf(0, 20)).toBe(0);
  });

  it('is null when there is nothing to divide by', () => {
    expect(percentOf(0, 0)).toBeNull();
    expect(percentOf(5, 0)).toBeNull();
  });
});

describe('formatPercent', () => {
  it('shows a dash when there is no percentage', () => {
    expect(formatPercent(null)).toBe('-');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(95)).toBe('95%');
  });
});

describe('messageStats', () => {
  it('counts sent, delivered and read as delivered-to-WhatsApp messages', () => {
    const stats = messageStats(messages({ sent: 2, delivered: 5, read: 13, failed: 4 }));

    expect(stats.sentTotal).toBe(20);
    // KPI T4: (delivered + read) / (sent + delivered + read)
    expect(stats.receivedPercent).toBe(90);
    expect(stats.readPercent).toBe(65);
    expect(stats.failed).toBe(4);
  });

  it('adds queued and sending into the queue and ignores cancelled messages', () => {
    const stats = messageStats(messages({ queued: 3, sending: 2, cancelled: 9 }));

    expect(stats.queued).toBe(5);
    expect(stats.sentTotal).toBe(0);
  });

  it('has no percentages when nothing was sent', () => {
    const stats = messageStats(messages({ failed: 7 }));

    expect(stats.receivedPercent).toBeNull();
    expect(stats.readPercent).toBeNull();
  });
});

describe('invoicePieData', () => {
  it('splits unpaid into not-yet-due and overdue', () => {
    const data = invoicePieData(invoices({ total: 10, paid: 4, unpaid: 6, overdue: 2 }));

    expect(data.map(({ id, label, value }) => ({ id, label, value }))).toEqual([
      { id: 'paid', label: 'Lunas', value: 4 },
      { id: 'unpaid', label: 'Belum lunas', value: 4 },
      { id: 'overdue', label: 'Tunggakan', value: 2 },
    ]);
  });

  it('uses theme palette tokens, never colors', () => {
    const data = invoicePieData(invoices({ paid: 1, unpaid: 2, overdue: 1 }));

    expect(data.map((slice) => slice.token)).toEqual([
      'success-main',
      'warning-main',
      'error-main',
    ]);
  });

  it('never goes negative if overdue exceeds unpaid', () => {
    const data = invoicePieData(invoices({ unpaid: 1, overdue: 3 }));

    expect(data.find((slice) => slice.id === 'unpaid')?.value).toBe(0);
  });
});

describe('whatsappStateLabel', () => {
  it('names each state in lower-case Indonesian', () => {
    expect(whatsappStateLabel('disconnected')).toBe('terputus');
    expect(whatsappStateLabel('connecting')).toBe('menyambungkan');
    expect(whatsappStateLabel('qr')).toBe('menunggu pemindaian kode QR');
    expect(whatsappStateLabel('connected')).toBe('terhubung');
  });
});
