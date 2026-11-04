import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { messagesService } from '@/modules/messages/services/messages.service';
import { templatesService } from '@/modules/templates/services/templates.service';

import Page from './page';

vi.mock('@/modules/messages/services/messages.service', () => ({
  messagesService: {
    getFilterOptions: vi.fn(),
    previewManual: vi.fn(),
    sendManual: vi.fn(),
  },
}));

vi.mock('@/modules/templates/services/templates.service', () => ({
  templatesService: {
    list: vi.fn(),
  },
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
  vi.mocked(templatesService.list).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
  });
  vi.mocked(messagesService.getFilterOptions).mockResolvedValue({
    cohorts: [],
    study_programs: [],
    semesters: [],
  });
});

describe('manual send page guard', () => {
  it('shows the no-access state without messages:send', () => {
    signIn(['messages:read']);
    renderPage();

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(messagesService.getFilterOptions).not.toHaveBeenCalled();
  });

  it('renders the manual send page with messages:send', async () => {
    signIn(['messages:send']);
    renderPage();

    expect(await screen.findByText('Kirim Pesan Manual')).toBeInTheDocument();
    expect(messagesService.getFilterOptions).toHaveBeenCalled();
  });
});
