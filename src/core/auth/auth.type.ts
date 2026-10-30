export type RoleSummary = {
  id: number;
  name: string;
};

/** The signed-in user as returned by `/auth/login`, `/auth/refresh` and `/auth/me`. */
export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: RoleSummary[];
  /** Flattened permission codes. Used for display logic only; the API enforces access. */
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  /** Access token lifetime in seconds. */
  expires_in: number;
  user: AuthUser;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';
