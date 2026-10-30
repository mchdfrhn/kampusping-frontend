import type { ThemeOptions } from '@mui/material/styles';

/** `--font-inter` is defined by next/font in the root layout. */
const fontFamily = [
  'var(--font-inter)',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
].join(', ');

const heading = { fontWeight: 600, letterSpacing: '-0.01em' };

export const typography: ThemeOptions['typography'] = {
  fontFamily,
  h1: { ...heading, fontSize: '2.25rem', lineHeight: 1.2 },
  h2: { ...heading, fontSize: '1.875rem', lineHeight: 1.25 },
  h3: { ...heading, fontSize: '1.5rem', lineHeight: 1.3 },
  h4: { ...heading, fontSize: '1.25rem', lineHeight: 1.35 },
  h5: { ...heading, fontSize: '1.125rem', lineHeight: 1.4 },
  h6: { ...heading, fontSize: '1rem', lineHeight: 1.4 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 600 },
  body2: { lineHeight: 1.6 },
  button: { fontWeight: 600, textTransform: 'none' },
};
