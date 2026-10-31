import { describe, expect, it } from 'vitest';

import { optionalPasswordSchema, passwordSchema } from './password';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Correct-horse-9').success).toBe(true);
  });

  it.each([
    ['too short', 'abc123', 'Minimal 10 karakter'],
    ['no digit', 'onlyletterslong', 'Harus mengandung minimal satu angka'],
    ['no letter', '12345678901', 'Harus mengandung minimal satu huruf'],
    ['too long', `a1${'x'.repeat(200)}`, 'Maksimal 128 karakter'],
  ])('rejects a password that is %s', (_label, value, message) => {
    const result = passwordSchema.safeParse(value);

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
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
