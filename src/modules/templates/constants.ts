export const TEMPLATE_NAME_MAX_LENGTH = 100;
export const TEMPLATE_BODY_MAX_LENGTH = 2000;

/** Wait this long after the last keystroke before asking the server for a preview. */
export const PREVIEW_DEBOUNCE_MS = 400;

/** Shown in the list instead of the whole body. */
export const BODY_EXCERPT_LENGTH = 80;

/** Variables the server accepts (`templates/rendering.py` `ALLOWED_VARIABLES`). */
export const TEMPLATE_VARIABLES = [
  'nama',
  'nim',
  'semester',
  'nominal',
  'rincian',
  'tanggal_jatuh_tempo',
  'cara_bayar',
  'link_pembayaran',
  'kontak_keuangan',
  'nama_kampus',
  'salam',
] as const;

/** Hover hints for variables whose value is not obvious from the name. */
export const TEMPLATE_VARIABLE_HINTS: Partial<Record<(typeof TEMPLATE_VARIABLES)[number], string>> =
  {
    salam: 'Selamat pagi/siang/sore/malam, sesuai jam pesan terkirim',
  };
