export type ThemeModeSetting = 'light' | 'dark' | 'system';

const parseThemeMode = (value: string | undefined): ThemeModeSetting =>
  value === 'light' || value === 'dark' ? value : 'system';

/**
 * Branding and runtime options. Values come from NEXT_PUBLIC_* variables, which Next.js inlines at
 * build time, so each one has to be referenced literally.
 */
export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'KampusPing',
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    'Sistem penagihan uang kuliah via WhatsApp untuk Bagian Keuangan.',
  /** Logo image served from /public. Set it to an empty string to show a monogram instead. */
  logo: process.env.NEXT_PUBLIC_APP_LOGO ?? '/logo.png',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#0F766E',
  defaultThemeMode: parseThemeMode(process.env.NEXT_PUBLIC_DEFAULT_THEME_MODE),
  /** BCP 47 locale for dates and numbers. */
  locale: process.env.NEXT_PUBLIC_LOCALE ?? 'id',
};
