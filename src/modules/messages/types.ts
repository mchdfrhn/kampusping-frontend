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
