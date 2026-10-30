import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AppLoading } from '@/components/base/AppLoading';
import { LoginPage } from '@/modules/auth/components/LoginPage';

export const metadata: Metadata = { title: 'Sign in' };

export default function Page() {
  // useSearchParams() in the login page needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={<AppLoading />}>
      <LoginPage />
    </Suspense>
  );
}
