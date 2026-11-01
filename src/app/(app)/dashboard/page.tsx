import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { DashboardPage } from '@/modules/dashboard/components/DashboardPage';

export const metadata: Metadata = { title: 'Dasbor' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.dashboardRead}>
      <DashboardPage />
    </RequirePermission>
  );
}
