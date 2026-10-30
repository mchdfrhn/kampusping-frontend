import type { Metadata } from 'next';

import { ProfilePage } from '@/modules/profile/components/ProfilePage';

export const metadata: Metadata = { title: 'Profile' };

export default function Page() {
  return <ProfilePage />;
}
