'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { AppLoading } from '@/components/base/AppLoading';
import { AppLogo } from '@/components/layout/AppLogo';
import { useAuthStore } from '@/core/auth/auth.store';
import { appConfig } from '@/core/config/app.config';
import { safeNextPath } from '@/core/utils/navigation.util';
import { PRIMARY } from '@/design-system/tokens/surface.token';

import { LoginForm } from './LoginForm';

export const LoginPage = () => {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const router = useRouter();
  const params = useSearchParams();

  // A visitor who still has a valid refresh cookie goes straight in.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'authenticated') router.replace(safeNextPath(params.get('next')));
  }, [status, router, params]);

  if (status === 'idle' || status === 'loading' || status === 'authenticated') {
    return <AppLoading label="Checking your session..." />;
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        display: 'grid',
        minHeight: '100vh',
        gridTemplateColumns: { md: '1.1fr 1fr' },
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(145deg, ${PRIMARY}, color-mix(in srgb, ${PRIMARY} 55%, #000))`,
          color: 'primary.contrastText',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
        }}
      >
        <Box
          sx={{ alignItems: 'center', display: 'flex', fontSize: 20, fontWeight: 700, gap: 1.5 }}
        >
          <AppLogo size={40} />
          {appConfig.appName}
        </Box>
        <Box sx={{ maxWidth: 460 }}>
          <Typography
            component="p"
            sx={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            {appConfig.appDescription}
          </Typography>
        </Box>
        <Typography sx={{ opacity: 0.8 }} variant="body2">
          &copy; {new Date().getFullYear()} {appConfig.appName}
        </Typography>
      </Box>

      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          <Box sx={{ display: { md: 'none' }, mb: 4 }}>
            <AppLogo size={40} withName />
          </Box>
          <Typography component="h1" sx={{ mb: 0.5 }} variant="h4">
            Sign in
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }} variant="body2">
            Use your email and password to continue.
          </Typography>
          <LoginForm />
        </Box>
      </Box>
    </Box>
  );
};
