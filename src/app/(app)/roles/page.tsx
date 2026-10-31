import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { RolesListPage } from '@/modules/roles/components/RolesListPage';

export const metadata: Metadata = { title: 'Peran' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.rolesRead}>
      <RolesListPage />
    </RequirePermission>
  );
}
