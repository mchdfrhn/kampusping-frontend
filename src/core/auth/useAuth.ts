'use client';

import { hasAnyPermission, hasPermission } from './permissions';
import { useAuthStore } from './auth.store';

export const useAuth = () => {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  return { status, user, isAuthenticated: status === 'authenticated' };
};

/** True when the signed-in user holds every listed permission. UI convenience only. */
export const usePermission = (...required: string[]): boolean => {
  const user = useAuthStore((state) => state.user);
  return hasPermission(user, ...required);
};

export const useAnyPermission = (...candidates: string[]): boolean => {
  const user = useAuthStore((state) => state.user);
  return hasAnyPermission(user, ...candidates);
};
