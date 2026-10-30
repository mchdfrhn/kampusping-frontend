export type Role = {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  /** Permission codes, e.g. "users:read". */
  permissions: string[];
  created_at: string;
  updated_at: string;
};

export type Permission = {
  id: number;
  code: string;
  description: string;
};

export type RoleUpsertPayload = {
  name: string;
  description: string;
  permissions: string[];
};
