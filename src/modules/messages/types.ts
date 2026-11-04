export type MessageStatus =
  'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export type CancelReason =
  | 'paid'
  | 'opted_out'
  | 'exempt'
  | 'phone_invalid'
  | 'expired'
  | 'superseded'
  | 'manual'
  | 'escalated';

export type MessageStudent = {
  id: number;
  nim: string;
  name: string;
};

export type MessageRecord = {
  id: number;
  student: MessageStudent;
  /** The log never exposes the full number. */
  phone_masked: string | null;
  invoice_id: number;
  rule_id: number | null;
  kind: string;
  /** `YYYY-MM-DD` */
  scheduled_date: string;
  /** The rendered text as it was (or will be) sent. */
  body: string;
  status: MessageStatus;
  cancel_reason: CancelReason | null;
  attempts: number;
  error: string | null;
  queued_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
};

export type MessageFilters = {
  status?: MessageStatus;
  /** `YYYY-MM-DD`, on the scheduled date */
  date_from?: string;
  /** `YYYY-MM-DD`, on the scheduled date */
  date_to?: string;
};

export type ManualRecipientItem = {
  invoice_id: number;
  invoice_code: string;
  student_id: number;
  student_name: string;
  nim: string;
  phone_masked: string | null;
  study_program: string | null;
  cohort: string | null;
  semester: string;
  amount: number;
  due_date: string;
  invoice_status: string;
  is_eligible: boolean;
  exclude_reason: string | null;
};

export type ExcludedBreakdown = {
  paid: number;
  opted_out: number;
  exempt: number;
  invalid_phone: number;
  already_queued: number;
};

export type SamplePreview = {
  student_name: string;
  nim: string;
  phone_masked: string | null;
  invoice_code: string;
  amount: number;
  body: string;
};

export type ManualMessagePreviewRequest = {
  template_id: number;
  cohort?: string;
  study_program?: string;
  semester?: string;
  amount_min?: number;
  amount_max?: number;
  status?: string;
  search?: string;
  invoice_ids?: number[];
};

export type ManualMessagePreviewResponse = {
  total_matched: number;
  eligible_count: number;
  excluded_count: number;
  excluded_breakdown: ExcludedBreakdown;
  sample_preview: SamplePreview | null;
  items: ManualRecipientItem[];
};

export type ManualMessageSendRequest = {
  template_id: number;
  cohort?: string;
  study_program?: string;
  semester?: string;
  amount_min?: number;
  amount_max?: number;
  status?: string;
  search?: string;
  invoice_ids?: number[];
};

export type ManualMessageSendResponse = {
  batch_ref: string;
  queued_count: number;
  excluded_count: number;
  total_matched: number;
};

export type ManualFilterOptions = {
  cohorts: string[];
  study_programs: string[];
  semesters: string[];
};
