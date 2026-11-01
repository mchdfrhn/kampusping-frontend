'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppLoading } from '@/components/base/AppLoading';
import { useAuth } from '@/core/auth/useAuth';
import { firstAccessibleRoute } from '@/core/utils/navigation.util';

/**
 * The `/` page: sends a signed-in user to the first page they may open. Rendered inside
 * `AuthGuard`, which restores the session first and sends anonymous visitors to the login page.
 * The permissions are only known client-side, so this cannot be a server redirect.
 */
export const HomeRedirect = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(firstAccessibleRoute(user));
  }, [user, router]);

  return <AppLoading label="Mengalihkan..." />;
};
