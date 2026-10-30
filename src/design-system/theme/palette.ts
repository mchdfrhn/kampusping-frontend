import { lighten } from '@mui/material/styles';

import { appConfig } from '@/core/config/app.config';

const brand = appConfig.primaryColor;

/** Neutral, accessible palettes. Only the primary color is brand-specific (NEXT_PUBLIC_PRIMARY_COLOR). */
export const lightPalette = {
  primary: { main: brand, contrastText: '#FFFFFF' },
  secondary: { main: '#475569', contrastText: '#FFFFFF' },
  success: { main: '#15803D' },
  warning: { main: '#B45309' },
  error: { main: '#DC2626' },
  info: { main: '#0369A1' },
  background: { default: '#F8FAFC', paper: '#FFFFFF' },
  divider: '#E2E8F0',
  text: { primary: '#0F172A', secondary: '#64748B' },
};

export const darkPalette = {
  primary: { main: lighten(brand, 0.35), contrastText: '#0B1020' },
  secondary: { main: '#94A3B8', contrastText: '#0B1020' },
  success: { main: '#4ADE80' },
  warning: { main: '#FBBF24' },
  error: { main: '#F87171' },
  info: { main: '#38BDF8' },
  background: { default: '#0B1220', paper: '#111827' },
  divider: '#1F2A3C',
  text: { primary: '#E5E7EB', secondary: '#9CA3AF' },
};
