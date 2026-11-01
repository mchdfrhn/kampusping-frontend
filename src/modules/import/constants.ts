import type { ImportSource, ImportStatus } from './types';

/** Same limits as the backend (`imports/parser.py`, `imports/validation.py`); the server decides. */
export const IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const IMPORT_SEMESTER_MAX = 20;
export const IMPORT_ACCEPT = '.csv,.xlsx';

export const IMPORT_SOURCE_LABELS: Record<ImportSource, string> = {
  siakad: 'SIAKAD/Civitas',
  sipema: 'SIPEMA',
};

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  preview: 'Pratinjau',
  applied: 'Diterapkan',
  discarded: 'Dibatalkan',
};
