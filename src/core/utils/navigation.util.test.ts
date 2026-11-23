import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import { describe, expect, it } from 'vitest';

import { permissions } from '@/core/auth/permissions';
import { menuConfig } from '@/core/config/menu.config';

import {
  filterMenuByPermission,
  firstAccessibleRoute,
  postLoginPath,
  safeNextPath,
} from './navigation.util';

describe('safeNextPath', () => {
  it('keeps in-app paths, including query strings', () => {
    expect(safeNextPath('/users')).toBe('/users');
    expect(safeNextPath('/users?status=active')).toBe('/users?status=active');
  });

  it('falls back when missing', () => {
    expect(safeNextPath(null)).toBe('/dashboard');
    expect(safeNextPath(undefined)).toBe('/dashboard');
    expect(safeNextPath('')).toBe('/dashboard');
    expect(safeNextPath(null, '/home')).toBe('/home');
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'users',
    '/ok\nSet-Cookie: x=1',
  ])('rejects open-redirect attempt %j', (value) => {
    expect(safeNextPath(value)).toBe('/dashboard');
  });
});

const labelsOf = (groups: ReturnType<typeof filterMenuByPermission>) =>
  groups.flatMap((group) => group.items.map((item) => item.label));

describe('filterMenuByPermission', () => {
  it('hides Impor Data without imports:read and shows it with it', () => {
    const without = filterMenuByPermission(menuConfig, { permissions: ['dashboard:read'] });
    const withRead = filterMenuByPermission(menuConfig, {
      permissions: ['dashboard:read', permissions.importsRead],
    });

    expect(labelsOf(without)).toContain('Dasbor');
    expect(labelsOf(without)).not.toContain('Impor Data');
    expect(labelsOf(withRead)).toContain('Impor Data');
  });

  it('shows Laporan right after Dasbor only with reports:read', () => {
    const without = filterMenuByPermission(menuConfig, { permissions: ['dashboard:read'] });
    const withRead = filterMenuByPermission(menuConfig, {
      permissions: ['dashboard:read', permissions.reportsRead],
    });

    expect(labelsOf(without)).not.toContain('Laporan');
    expect(labelsOf(withRead).slice(0, 2)).toEqual(['Dasbor', 'Laporan']);
  });

  it('drops groups that end up empty and shows nothing without a user', () => {
    const groups = filterMenuByPermission(menuConfig, { permissions: [permissions.usersRead] });

    expect(groups.map((group) => group.title)).toEqual(['Administrasi']);
    expect(labelsOf(groups)).toEqual(['Pengguna']);
    expect(filterMenuByPermission(menuConfig, null)).toEqual([]);
  });

  it('keeps items without a permission requirement for any signed-in user', () => {
    const groups = filterMenuByPermission(
      [{ items: [{ label: 'Profil', path: '/profile', icon: DashboardOutlinedIcon }] }],
      { permissions: [] },
    );

    expect(labelsOf(groups)).toEqual(['Profil']);
  });

  it('lists the Indonesian groups and entries in order for a user with every permission', () => {
    const groups = filterMenuByPermission(menuConfig, {
      permissions: Object.values(permissions),
    });

    expect(groups.map((group) => [group.title, group.items.map((item) => item.label)])).toEqual([
      [
        'Penagihan',
        ['Dasbor', 'Laporan', 'Impor Data', 'Mahasiswa', 'Tagihan', 'Pengiriman', 'Kirim Manual'],
      ],
      ['Pengaturan Pesan', ['Template Pesan', 'Jadwal']],
      ['Administrasi', ['Pengaturan', 'Pengguna', 'Peran', 'Audit']],
    ]);
  });
});

describe('firstAccessibleRoute', () => {
  it('sends an administrator with every permission to the dashboard', () => {
    expect(firstAccessibleRoute({ permissions: Object.values(permissions) })).toBe('/dashboard');
  });

  it('keeps the dashboard as the landing page of a pimpinan who also has the report permissions', () => {
    const pimpinan = [
      permissions.dashboardRead,
      permissions.reportsRead,
      permissions.reportsExport,
    ];

    expect(firstAccessibleRoute({ permissions: pimpinan })).toBe('/dashboard');
    expect(firstAccessibleRoute({ permissions: [permissions.reportsRead] })).toBe('/reports');
    expect(firstAccessibleRoute({ permissions: [permissions.reportsExport] })).toBe('/profile');
  });

  it('sends a user who may only read students to the student list', () => {
    expect(firstAccessibleRoute({ permissions: [permissions.studentsRead] })).toBe('/students');
  });

  it('falls back to the profile, which every signed-in user may open', () => {
    expect(firstAccessibleRoute({ permissions: [] })).toBe('/profile');
    expect(firstAccessibleRoute(null)).toBe('/profile');
    expect(firstAccessibleRoute(undefined)).toBe('/profile');
  });

  it('ignores permissions that open no page, such as update-only ones', () => {
    expect(firstAccessibleRoute({ permissions: [permissions.studentsUpdate] })).toBe('/profile');
  });

  it('follows the menu order, not the order of the permissions', () => {
    const permissionsInReverse = [
      permissions.auditRead,
      permissions.usersRead,
      permissions.settingsRead,
      permissions.invoicesRead,
    ];

    expect(firstAccessibleRoute({ permissions: permissionsInReverse })).toBe('/invoices');
    expect(
      firstAccessibleRoute({
        permissions: [permissions.auditRead, permissions.usersRead, permissions.settingsRead],
      }),
    ).toBe('/settings');
    expect(
      firstAccessibleRoute({ permissions: [permissions.auditRead, permissions.usersRead] }),
    ).toBe('/users');
  });

  it('returns the first item without a permission requirement of a custom menu', () => {
    const menu = [
      {
        items: [
          { label: 'Rahasia', path: '/secret', icon: DashboardOutlinedIcon, permission: 'x:read' },
          { label: 'Bantuan', path: '/help', icon: DashboardOutlinedIcon },
        ],
      },
    ];

    expect(firstAccessibleRoute({ permissions: [] }, menu)).toBe('/help');
    expect(firstAccessibleRoute({ permissions: ['x:read'] }, menu)).toBe('/secret');
  });
});

describe('postLoginPath', () => {
  const pimpinan = {
    permissions: [permissions.dashboardRead, permissions.reportsRead, permissions.reportsExport],
  };

  it('sends a pimpinan to the dashboard when next points at a page they may not open', () => {
    expect(postLoginPath('/users', pimpinan)).toBe('/dashboard');
    expect(postLoginPath('/users/12', pimpinan)).toBe('/dashboard');
    expect(postLoginPath('/settings?tab=wa', pimpinan)).toBe('/dashboard');
  });

  it('keeps next when the user may open it, including sub-pages and query strings', () => {
    expect(postLoginPath('/reports?year=2026', pimpinan)).toBe('/reports?year=2026');
    const staff = { permissions: [permissions.studentsRead] };
    expect(postLoginPath('/students/42', staff)).toBe('/students/42');
  });

  it('checks the most specific menu path, so Kirim Manual needs messages:send', () => {
    const reader = { permissions: [permissions.messagesRead] };
    expect(postLoginPath('/messages', reader)).toBe('/messages');
    expect(postLoginPath('/messages/manual', reader)).toBe('/messages');
    const sender = { permissions: [permissions.messagesSend] };
    expect(postLoginPath('/messages/manual', sender)).toBe('/messages/manual');
  });

  it('does not treat a shared prefix as a sub-page', () => {
    const reader = { permissions: [permissions.reportsRead] };
    expect(postLoginPath('/reportsx', reader)).toBe('/reportsx');
    expect(postLoginPath('/users-old', pimpinan)).toBe('/users-old');
  });

  it('keeps pages outside the menu, such as the profile, open to everyone', () => {
    expect(postLoginPath('/profile', pimpinan)).toBe('/profile');
  });

  it('falls back to the first accessible page for a missing or unsafe next', () => {
    expect(postLoginPath(null, pimpinan)).toBe('/dashboard');
    expect(postLoginPath('https://evil.example', pimpinan)).toBe('/dashboard');
    expect(postLoginPath('//evil.example', pimpinan)).toBe('/dashboard');
  });
});
