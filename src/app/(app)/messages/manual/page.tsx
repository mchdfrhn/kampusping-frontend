import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { ManualSendPage } from '@/modules/messages/components/ManualSendPage';

export const metadata: Metadata = { title: 'Kirim Pesan Manual' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.messagesSend}>
      <ManualSendPage />
    </RequirePermission>
  );
}
