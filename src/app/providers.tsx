'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { ReactNode } from 'react';

import { appConfig } from '@/core/config/app.config';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { createAppTheme } from '@/design-system/theme';

// Created once at module scope: the theme does not depend on any request or user state.
const theme = createAppTheme();

export const Providers = ({ children }: { children: ReactNode }) => (
  <AppRouterCacheProvider options={{ key: 'mui' }}>
    <ThemeProvider theme={theme} defaultMode={appConfig.defaultThemeMode} disableTransitionOnChange>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={appConfig.locale}>
        <CssBaseline />
        <NotifyProvider>{children}</NotifyProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </AppRouterCacheProvider>
);
