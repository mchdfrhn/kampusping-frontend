import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { TemplatesListPage } from '@/modules/templates/components/TemplatesListPage';

export const metadata: Metadata = { title: 'Template Pesan' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.templatesRead}>
      <TemplatesListPage />
    </RequirePermission>
  );
}
