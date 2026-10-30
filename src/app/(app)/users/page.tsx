import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { UsersListPage } from '@/modules/users/components/UsersListPage';

export const metadata: Metadata = { title: 'Users' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.usersRead}>
      <UsersListPage />
    </RequirePermission>
  );
}
