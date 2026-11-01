import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { InvoicesListPage } from '@/modules/invoices/components/InvoicesListPage';

export const metadata: Metadata = { title: 'Tagihan' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.invoicesRead}>
      <InvoicesListPage />
    </RequirePermission>
  );
}
