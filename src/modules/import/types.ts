/** Mirrors `app/modules/imports/schema.py` in the backend. */
export type ImportSource = 'siakad' | 'sipema';

export type ImportStatus = 'preview' | 'applied' | 'discarded' | 'rolled_back';

/** `rekap` is SIAKAD's "Rekap Tunggakan": arrears only, so paid invoices vanish from the file. */
export type ImportKind = 'standard' | 'rekap';

/** Why an applied import cannot be rolled back now; `null` when it can. */
export type ImportRollbackBlock = 'no_change_log' | 'not_latest';

export type ImportSummary = {
  rows_total: number;
  rows_valid: number;
  rows_error: number;
  students_new: number;
  students_updated: number;
  invoices_new: number;
  invoices_updated: number;
  invoices_skipped: number;
  // Absent on batches created before the rekap review existed.
  invoices_unchanged?: number;
  paid_suspected?: number;
  /** 1 when so many invoices vanished at once that the export is probably partial. */
  incomplete_warning?: number;
  /** Only on an applied batch. */
  invoices_paid_by_absence?: number;
};

export type ImportBatch = {
  id: number;
  source: ImportSource;
  file_name: string;
  semester: string | null;
  status: ImportStatus;
  kind: ImportKind;
  summary: ImportSummary;
  created_at: string;
  created_by: string | null;
  applied_at: string | null;
  has_change_log: boolean;
  rolled_back_at: string | null;
  /** Only filled on the list and detail endpoints. */
  rollback_block: ImportRollbackBlock | null;
};

export type ImportRowError = {
  row_number: number;
  field: string;
  message: string;
};

/** A row changed since the import; field names only, never values. */
export type RollbackConflict = {
  entity: 'student' | 'invoice';
  label: string;
  fields: string[];
};

export type RollbackPreview = {
  students_deleted: number;
  invoices_deleted: number;
  students_reverted: number;
  invoices_reverted: number;
  queued_messages_cancelled: number;
  sent_messages: number;
  conflicts: RollbackConflict[];
  conflicts_total: number;
};

export type ImportDetailCategory = 'new' | 'changed' | 'suspected_paid';

export type ImportDetailNew = {
  invoice_code: string;
  nim: string;
  name: string | null;
  semester: string;
  amount: number;
};

export type ImportDetailChanged = {
  invoice_id: number;
  invoice_code: string;
  nim: string;
  name: string | null;
  semester: string;
  /** Field name -> [stored value, incoming value]. */
  fields: Record<string, [unknown, unknown]>;
};

export type ImportDetailSuspectedPaid = {
  invoice_id: number;
  invoice_code: string;
  nim: string;
  name: string;
  study_program: string | null;
  semester: string;
  amount: number;
};

export type ImportDetailItem<C extends ImportDetailCategory> = C extends 'new'
  ? ImportDetailNew
  : C extends 'changed'
    ? ImportDetailChanged
    : ImportDetailSuspectedPaid;
