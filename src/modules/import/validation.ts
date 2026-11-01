import { z } from 'zod';

import { IMPORT_MAX_FILE_BYTES, IMPORT_SEMESTER_MAX } from './constants';

export const FILE_REQUIRED_MESSAGE = 'Pilih berkas .csv atau .xlsx.';
export const FILE_EXTENSION_MESSAGE =
  'Format berkas tidak didukung. Gunakan berkas .csv atau .xlsx.';
export const FILE_SIZE_MESSAGE = 'Ukuran berkas melebihi batas 5 MB.';

/**
 * Quick client-side check so an obviously wrong file never travels over the network. The server
 * repeats and extends these checks and stays the authority.
 */
export const validateImportFile = (file: File): string | null => {
  if (!/\.(csv|xlsx)$/i.test(file.name)) return FILE_EXTENSION_MESSAGE;
  if (file.size > IMPORT_MAX_FILE_BYTES) return FILE_SIZE_MESSAGE;
  return null;
};

export const importUploadSchema = z.object({
  source: z.enum(['siakad', 'sipema']),
  semester: z.string().trim().max(IMPORT_SEMESTER_MAX, `Maksimal ${IMPORT_SEMESTER_MAX} karakter`),
  file: z.custom<File | null>().superRefine((file, ctx) => {
    const message = file instanceof File ? validateImportFile(file) : FILE_REQUIRED_MESSAGE;
    if (message) ctx.addIssue({ code: 'custom', message });
  }),
});

export type ImportUploadValues = z.infer<typeof importUploadSchema>;
