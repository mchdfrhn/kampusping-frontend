/** Counts and rupiah sums. `overdue` is a subset of `unpaid`. */
export type InvoiceSummary = {
  total: number;
  total_amount: number;
  paid: number;
  paid_amount: number;
  unpaid: number;
  unpaid_amount: number;
  overdue: number;
  overdue_amount: number;
};

export type MessageSummary = {
  queued: number;
  sending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  cancelled: number;
};

export type WarningsSummary = {
  paused_reason: string | null;
  auto_send_enabled: boolean;
};

/** `GET /dashboard/summary`: aggregates only, never student, invoice or message detail. */
export type DashboardSummary = {
  invoices: InvoiceSummary;
  messages: MessageSummary;
  warnings: WarningsSummary;
  semester: string | null;
  generated_at: string;
};
