import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { StudentsListPage } from '@/modules/students/components/StudentsListPage';

export const metadata: Metadata = { title: 'Mahasiswa' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.studentsRead}>
      <StudentsListPage />
    </RequirePermission>
  );
}
