import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';

import { Can, RequirePermission } from './RequirePermission';

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as AuthUser,
  });

beforeEach(() => {
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
});

describe('RequirePermission', () => {
  it('renders the page for users who hold the permission', () => {
    signIn(['users:read']);

    render(
      <RequirePermission permission="users:read">
        <p>Secret page</p>
      </RequirePermission>,
    );

    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });

  it('shows an access message instead of the page otherwise', () => {
    signIn(['examples:read']);

    render(
      <RequirePermission permission="users:read">
        <p>Secret page</p>
      </RequirePermission>,
    );

    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
    expect(screen.getByText(/don.t have access/i)).toBeInTheDocument();
  });

  it('requires every permission when given several', () => {
    signIn(['users:read']);

    render(
      <RequirePermission permission={['users:read', 'users:update']}>
        <p>Secret page</p>
      </RequirePermission>,
    );

    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });
});

describe('Can', () => {
  it('renders children only when the permission is held', () => {
    signIn(['users:create']);

    render(
      <>
        <Can permission="users:create">
          <button>Create</button>
        </Can>
        <Can permission="users:delete">
          <button>Delete</button>
        </Can>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('renders nothing for anonymous visitors', () => {
    render(
      <Can permission="users:create">
        <button>Create</button>
      </Can>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
