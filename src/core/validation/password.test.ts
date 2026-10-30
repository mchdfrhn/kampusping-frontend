import { describe, expect, it } from 'vitest';

import { optionalPasswordSchema, passwordSchema } from './password';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Correct-horse-9').success).toBe(true);
  });

  it.each([
    ['too short', 'abc123'],
    ['no digit', 'onlyletterslong'],
    ['no letter', '12345678901'],
    ['too long', `a1${'x'.repeat(200)}`],
  ])('rejects a password that is %s', (_label, value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });
});

describe('optionalPasswordSchema', () => {
  it('treats an empty string as "leave unchanged"', () => {
    expect(optionalPasswordSchema.safeParse('').success).toBe(true);
  });

  it('still validates a provided password', () => {
    expect(optionalPasswordSchema.safeParse('weak').success).toBe(false);
    expect(optionalPasswordSchema.safeParse('Correct-horse-9').success).toBe(true);
  });
});
