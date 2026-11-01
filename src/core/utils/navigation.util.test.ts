import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import { describe, expect, it } from 'vitest';

import { permissions } from '@/core/auth/permissions';
import { menuConfig } from '@/core/config/menu.config';

import { filterMenuByPermission, safeNextPath } from './navigation.util';

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
      ['Penagihan', ['Dasbor', 'Impor Data', 'Mahasiswa', 'Tagihan', 'Pengiriman']],
      ['Pengaturan Pesan', ['Template Pesan', 'Jadwal']],
      ['Administrasi', ['Pengaturan', 'Pengguna', 'Peran', 'Audit']],
    ]);
  });
});
