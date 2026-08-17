import type { ThemeOptions } from '@mui/material/styles';

import { typographyTokens } from '@/design-system/tokens/typography.token';

export const typography: ThemeOptions['typography'] = {
  fontFamily: typographyTokens.fontFamily,
  h1: { fontWeight: typographyTokens.headingWeight, fontSize: '2.75rem', lineHeight: 1.15 },
  h2: { fontWeight: typographyTokens.headingWeight, fontSize: '2.25rem', lineHeight: 1.2 },
  h3: { fontWeight: typographyTokens.headingWeight, fontSize: '1.75rem', lineHeight: 1.25 },
  h4: { fontWeight: typographyTokens.headingWeight, fontSize: '1.5rem', lineHeight: 1.3 },
  h5: { fontWeight: typographyTokens.headingWeight, fontSize: '1.25rem', lineHeight: 1.35 },
  h6: { fontWeight: typographyTokens.headingWeight, fontSize: '1rem', lineHeight: 1.4 },
  button: { fontWeight: 700, textTransform: 'none' },
  body2: { lineHeight: 1.6 },
};
