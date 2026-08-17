'use client';

import { useEffect, useState } from 'react';

import { bootstrapAuthSession, redirectWhenUnauthenticated } from '@/core/auth/auth.service';
import { userHasAppAccess } from '@/core/auth/auth-session.util';
import { appConfig } from '@/core/config/app.config';
import { storageKeys } from '@/core/constants/storage.constant';
import { extractRolesDivisionRoleIds } from '@/core/helpers/rolesdivision';
import { clearSidebarMenuCache } from '@/core/layout/sidebar-menu.util';
import { storage } from '@/core/utils/storage.util';

type AuthBootstrapState = {
  loading: boolean;
  error: string | null;
  noAccess: boolean;
};

export const useAuthBootstrap = (): AuthBootstrapState => {
  const [state, setState] = useState<AuthBootstrapState>({
    loading: true,
    error: null,
    noAccess: false,
  });

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const session = await bootstrapAuthSession(url);

        if (!session.token || !session.user) {
          if (appConfig.allowLocalDevWithoutAuth) {
            setState({ loading: false, error: null, noAccess: false });
            return;
          }
          redirectWhenUnauthenticated();
          return;
        }

        if (session.source === 'url') {
          clearSidebarMenuCache();
        }

        const hasAccess = userHasAppAccess(session.user);
        if (process.env.NODE_ENV === 'development') {
          console.info('[auth] access check', {
            source: session.source,
            hasAccess,
            divisionRoleIds: extractRolesDivisionRoleIds(session.user),
            appRole: session.user.app_role,
            isGroupAdmin: session.user.is_group_admin,
          });
        }

        if (!hasAccess) {
          setState({ loading: false, error: null, noAccess: true });
          return;
        }

        setState({ loading: false, error: null, noAccess: false });
      } catch (err) {
        console.error('[useAuthBootstrap] Failed to initialize auth', err);

        const storedUser = storage.get(storageKeys.currentUser);
        if (storedUser && storage.get(storageKeys.accessToken)) {
          try {
            const parsed = JSON.parse(storedUser);
            if (userHasAppAccess(parsed)) {
              setState({ loading: false, error: null, noAccess: false });
              return;
            }
          } catch {
            // ignore
          }
        }

        if (appConfig.allowLocalDevWithoutAuth) {
          setState({ loading: false, error: null, noAccess: false });
          return;
        }

        redirectWhenUnauthenticated();
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    void run();
  }, []);

  return state;
};
