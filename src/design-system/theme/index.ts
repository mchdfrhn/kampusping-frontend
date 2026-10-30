import { createTheme } from '@mui/material/styles';

import { components } from './components';
import { darkPalette, lightPalette } from './palette';
import { typography } from './typography';

/**
 * One theme with both color schemes. MUI emits CSS variables (`--mui-palette-*`) and switches the
 * `.light` / `.dark` class on <html>, so toggling the mode never re-renders the tree.
 */
export const createAppTheme = () =>
  createTheme({
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: { palette: lightPalette },
      dark: { palette: darkPalette },
    },
    typography,
    shape: { borderRadius: 10 },
    components,
  });
