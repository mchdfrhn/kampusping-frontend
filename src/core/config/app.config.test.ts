import { afterEach, describe, expect, it, vi } from 'vitest';

import { appConfig } from './app.config';

describe('appConfig defaults', () => {
  it('uses the Indonesian locale and description when no env override is set', () => {
    expect(appConfig.locale).toBe('id');
    expect(appConfig.appDescription).toBe(
      'Sistem penagihan uang kuliah via WhatsApp untuk Bagian Keuangan.',
    );
  });

  it('shows the bundled logo when NEXT_PUBLIC_APP_LOGO is not set', () => {
    // A missing .env line must not silently turn the brand mark into a monogram.
    expect(appConfig.logo).toBe('/logo.png');
  });
});

describe('appConfig logo override', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('lets an empty NEXT_PUBLIC_APP_LOGO switch back to the monogram', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_LOGO', '');
    vi.resetModules();

    const { appConfig: fresh } = await import('./app.config');

    expect(fresh.logo).toBe('');
  });
});
