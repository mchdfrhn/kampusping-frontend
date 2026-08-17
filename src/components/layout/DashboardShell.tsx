'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { useAuthBootstrap } from '@/core/auth/useAuthBootstrap';
import { useMenuMapping } from '@/core/hooks/useMenuMapping';
import { PageDataProvider } from '@/core/layout/PageData';
import { AppLoading } from '@/components/base/AppLoading';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppMain } from './AppMain';
import { AppSidebar } from './AppSidebar';
import { NoAccessDialog } from './NoAccessDialog';
import { PageToolbar } from './PageToolbar';
import Box from '@mui/material/Box';

const isWelcomePath = (pathname: string) => pathname === '/dashboard';

export const DashboardShell = ({ children }: { children: ReactNode }) => {
  const { loading, noAccess } = useAuthBootstrap();
  const pathname = usePathname();
  const isWelcomePage = isWelcomePath(pathname);

  useMenuMapping();

  if (loading) return <AppLoading label="Preparing application..." />;

  return (
    <PageDataProvider>
      <Box sx={{ bgcolor: isWelcomePage ? '#fff' : '#f5f6f8', minHeight: '100vh' }}>
        <AppHeader />
        <Box sx={{ display: 'flex' }}>
          <AppSidebar />
          <AppMain>
            <PageToolbar />
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
                overflowX: 'hidden',
                pt: isWelcomePage ? 0 : 2.5,
                px: isWelcomePage ? 0 : 2.5,
              }}
            >
              {children}
            </Box>
            <AppFooter />
          </AppMain>
        </Box>
      </Box>
      <NoAccessDialog open={noAccess} />
    </PageDataProvider>
  );
};
