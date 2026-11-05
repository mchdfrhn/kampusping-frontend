import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { permissions } from '@/core/auth/permissions';

import type { Permission } from '../types';
import { RoleFormDialog } from './RoleFormDialog';

const GROUP_TITLES: Record<string, string> = {
  users: 'Pengguna',
  roles: 'Peran',
  dashboard: 'Dasbor',
  imports: 'Impor tagihan',
  students: 'Mahasiswa',
  invoices: 'Tagihan',
  templates: 'Templat pesan',
  schedules: 'Jadwal pengingat',
  messages: 'Riwayat pesan',
  settings: 'Pengaturan',
  audit: 'Jejak audit',
  reports: 'Laporan penagihan',
};

const catalog: Permission[] = Object.values(permissions).map((code, index) => ({
  id: index + 1,
  code,
  description: `Deskripsi ${code}`,
}));

describe('RoleFormDialog permission groups', () => {
  it('titles every permission group in Indonesian, never the raw resource code', () => {
    render(<RoleFormDialog open permissions={catalog} onClose={vi.fn()} onSubmit={vi.fn()} />);

    for (const title of Object.values(GROUP_TITLES)) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    for (const resource of Object.keys(GROUP_TITLES)) {
      expect(screen.queryByText(resource)).not.toBeInTheDocument();
    }
    expect(new Set(catalog.map((item) => item.code.split(':')[0]))).toEqual(
      new Set(Object.keys(GROUP_TITLES)),
    );
  });
});
