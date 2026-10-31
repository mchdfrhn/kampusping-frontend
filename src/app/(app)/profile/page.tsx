import type { Metadata } from 'next';

import { ProfilePage } from '@/modules/profile/components/ProfilePage';

export const metadata: Metadata = { title: 'Profil' };

export default function Page() {
  return <ProfilePage />;
}
