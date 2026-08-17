import type { PaletteOptions } from '@mui/material/styles';

import { appConfig } from '@/core/config/app.config';
import { colorTokens } from '@/design-system/tokens/color.token';

export const createPalette = (): PaletteOptions => ({
  mode: appConfig.defaultThemeMode,
  primary: { main: appConfig.primaryColor, contrastText: '#FFFFFF' },
  secondary: { main: appConfig.secondaryColor, contrastText: '#FFFFFF' },
  error: { main: colorTokens.hinoRed },
  background: { default: colorTokens.background, paper: '#FFFFFF' },
  divider: colorTokens.divider,
  text: { primary: '#1F2937', secondary: '#667085' },
});
