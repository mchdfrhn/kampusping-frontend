import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { SchedulesListPage } from '@/modules/schedules/components/SchedulesListPage';

export const metadata: Metadata = { title: 'Jadwal Pengiriman' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.schedulesRead}>
      <SchedulesListPage />
    </RequirePermission>
  );
}
