import type { RoleSummary } from '@/core/auth/auth.type';

export type UserRecord = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: RoleSummary[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserCreatePayload = {
  email: string;
  full_name: string;
  password: string;
  is_active: boolean;
  role_ids: number[];
};

export type UserUpdatePayload = {
  full_name: string;
  is_active: boolean;
  role_ids: number[];
  /** Omit to keep the current password. */
  password?: string;
};
