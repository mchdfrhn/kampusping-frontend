import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/layout/DashboardShell';

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
