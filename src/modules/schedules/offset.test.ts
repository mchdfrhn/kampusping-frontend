import { describe, expect, it } from 'vitest';

import { describeOffset, formatOffsetLabel } from './offset';

describe('formatOffsetLabel', () => {
  it('writes the due date itself as H', () => {
    expect(formatOffsetLabel(0)).toBe('H');
  });

  it('writes days before the due date as H-n', () => {
    expect(formatOffsetLabel(-1)).toBe('H-1');
    expect(formatOffsetLabel(-7)).toBe('H-7');
  });

  it('writes days after the due date as H+n', () => {
    expect(formatOffsetLabel(3)).toBe('H+3');
    expect(formatOffsetLabel(14)).toBe('H+14');
  });

  it('handles the limits the server accepts (-60 and 60)', () => {
    expect(formatOffsetLabel(-60)).toBe('H-60');
    expect(formatOffsetLabel(60)).toBe('H+60');
  });
});

describe('describeOffset', () => {
  it('describes each side of the due date in Indonesian', () => {
    expect(describeOffset(-7)).toBe('7 hari sebelum jatuh tempo');
    expect(describeOffset(0)).toBe('pada hari jatuh tempo');
    expect(describeOffset(3)).toBe('3 hari setelah jatuh tempo');
  });
});
