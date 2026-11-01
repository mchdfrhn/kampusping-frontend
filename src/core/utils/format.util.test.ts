import { describe, expect, it } from 'vitest';

import { formatRupiah } from './format.util';

describe('formatRupiah', () => {
  it('groups thousands with dots and prefixes Rp', () => {
    expect(formatRupiah(1250000)).toBe('Rp1.250.000');
    expect(formatRupiah(500)).toBe('Rp500');
    expect(formatRupiah(1000)).toBe('Rp1.000');
    expect(formatRupiah(12345678901)).toBe('Rp12.345.678.901');
  });

  it('formats zero as Rp0', () => {
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(-0)).toBe('Rp0');
  });

  it('puts the minus sign before the currency for negative amounts', () => {
    expect(formatRupiah(-1250000)).toBe('-Rp1.250.000');
    expect(formatRupiah(-5)).toBe('-Rp5');
  });

  it('rounds fractions to whole rupiah', () => {
    expect(formatRupiah(1250000.4)).toBe('Rp1.250.000');
    expect(formatRupiah(1999.6)).toBe('Rp2.000');
  });
});
