'use client';

import Box from '@mui/material/Box';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { readStoredEnrichedUser, userIsGroupAdmin } from '@/core/auth/auth-session.util';
import { appConfig } from '@/core/config/app.config';

export default function SettingsGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isGroupAdmin = userIsGroupAdmin(readStoredEnrichedUser()) || appConfig.allowLocalDevWithoutAuth;

  useEffect(() => {
    if (!isGroupAdmin) {
      router.replace('/dashboard');
    }
  }, [isGroupAdmin, router]);

  if (!isGroupAdmin) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {children}
    </Box>
  );
}
