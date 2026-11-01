import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { AuditLogPage } from '@/modules/audit/components/AuditLogPage';

export const metadata: Metadata = { title: 'Log Audit' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.auditRead}>
      <AuditLogPage />
    </RequirePermission>
  );
}
