import type { Metadata } from 'next';

import { RequirePermission } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { MessagesListPage } from '@/modules/messages/components/MessagesListPage';

export const metadata: Metadata = { title: 'Pengiriman' };

export default function Page() {
  return (
    <RequirePermission permission={permissions.messagesRead}>
      <MessagesListPage />
    </RequirePermission>
  );
}
