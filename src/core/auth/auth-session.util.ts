'use client';

import { verifyUserIam, fetchAuthSession, type AuthSession } from '@/core/iam/iam.service';
import { storageKeys } from '@/core/constants/storage.constant';
import { hasDeveloperRole } from '@/core/helpers/rolesdivision';
import { storage } from '@/core/utils/storage.util';

import type { EnrichedAuthUser, IamAuthUser } from './auth.type';

export type { EnrichedAuthUser } from './auth.type';

const mergeSessionIntoUser = (user: IamAuthUser, session: AuthSession): EnrichedAuthUser => ({
  ...user,
  has_app_access: session.has_access,
  is_group_admin: session.is_group_admin,
  display_role: session.display_role ?? undefined,
  app_role: session.app_role ?? undefined,
  division_role_ids: session.division_role_ids,
  dealer_code: session.dealer_code ?? null,
  dealer_name: session.dealer_name ?? null,
});

export const enrichUserWithAuthSession = async (
  user: IamAuthUser,
  accessToken: string,
): Promise<EnrichedAuthUser> => {
  const session = await fetchAuthSession(accessToken);
  if (!session) {
    return { ...user, has_app_access: false };
  }
  return mergeSessionIntoUser(user, session);
};

export const persistEnrichedUser = async (user: IamAuthUser, accessToken: string): Promise<EnrichedAuthUser> => {
  const enriched = await enrichUserWithAuthSession(user, accessToken);
  storage.set(storageKeys.currentUser, JSON.stringify(enriched));
  return enriched;
};

export const readStoredEnrichedUser = (): EnrichedAuthUser | null => {
  const raw = storage.get(storageKeys.currentUser);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EnrichedAuthUser;
  } catch {
    return null;
  }
};

export const userHasAppAccess = (user?: EnrichedAuthUser | null): boolean => Boolean(user?.has_app_access);

export const userIsGroupAdmin = (user?: EnrichedAuthUser | null): boolean =>
  hasDeveloperRole(user ?? readStoredEnrichedUser());
