import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { invoicesService } from '@/modules/invoices/services/invoices.service';

import Page from './page';

vi.mock('@/modules/invoices/services/invoices.service', () => ({
  invoicesService: { list: vi.fn(), setStatus: vi.fn() },
}));

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

const renderPage = () =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
      <NotifyProvider>
        <Page />
      </NotifyProvider>
    </LocalizationProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(invoicesService.list).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
  });
});

describe('invoices page guard', () => {
  it('shows the no-access state without invoices:read', () => {
    signIn(['students:read']);
    renderPage();

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(invoicesService.list).not.toHaveBeenCalled();
  });

  it('renders the list with invoices:read', async () => {
    signIn(['invoices:read']);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Tagihan' })).toBeInTheDocument();
  });
});
