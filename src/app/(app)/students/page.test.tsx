import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { studentsService } from '@/modules/students/services/students.service';

import Page from './page';

vi.mock('@/modules/students/services/students.service', () => ({
  studentsService: { list: vi.fn(), updatePhone: vi.fn() },
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
  vi.mocked(studentsService.list).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
  });
});

describe('students page guard', () => {
  it('shows the no-access state without students:read', () => {
    signIn(['invoices:read']);
    renderPage();

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(studentsService.list).not.toHaveBeenCalled();
  });

  it('renders the list with students:read', async () => {
    signIn(['students:read']);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Mahasiswa' })).toBeInTheDocument();
  });
});
