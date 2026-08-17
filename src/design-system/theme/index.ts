import { createTheme } from '@mui/material/styles';

import { components } from './components';
import { createPalette } from './palette';
import { shadows } from './shadows';
import { shape } from './shape';
import { spacing } from './spacing';
import { typography } from './typography';

export const createAppTheme = () =>
  createTheme({
    palette: createPalette(),
    typography,
    shadows,
    shape,
    spacing,
    components,
  });
