'use client';

import { create } from 'zustand';

import { registerAuthBridge } from '@/core/http/api-client';

import { authService } from './auth.service';
import type { AuthStatus, AuthUser, LoginCredentials, TokenResponse } from './auth.type';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  /** In memory only. A page reload recovers the session through the refresh cookie. */
  accessToken: string | null;
  /** Restore the session on first load. Safe to call repeatedly. */
  bootstrap: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  /** Replace the stored user, e.g. after the profile was edited. */
  setUser: (user: AuthUser) => void;
  /** Drop the session locally (no network call). */
  clear: () => void;
};

const LOCK_NAME = 'webapp-auth-refresh';

/**
 * Serialise refreshes across browser tabs. Refresh tokens rotate, so two tabs refreshing at once
 * would look like token reuse and sign the user out; the lock makes the second tab wait and then
 * use the cookie the first one just received.
 */
const withTabLock = <T>(task: () => Promise<T>): Promise<T> =>
  typeof navigator !== 'undefined' && navigator.locks
    ? (navigator.locks.request(LOCK_NAME, task) as Promise<T>)
    : task();

const applySession = (session: TokenResponse) => ({
  status: 'authenticated' as const,
  user: session.user,
  accessToken: session.access_token,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,

  bootstrap: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'loading' });
    const renewed = await refreshSession();
    if (!renewed) set({ status: 'anonymous', user: null, accessToken: null });
  },

  login: async (credentials) => {
    set(applySession(await authService.login(credentials)));
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // The server session may already be gone; signing out locally is what matters.
    }
    get().clear();
  },

  setUser: (user) => set({ user }),

  clear: () => set({ status: 'anonymous', user: null, accessToken: null }),
}));

let inFlight: Promise<boolean> | null = null;

/** Renew the access token. Concurrent callers share a single request. */
export const refreshSession = (): Promise<boolean> => {
  inFlight ??= withTabLock(async () => {
    try {
      useAuthStore.setState(applySession(await authService.refresh()));
      return true;
    } catch {
      return false;
    }
  }).finally(() => {
    inFlight = null;
  });
  return inFlight;
};

registerAuthBridge({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refresh: refreshSession,
  onAuthFailure: () => useAuthStore.getState().clear(),
});
