import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { ReportsPage } from '@/modules/reports/components/ReportsPage';

export const metadata: Metadata = { title: 'Laporan' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.reportsRead}>
      <ReportsPage />
    </RequirePermission>
  );
}
