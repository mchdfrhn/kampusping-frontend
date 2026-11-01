import { describe, expect, it } from 'vitest';

import { findMalformedPlaceholders } from './placeholders';

describe('findMalformedPlaceholders', () => {
  it('returns nothing for well-formed placeholders, with or without inner spaces', () => {
    expect(findMalformedPlaceholders('Yth. {{nama}}, tagihan {{ nominal }} jatuh tempo.')).toEqual(
      [],
    );
  });

  it('returns nothing for plain text, an empty body and single braces', () => {
    expect(findMalformedPlaceholders('')).toEqual([]);
    expect(findMalformedPlaceholders('Halo, tagihan Anda belum lunas.')).toEqual([]);
    expect(findMalformedPlaceholders('Pilih {opsi} berikut')).toEqual([]);
  });

  it('flags a placeholder name with a space inside', () => {
    expect(findMalformedPlaceholders('Yth. {{nama lengkap}}')).toEqual(['{{nama lengkap}}']);
  });

  it('flags a placeholder that is missing a closing brace', () => {
    expect(findMalformedPlaceholders('Yth. {{nama} segera bayar')).toEqual(['{{nama}']);
  });

  it('flags a placeholder that is never closed', () => {
    expect(findMalformedPlaceholders('Yth. {{nama')).toEqual(['{{nama']);
  });

  it('flags an empty placeholder', () => {
    expect(findMalformedPlaceholders('Halo {{}}')).toEqual(['{{}}']);
  });

  it('flags a closing pair that has no opening pair', () => {
    expect(findMalformedPlaceholders('Halo nama}} apa kabar')).toEqual(['}}']);
  });

  it('reports each problem once, in order of appearance, next to valid placeholders', () => {
    const body = '{{nama}} {{nim lengkap}} dan {{}} lalu {{nim lengkap}} {{nominal}}';
    expect(findMalformedPlaceholders(body)).toEqual(['{{nim lengkap}}', '{{}}']);
  });

  it('does not treat a valid placeholder wrapped in extra braces as malformed', () => {
    expect(findMalformedPlaceholders('{{{nama}}}')).toEqual([]);
  });

  it('does not run an unclosed opener across lines', () => {
    expect(findMalformedPlaceholders('{{nama\nbaris kedua')).toEqual(['{{nama']);
  });

  it('accepts accented letters the way the server pattern does', () => {
    expect(findMalformedPlaceholders('{{nämä}}')).toEqual([]);
  });
});
