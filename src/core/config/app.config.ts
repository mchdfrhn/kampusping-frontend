import type { LayoutType, SidebarMode, ThemeMode } from '@/core/types/common.type';

const defaultThemeMode = (process.env.NEXT_PUBLIC_DEFAULT_THEME_MODE ?? 'light') as ThemeMode;

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseCsv = (value: string | undefined, fallback: string[]) => {
  if (!value?.trim()) return fallback;
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HIS Standard UI/UX',
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'PT. Hino Motors Sales Indonesia',
  companyLogo: process.env.NEXT_PUBLIC_COMPANY_LOGO ?? '/media/logos/logo-hino-v.png',
  companyLogoDark: process.env.NEXT_PUBLIC_COMPANY_LOGO_DARK ?? '/media/logos/logo-hino-v.png',
  favicon: process.env.NEXT_PUBLIC_FAVICON ?? '/media/favicon/favicon.ico',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#E30613',
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR ?? '#005BAC',
  defaultThemeMode,
  sidebarMode: 'full' as SidebarMode,
  layoutType: 'dashboard' as LayoutType,
  masterAppUrl: process.env.NEXT_PUBLIC_MASTER_APP ?? '/',
  masterLogoutUrl: process.env.NEXT_PUBLIC_MASTER_LOGOUT ?? '/',
  launcherId: process.env.NEXT_PUBLIC_LAUNCHER_ID ?? '',
  groupAdminRoleId: parseNumber(process.env.NEXT_PUBLIC_GROUP_ADMIN_ROLE_ID, 1),
  permissionPrefixes: parseCsv(process.env.NEXT_PUBLIC_APP_PERMISSION_PREFIXES, ['example']),
  allowLocalDevWithoutAuth: (process.env.NEXT_PUBLIC_ALLOW_LOCAL_DEV_WITHOUT_AUTH ?? 'true') === 'true',
};
