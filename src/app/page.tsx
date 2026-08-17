'use client';

import { useEffect } from 'react';

import { AppLoading } from '@/components/base/AppLoading';

export default function HomePage() {
  useEffect(() => {
    const search = window.location.search || '';
    window.location.replace(`/dashboard${search}`);
  }, []);

  return <AppLoading label="Redirecting..." />;
}
