export type PhoneStatus = 'valid' | 'invalid' | 'missing';

export type StudentRecord = {
  id: number;
  nim: string;
  name: string;
  study_program: string | null;
  cohort: string | null;
  phone: string | null;
  phone_status: PhoneStatus;
  opted_out_at: string | null;
  opted_out_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentFilters = {
  study_program?: string;
  cohort?: string;
  phone_status?: PhoneStatus;
};
