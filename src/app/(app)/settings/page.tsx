import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { SettingsPage } from '@/modules/settings/components/SettingsPage';

export const metadata: Metadata = { title: 'Pengaturan' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.settingsRead}>
      <SettingsPage />
    </RequirePermission>
  );
}
