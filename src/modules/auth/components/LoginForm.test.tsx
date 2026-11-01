import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authService } from '@/core/auth/auth.service';
import { useAuthStore } from '@/core/auth/auth.store';
import { ApiError } from '@/core/http/api-error';

import { LoginForm } from './LoginForm';

const replace = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));

vi.mock('@/core/auth/auth.service', () => ({
  authService: { login: vi.fn(), refresh: vi.fn(), logout: vi.fn() },
}));

const service = vi.mocked(authService);

const tokenResponse = {
  access_token: 'token',
  token_type: 'bearer',
  expires_in: 900,
  user: {
    id: 1,
    email: 'admin@example.com',
    full_name: 'Admin',
    is_active: true,
    roles: [],
    permissions: [],
    last_login_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
};

const fill = async (email: string, password: string) => {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText(/email/i), email);
  if (password) await user.type(screen.getByLabelText(/^kata sandi/i), password);
  await user.click(screen.getByRole('button', { name: /^masuk$/i }));
};

beforeEach(() => {
  vi.resetAllMocks();
  search = '';
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
});

describe('LoginForm', () => {
  it('validates before calling the API', async () => {
    render(<LoginForm />);

    await fill('not-an-email', '');

    expect(await screen.findByText('Format email tidak valid')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument();
    expect(service.login).not.toHaveBeenCalled();
  });

  it('shows the server message when credentials are rejected', async () => {
    service.login.mockRejectedValue(
      new ApiError('Email atau kata sandi salah.', 401, 'unauthorized'),
    );
    render(<LoginForm />);

    await fill('admin@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau kata sandi salah.');
    expect(replace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('signs in and returns to the requested page', async () => {
    service.login.mockResolvedValue(tokenResponse);
    search = 'next=%2Fusers';
    render(<LoginForm />);

    await fill('admin@example.com', 'Correct-horse-9');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/users'));
    expect(service.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'Correct-horse-9',
    });
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  const withPermissions = (permissions: string[]) => ({
    ...tokenResponse,
    user: { ...tokenResponse.user, permissions },
  });

  it('ignores an external redirect target and lands on the dashboard for dashboard:read', async () => {
    service.login.mockResolvedValue(withPermissions(['dashboard:read']));
    search = `next=${encodeURIComponent('https://evil.example')}`;
    render(<LoginForm />);

    await fill('admin@example.com', 'Correct-horse-9');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('lands on the first page the user may open when there is no next target', async () => {
    service.login.mockResolvedValue(withPermissions(['students:read', 'messages:read']));
    render(<LoginForm />);

    await fill('admin@example.com', 'Correct-horse-9');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/students'));
    expect(replace).not.toHaveBeenCalledWith('/dashboard');
  });

  it('falls back to the profile for a user without any page permission', async () => {
    service.login.mockResolvedValue(withPermissions([]));
    search = `next=${encodeURIComponent('//evil.example')}`;
    render(<LoginForm />);

    await fill('admin@example.com', 'Correct-horse-9');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/profile'));
  });

  it('can reveal the password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const field = screen.getByLabelText(/^kata sandi/i);
    expect(field).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /tampilkan kata sandi/i }));

    expect(field).toHaveAttribute('type', 'text');
  });
});
