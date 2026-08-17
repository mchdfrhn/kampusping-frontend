import { appConfig } from '@/core/config/app.config';
import { storageKeys } from '@/core/constants/storage.constant';
import { verifyUserIam } from '@/core/iam/iam.service';
import { storage } from '@/core/utils/storage.util';

import type { AuthUser, EnrichedAuthUser, IamAuthUser } from './auth.type';
import { persistEnrichedUser, readStoredEnrichedUser } from './auth-session.util';

export type { AuthUser, EnrichedAuthUser, IamAuthUser } from './auth.type';

type AuthPayload = {
  access_token?: string;
};

const parseAuthParam = (authParam: string | null): string | null => {
  if (!authParam) return null;

  const attempts = [authParam, decodeURIComponent(authParam)];
  for (const raw of attempts) {
    try {
      const parsed = JSON.parse(raw) as AuthPayload;
      if (parsed.access_token) return parsed.access_token;
    } catch {
      // try next format
    }
  }

  return null;
};

export const resolveAccessToken = (url: URL): string | null => {
  return parseAuthParam(url.searchParams.get('auth')) ?? storage.get(storageKeys.accessToken);
};

export type AuthBootstrapResult = {
  user: AuthUser | null;
  token: string | null;
  source: 'url' | 'storage' | 'none';
};

/**
 * Bootstrap auth session:
 * - verify IAM user
 * - validate rolesdivision against app_allowed_roles via /auth/session
 */
export const bootstrapAuthSession = async (url: URL): Promise<AuthBootstrapResult> => {
  const tokenFromUrl = parseAuthParam(url.searchParams.get('auth'));
  const tokenFromStorage = storage.get(storageKeys.accessToken);
  const token = tokenFromUrl ?? tokenFromStorage;

  if (!token) {
    return { user: null, token: null, source: 'none' };
  }

  storage.set(storageKeys.accessToken, token);

  if (tokenFromUrl) {
    const user = await verifyUserIam(token);
    const savedUser = user ? await persistEnrichedUser(user, token) : null;
    removeAuthParamFromUrl(url);
    storage.remove(storageKeys.iamMenus);
    return { user: savedUser ?? readStoredEnrichedUser(), token, source: 'url' };
  }

  const storedUser = readStoredEnrichedUser();
  if (storedUser) {
    void verifyUserIam(token).then(async (freshUser) => {
      if (freshUser) await persistEnrichedUser(freshUser, token);
    });

    if (storedUser.has_app_access === undefined || !('dealer_code' in storedUser)) {
      const enriched = await persistEnrichedUser(storedUser, token);
      return { user: enriched, token, source: 'storage' };
    }

    return { user: storedUser, token, source: 'storage' };
  }

  const user = await verifyUserIam(token);
  const savedUser = user ? await persistEnrichedUser(user, token) : null;
  return { user: savedUser, token, source: 'storage' };
};

export const persistAuth = async (accessToken: string): Promise<AuthUser | null> => {
  storage.set(storageKeys.accessToken, accessToken);
  const user = await verifyUserIam(accessToken);
  if (user) return persistEnrichedUser(user, accessToken);
  return user;
};

export const clearAllAuthStorage = (): void => {
  storage.clear();
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
};

const clearAuthCookies = (): void => {
  if (typeof window === 'undefined') return;
  try {
    document.cookie
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
  } catch {
    // ignore
  }
};

/** Same cleanup as asset management handleNoAccessConfirm. */
export const confirmNoAccessAndRedirectToMasterApp = (): void => {
  clearAllAuthStorage();
  clearAuthCookies();
  window.location.assign(appConfig.masterAppUrl || '/');
};

export const clearAuthAndRedirect = (): void => {
  clearAllAuthStorage();
  clearAuthCookies();
  window.location.assign(appConfig.masterLogoutUrl || appConfig.masterAppUrl || '/');
};

export const clearAuthAndRedirectToMasterApp = (): void => {
  confirmNoAccessAndRedirectToMasterApp();
};

export const removeAuthParamFromUrl = (url: URL): void => {
  if (!url.searchParams.has('auth')) return;
  url.searchParams.delete('auth');
  const query = url.searchParams.toString();
  window.history.replaceState({}, '', `${url.pathname}${query ? `?${query}` : ''}${url.hash}`);
};

export const getStoredUser = (): AuthUser | null => readStoredEnrichedUser();

export const getUserDisplayName = (user?: AuthUser | null): string | null => {
  const source = user ?? getStoredUser();
  if (!source) return null;
  const name = source.name || source.full_name || source.username || null;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
};

export const getUserEmail = (user?: AuthUser | null): string | null => {
  const source = user ?? getStoredUser();
  if (!source?.email) return null;
  return typeof source.email === 'string' && source.email.trim() ? source.email.trim() : null;
};

export const getUserRoleLabel = (user?: AuthUser | null): string | null => {
  const source = user ?? getStoredUser();
  if (!source) return null;

  const displayRole = source.display_role ?? source.app_role?.display_name;
  if (typeof displayRole === 'string' && displayRole.trim()) return displayRole.trim();

  return null;
};

export const getUserDealerCode = (user?: AuthUser | null): string | null => {
  const source = user ?? getStoredUser();
  if (!source?.dealer_code) return null;
  return typeof source.dealer_code === 'string' && source.dealer_code.trim()
    ? source.dealer_code.trim()
    : null;
};

export const getUserDealerName = (user?: AuthUser | null): string | null => {
  const source = user ?? getStoredUser();
  if (!source?.dealer_name) return null;
  return typeof source.dealer_name === 'string' && source.dealer_name.trim()
    ? source.dealer_name.trim()
    : null;
};

export const redirectToMasterApp = (): void => {
  window.location.assign(appConfig.masterAppUrl || '/');
};

export const redirectWhenUnauthenticated = (): void => {
  window.location.assign(appConfig.masterLogoutUrl || appConfig.masterAppUrl || '/');
};
