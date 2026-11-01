import type { PhoneStatus } from './types';

/** Mirrors `PHONE_INPUT_MAX_LENGTH` in the backend (`students/constants.py`); the server decides. */
export const PHONE_INPUT_MAX_LENGTH = 50;

/** Sortable columns accepted by `GET /students` (`students/repository.py`). */
export const STUDENT_SORT_FIELDS = [
  'nim',
  'name',
  'study_program',
  'cohort',
  'created_at',
  'updated_at',
] as const;

export const PHONE_STATUS_LABELS: Record<PhoneStatus, string> = {
  valid: 'Valid',
  invalid: 'Tidak valid',
  missing: 'Kosong',
};

export const PHONE_STATUS_TONES: Record<PhoneStatus, 'success' | 'error' | 'warning'> = {
  valid: 'success',
  invalid: 'error',
  missing: 'warning',
};

export const PHONE_STATUS_OPTIONS = (Object.keys(PHONE_STATUS_LABELS) as PhoneStatus[]).map(
  (value) => ({ value, label: PHONE_STATUS_LABELS[value] }),
);

export const OPTED_OUT_YES = 'Ya';
export const OPTED_OUT_NO = 'Tidak';
