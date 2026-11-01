import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { ImportPage } from '@/modules/import/components/ImportPage';

export const metadata: Metadata = { title: 'Impor Data' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.importsRead}>
      <ImportPage />
    </RequirePermission>
  );
}
