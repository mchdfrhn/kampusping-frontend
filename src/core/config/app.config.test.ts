import { describe, expect, it } from 'vitest';

import { appConfig } from './app.config';

describe('appConfig defaults', () => {
  it('uses the Indonesian locale and description when no env override is set', () => {
    expect(appConfig.locale).toBe('id');
    expect(appConfig.appDescription).toBe(
      'Sistem penagihan uang kuliah via WhatsApp untuk Bagian Keuangan.',
    );
  });
});
