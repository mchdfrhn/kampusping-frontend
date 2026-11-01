export type AuditEventRecord = {
  id: number;
  /** Email of the user who did it (or a system label). */
  actor: string;
  /** Machine-readable code such as `import.applied`. */
  action: string;
  entity: string;
  /** Always text, whatever the entity's own id type. */
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  at: string;
};

/** Exact-match filters (the server compares with `=`, not `LIKE`). */
export type AuditFilters = {
  action?: string;
  entity?: string;
};
