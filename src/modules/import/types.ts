/** Mirrors `app/modules/imports/schema.py` in the backend. */
export type ImportSource = 'siakad' | 'sipema';

export type ImportStatus = 'preview' | 'applied' | 'discarded';

export type ImportSummary = {
  rows_total: number;
  rows_valid: number;
  rows_error: number;
  students_new: number;
  students_updated: number;
  invoices_new: number;
  invoices_updated: number;
  invoices_skipped: number;
};

export type ImportBatch = {
  id: number;
  source: ImportSource;
  file_name: string;
  semester: string | null;
  status: ImportStatus;
  summary: ImportSummary;
  created_at: string;
  created_by: string | null;
  applied_at: string | null;
};

export type ImportRowError = {
  row_number: number;
  field: string;
  message: string;
};
