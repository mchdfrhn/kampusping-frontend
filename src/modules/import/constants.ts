import type { ImportRollbackBlock, ImportSource, ImportStatus } from './types';

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
  // `Dibatalkan` already means a discarded preview, so a rolled-back import reads differently.
  rolled_back: 'Dikembalikan',
};

/** Same texts as the backend (`MSG_ROLLBACK_NO_LOG`, `MSG_ROLLBACK_NOT_LATEST`). */
export const IMPORT_ROLLBACK_BLOCK_LABELS: Record<ImportRollbackBlock, string> = {
  no_change_log: 'Impor ini diterapkan sebelum fitur rollback ada dan tidak dapat dibatalkan.',
  not_latest: 'Batalkan impor yang lebih baru lebih dulu.',
};
