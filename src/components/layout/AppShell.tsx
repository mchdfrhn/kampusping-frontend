'use client';

import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { layoutTokens } from '@/design-system/tokens/layout.token';
import { useUiStore } from '@/store';

import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

/** Authenticated layout: sidebar, sticky header and the page content area. */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const hydrate = useUiStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Box sx={{ bgcolor: 'background.default', display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />
      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
        <AppHeader />
        <Box
          component="main"
          id="main-content"
          sx={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            mx: 'auto',
            maxWidth: layoutTokens.contentMaxWidth,
            minWidth: 0,
            p: layoutTokens.pagePadding,
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
