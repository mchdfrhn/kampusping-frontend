import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import { layoutTokens } from '@/design-system/tokens/layout.token';

export const AppMain = ({ children }: { children: ReactNode }) => (
  <Box
    component="main"
    sx={{
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      height: `calc(100vh - ${layoutTokens.headerHeight}px)`,
      minHeight: 0,
      minWidth: 0,
      overflow: 'hidden',
    }}
  >
    {children}
  </Box>
);
