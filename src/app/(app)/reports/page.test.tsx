import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { reportsService } from '@/modules/reports/services/reports.service';

import Page from './page';

vi.mock('@/modules/reports/services/reports.service', () => ({
  reportsService: { options: vi.fn(), preview: vi.fn(), download: vi.fn() },
}));

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

const renderPage = () =>
  render(
    <NotifyProvider>
      <Page />
    </NotifyProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reportsService.options).mockResolvedValue({ semesters: [] });
  vi.mocked(reportsService.preview).mockReturnValue(new Promise(() => undefined));
});

describe('reports page guard', () => {
  it('shows the no-access state without reports:read and calls nothing', () => {
    signIn(['dashboard:read']);
    renderPage();

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(reportsService.preview).not.toHaveBeenCalled();
    expect(reportsService.options).not.toHaveBeenCalled();
  });

  it('renders the report page with reports:read', async () => {
    signIn(['reports:read']);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Laporan Penagihan' })).toBeInTheDocument();
  });
});
