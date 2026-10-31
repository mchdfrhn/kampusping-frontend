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
