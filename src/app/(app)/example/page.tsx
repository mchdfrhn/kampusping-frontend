import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { ExampleListPage } from '@/modules/example/components/ExampleListPage';

export const metadata: Metadata = { title: 'Example items' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.examplesRead}>
      <ExampleListPage />
    </RequirePermission>
  );
}
