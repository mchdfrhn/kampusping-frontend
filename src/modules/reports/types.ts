export type ReportPreset = 'weekly' | 'semester';
export type ReportFormat = 'xlsx' | 'pdf';

/** `overdue` and `exempt` are disjoint subsets of `unpaid`; percentages have one decimal. */
export type InvoiceFigures = {
  total: number;
  total_amount: number;
  paid: number;
  paid_amount: number;
  unpaid: number;
  unpaid_amount: number;
  overdue: number;
  overdue_amount: number;
  exempt: number;
  exempt_amount: number;
  paid_percent_count: number;
  paid_percent_amount: number;
};

export type MessageFigures = {
  queued: number;
  sending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  cancelled: number;
};

export type PaymentsInPeriod = { count: number; amount: number };

export type ReportSummary = {
  invoices: InvoiceFigures;
  messages: MessageFigures;
  paid_after_message: number;
  /** Only the weekly preset has a payment window. */
  payments_in_period: PaymentsInPeriod | null;
};

export type ReportGroup = {
  study_program: string;
  cohort: string;
  total: number;
  paid: number;
  unpaid: number;
  overdue: number;
  overdue_amount: number;
  paid_percent: number;
};

/** `GET /reports/billing`: the report without the arrears rows, so without personal data. */
export type ReportPreview = {
  preset: ReportPreset;
  semester: string | null;
  period_start: string | null;
  period_end: string | null;
  generated_at: string;
  generated_by: string;
  summary: ReportSummary;
  groups: ReportGroup[];
  arrears_count: number;
};

export type ReportOptions = { semesters: string[] };
