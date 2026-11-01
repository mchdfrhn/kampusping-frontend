import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Page from '@/app/page';
import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/',
}));

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
});

describe('home page', () => {
  it('sends a user with dashboard:read to the dashboard', async () => {
    signIn(['dashboard:read', 'students:read']);
    render(<Page />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('sends a user without dashboard:read to the first page they may open', async () => {
    signIn(['invoices:read', 'messages:read']);
    render(<Page />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/invoices'));
    expect(replace).not.toHaveBeenCalledWith('/dashboard');
  });

  it('sends a user with no page permissions to their profile', async () => {
    signIn([]);
    render(<Page />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/profile'));
  });

  it('sends an anonymous visitor to the login page and never into the app', async () => {
    render(<Page />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
