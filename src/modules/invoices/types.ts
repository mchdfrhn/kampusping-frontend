export type InvoiceStatus = 'paid' | 'unpaid';

/** Where an invoice row came from; also the channel a payment was made through. */
export type InvoiceSource = 'siakad' | 'sipema';

export type InvoiceStudent = {
  id: number;
  nim: string;
  name: string;
};

export type InvoiceRecord = {
  id: number;
  invoice_code: string;
  student: InvoiceStudent;
  semester: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  paid_at: string | null;
  paid_via: InvoiceSource | null;
  source: InvoiceSource;
  exempt_reason: string | null;
  exempt_until: string | null;
  escalated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceFilters = {
  status?: InvoiceStatus;
  semester?: string;
  /** `YYYY-MM-DD` */
  due_from?: string;
  /** `YYYY-MM-DD` */
  due_to?: string;
};

export type InvoiceDeletePreviewItem = {
  id: number;
  invoice_code: string;
  student_nim: string;
  student_name: string;
  semester: string;
  amount: number;
  due_date: string;
  status: string;
};

export type InvoiceDeleteByFilePreview = {
  total_codes_in_file: number;
  found_count: number;
  not_found_count: number;
  affected_messages_count: number;
  found_invoices: InvoiceDeletePreviewItem[];
  not_found_codes: string[];
};

export type InvoiceDeleteByFileResult = {
  deleted_invoices_count: number;
  affected_messages_count: number;
  not_found_count: number;
};
