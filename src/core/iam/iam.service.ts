import { appConfig } from '@/core/config/app.config';
import { envConfig } from '@/core/config/env.config';
import { storageKeys } from '@/core/constants/storage.constant';
import { storage } from '@/core/utils/storage.util';

import type { AuthUser } from '@/core/auth/auth.type';

export type MenuApiItem = {
  id: number;
  label?: string;
  link?: string;
  slug?: string;
  sort?: number;
  icon?: string | null;
  type?: string | null;
  items?: MenuApiItem[];
};

const iamBase = () => envConfig.iamBaseUrl.replace(/\/$/, '');
const apiBase = () => envConfig.apiBaseUrl.replace(/\/$/, '');

const authHeaders = (accessToken?: string): HeadersInit => {
  const token = accessToken ?? storage.get(storageKeys.accessToken);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const verifyUserIam = async (accessToken: string): Promise<AuthUser | null> => {
  if (!envConfig.iamBaseUrl) return null;

  const controller = new AbortController();
  const timeoutId =
    typeof window !== 'undefined' ? window.setTimeout(() => controller.abort(), 15000) : undefined;

  try {
    const response = await fetch(`${iamBase()}/v1/verify-user`, {
      method: 'POST',
      headers: authHeaders(accessToken),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return (await response.json()) as AuthUser;
  } catch {
    return null;
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};

export const getMenu = async (): Promise<MenuApiItem[]> => {
  if (!envConfig.iamBaseUrl || !appConfig.launcherId) return [];
  const response = await fetch(`${iamBase()}/v1/menu/${appConfig.launcherId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? (data as MenuApiItem[]) : [];
};

export const getMenuMapping = async (menuId: number | string): Promise<{ slug?: string } | null> => {
  const response = await fetch(`${apiBase()}/menus-mapping?menu_id=${menuId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data) return null;
  return Array.isArray(data) ? (data[0] as { slug?: string }) : (data as { slug?: string });
};

export type AuthSession = {
  has_access: boolean;
  is_group_admin: boolean;
  division_role_ids: number[];
  display_role: string | null;
  dealer_code?: string | null;
  dealer_name?: string | null;
  app_role: {
    id: number;
    iam_role_id: number;
    display_name: string;
    auth_slug?: string | null;
    sort_order: number;
    is_active: boolean;
  } | null;
  matched_roles: AuthSession['app_role'][];
};

/** Validate rolesdivision against app_allowed_roles table on backend. */
export const fetchAuthSession = async (accessToken?: string): Promise<AuthSession | null> => {
  if (!envConfig.apiBaseUrl) return null;

  const controller = new AbortController();
  const timeoutId =
    typeof window !== 'undefined' ? window.setTimeout(() => controller.abort(), 10000) : undefined;

  try {
    const response = await fetch(`${apiBase()}/auth/session`, {
      headers: authHeaders(accessToken),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as AuthSession;
  } catch {
    return null;
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};

export type AppAllowedRole = {
  id: number;
  iam_role_id: number;
  display_name: string;
  auth_slug?: string | null;
  role_type: string;
  sort_order: number;
  is_active: boolean;
};

export type MenuMappingRow = {
  id: number;
  menu_id: number;
  slug: string;
};

const jsonHeaders = (accessToken?: string): HeadersInit => ({
  ...authHeaders(accessToken),
  'Content-Type': 'application/json',
});

export const listAppRoles = async (): Promise<AppAllowedRole[]> => {
  const response = await fetch(`${apiBase()}/app-roles`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to load app roles');
  return response.json();
};

export const createAppRole = async (payload: Omit<AppAllowedRole, 'id'>): Promise<AppAllowedRole> => {
  const response = await fetch(`${apiBase()}/app-roles`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create app role');
  return response.json();
};

export const updateAppRole = async (id: number, payload: Partial<AppAllowedRole>): Promise<AppAllowedRole> => {
  const response = await fetch(`${apiBase()}/app-roles/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update app role');
  return response.json();
};

export const deleteAppRole = async (id: number): Promise<void> => {
  const response = await fetch(`${apiBase()}/app-roles/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete app role');
};

export const listMenuMappings = async (): Promise<MenuMappingRow[]> => {
  const response = await fetch(`${apiBase()}/menus-mapping`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to load menu mappings');
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
};

export const createMenuMapping = async (payload: { menu_id: number; slug: string }): Promise<MenuMappingRow> => {
  const response = await fetch(`${apiBase()}/menus-mapping`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create menu mapping');
  return response.json();
};

export const updateMenuMapping = async (
  id: number,
  payload: { menu_id?: number; slug?: string },
): Promise<MenuMappingRow> => {
  const response = await fetch(`${apiBase()}/menus-mapping/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update menu mapping');
  return response.json();
};

export const deleteMenuMapping = async (id: number): Promise<void> => {
  const response = await fetch(`${apiBase()}/menus-mapping/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete menu mapping');
};

