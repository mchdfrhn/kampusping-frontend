export type ThemeModeSetting = 'light' | 'dark' | 'system';

const parseThemeMode = (value: string | undefined): ThemeModeSetting =>
  value === 'light' || value === 'dark' ? value : 'system';

/**
 * Branding and runtime options. Values come from NEXT_PUBLIC_* variables, which Next.js inlines at
 * build time, so each one has to be referenced literally.
 */
export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Webapp',
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    'A clean, modern starting point for business web applications.',
  /** Optional logo image (e.g. /logo.svg). Empty renders a monogram of the app name. */
  logo: process.env.NEXT_PUBLIC_APP_LOGO ?? '',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#4F46E5',
  defaultThemeMode: parseThemeMode(process.env.NEXT_PUBLIC_DEFAULT_THEME_MODE),
  /** BCP 47 locale for dates and numbers. */
  locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en',
};
