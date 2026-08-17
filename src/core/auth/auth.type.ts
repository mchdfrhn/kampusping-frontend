import type { AuthSession } from '@/core/iam/iam.service';

export type IamAuthUser = {
  name?: string;
  email?: string;
  username?: string;
  user?: IamAuthUser;
  rolesdivision?: Array<{ role?: { id?: number } }>;
  [key: string]: unknown;
};

export type EnrichedAuthUser = IamAuthUser & {
  has_app_access?: boolean;
  is_group_admin?: boolean;
  display_role?: string;
  app_role?: AuthSession['app_role'];
  division_role_ids?: number[];
  dealer_code?: string | null;
  dealer_name?: string | null;
};

export type AuthUser = EnrichedAuthUser;
