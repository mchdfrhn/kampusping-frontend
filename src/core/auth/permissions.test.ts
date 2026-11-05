import { describe, expect, it } from 'vitest';

import { hasAnyPermission, hasPermission, permissions } from './permissions';

const user = { permissions: [permissions.usersRead, permissions.usersUpdate] };

describe('hasPermission', () => {
  it('requires every listed permission', () => {
    expect(hasPermission(user, permissions.usersRead)).toBe(true);
    expect(hasPermission(user, permissions.usersRead, permissions.usersUpdate)).toBe(true);
    expect(hasPermission(user, permissions.usersRead, permissions.usersDelete)).toBe(false);
  });

  it('denies when there is no user or nothing is granted', () => {
    expect(hasPermission(null, permissions.usersRead)).toBe(false);
    expect(hasPermission(undefined, permissions.usersRead)).toBe(false);
    expect(hasPermission({ permissions: [] }, permissions.usersRead)).toBe(false);
  });

  it('is true for an empty requirement when signed in', () => {
    expect(hasPermission(user)).toBe(true);
  });
});

describe('hasAnyPermission', () => {
  it('needs at least one match', () => {
    expect(hasAnyPermission(user, permissions.usersDelete, permissions.usersUpdate)).toBe(true);
    expect(hasAnyPermission(user, permissions.usersDelete, permissions.rolesRead)).toBe(false);
    expect(hasAnyPermission(null, permissions.usersRead)).toBe(false);
  });
});

describe('permissions catalog', () => {
  it('mirrors the backend codes as unique resource:action strings', () => {
    const codes = Object.values(permissions);

    expect(codes).toHaveLength(31);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[a-z]+:[a-z]+$/);
    expect(permissions.dashboardRead).toBe('dashboard:read');
    expect(permissions.messagesSend).toBe('messages:send');
    expect(permissions.messagesCancel).toBe('messages:cancel');
    expect(permissions.auditRead).toBe('audit:read');
    expect(permissions.reportsRead).toBe('reports:read');
    expect(permissions.reportsExport).toBe('reports:export');
  });
});
