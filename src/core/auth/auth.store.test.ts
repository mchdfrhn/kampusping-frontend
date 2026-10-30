import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authService } from './auth.service';
import { refreshSession, useAuthStore } from './auth.store';
import type { AuthUser, TokenResponse } from './auth.type';

vi.mock('./auth.service', () => ({
  authService: { login: vi.fn(), refresh: vi.fn(), logout: vi.fn() },
}));

const user: AuthUser = {
  id: 1,
  email: 'admin@example.com',
  full_name: 'Admin',
  is_active: true,
  roles: [{ id: 1, name: 'admin' }],
  permissions: ['users:read'],
  last_login_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const session = (token = 'access-1'): TokenResponse => ({
  access_token: token,
  token_type: 'bearer',
  expires_in: 900,
  user,
});

const service = vi.mocked(authService);

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ status: 'idle', user: null, accessToken: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAuthStore', () => {
  it('bootstraps an authenticated session from the refresh cookie', async () => {
    service.refresh.mockResolvedValue(session());

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'access-1',
      user: { email: 'admin@example.com' },
    });
  });

  it('becomes anonymous when there is no valid refresh cookie', async () => {
    service.refresh.mockRejectedValue(new Error('401'));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState()).toMatchObject({
      status: 'anonymous',
      user: null,
      accessToken: null,
    });
  });

  it('bootstraps only once', async () => {
    service.refresh.mockResolvedValue(session());

    await Promise.all([useAuthStore.getState().bootstrap(), useAuthStore.getState().bootstrap()]);
    await useAuthStore.getState().bootstrap();

    expect(service.refresh).toHaveBeenCalledTimes(1);
  });

  it('logs in and keeps the token in memory only', async () => {
    service.login.mockResolvedValue(session('access-2'));

    await useAuthStore.getState().login({ email: 'admin@example.com', password: 'x' });

    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'access-2',
    });
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('leaves the state untouched when login fails', async () => {
    service.login.mockRejectedValue(new Error('Invalid email or password.'));

    await expect(useAuthStore.getState().login({ email: 'a@b.co', password: 'x' })).rejects.toThrow(
      'Invalid email or password.',
    );

    expect(useAuthStore.getState().status).toBe('idle');
  });

  it('signs out locally even if the server call fails', async () => {
    useAuthStore.setState({ status: 'authenticated', user, accessToken: 't' });
    service.logout.mockRejectedValue(new Error('network'));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      status: 'anonymous',
      user: null,
      accessToken: null,
    });
  });
});

describe('refreshSession', () => {
  it('shares one request between concurrent callers', async () => {
    let resolve!: (value: TokenResponse) => void;
    service.refresh.mockReturnValue(new Promise<TokenResponse>((r) => (resolve = r)));

    const results = Promise.all([refreshSession(), refreshSession(), refreshSession()]);
    resolve(session('shared'));

    await expect(results).resolves.toEqual([true, true, true]);
    expect(service.refresh).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe('shared');
  });

  it('allows a new refresh once the previous one finished', async () => {
    service.refresh.mockResolvedValue(session());

    await refreshSession();
    await refreshSession();

    expect(service.refresh).toHaveBeenCalledTimes(2);
  });

  it('resolves false instead of throwing when the refresh is rejected', async () => {
    service.refresh.mockRejectedValue(new Error('expired'));

    await expect(refreshSession()).resolves.toBe(false);
  });
});
