import { describe, expect, it } from 'vitest';

import { safeNextPath } from './navigation.util';

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
