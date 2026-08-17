import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/layout/DashboardShell';

import SettingsGuard from './settings-guard';

export default function SettingsRootLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <SettingsGuard>{children}</SettingsGuard>
    </DashboardShell>
  );
}
