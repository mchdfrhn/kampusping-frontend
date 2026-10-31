import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { appConfig } from '@/core/config/app.config';

import { DashboardPage } from './DashboardPage';

const signIn = (roles: { id: number; name: string }[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, full_name: 'Budi Santoso', roles, permissions: [] } as unknown as AuthUser,
  });

beforeEach(() => {
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
});

describe('DashboardPage', () => {
  it('greets the user in Indonesian and names the configured app', () => {
    signIn([{ id: 1, name: 'admin' }]);

    render(<DashboardPage />);

    expect(
      screen.getByRole('heading', { name: 'Selamat datang kembali, Budi' }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Selamat datang di ${appConfig.appName}.`)).toBeInTheDocument();
    expect(screen.getByText('Akses Anda')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('tells a user without roles to ask an administrator', () => {
    signIn([]);

    render(<DashboardPage />);

    expect(
      screen.getByText(
        'Belum ada peran yang diberikan. Hubungi administrator untuk mendapatkan akses.',
      ),
    ).toBeInTheDocument();
  });
});
