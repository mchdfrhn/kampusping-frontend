'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { AppLoading } from '@/components/base/AppLoading';
import { useAuthStore } from '@/core/auth/auth.store';
import { routes } from '@/core/config/route.config';

/**
 * Client-side gate for the authenticated area. It restores the session from the refresh cookie on
 * first load and sends anonymous visitors to the login page, remembering where they were headed.
 *
 * This is navigation convenience: every API call is authorised by the server regardless.
 */
export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'anonymous') {
      const next =
        pathname && pathname !== routes.home ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`${routes.login}${next}`);
    }
  }, [status, pathname, router]);

  if (status !== 'authenticated') return <AppLoading label="Loading your workspace..." />;
  return <>{children}</>;
};
