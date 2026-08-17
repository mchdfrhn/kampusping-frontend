import { createTheme, type Shadows } from '@mui/material/styles';

const baseShadows = createTheme().shadows;

export const shadows: Shadows = [
  'none',
  '0 1px 2px rgba(16, 24, 40, 0.06)',
  '0 2px 8px rgba(16, 24, 40, 0.08)',
  '0 4px 12px rgba(16, 24, 40, 0.10)',
  ...baseShadows.slice(4),
] as Shadows;
