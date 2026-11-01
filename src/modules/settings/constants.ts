export const CAMPUS_NAME_MAX_LENGTH = 150;
export const FINANCE_CONTACT_MAX_LENGTH = 255;
export const PAYMENT_LINK_MAX_LENGTH = 500;
export const PAYMENT_GUIDE_MAX_LENGTH = 1000;

export const MAX_ATTEMPTS_MIN = 1;
export const MAX_ATTEMPTS_MAX = 10;
/** The API stores these as 32-bit integers. */
export const INTEGER_MAX = 2_147_483_647;

/** ISO weekday numbers (1 = Monday) with their Indonesian names, in display order. */
export const WEEKDAYS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 7, label: 'Minggu' },
] as const;

export const AUTO_SEND_CONFIRM_TITLE = 'Aktifkan pengiriman otomatis?';
export const AUTO_SEND_CONFIRM_LABEL = 'Aktifkan pengiriman otomatis';
export const AUTO_SEND_CONFIRM_MESSAGE =
  'Pesan penagihan akan dikirim otomatis ke nomor WhatsApp mahasiswa selama jam kirim yang diatur. ' +
  'Gunakan nomor WhatsApp khusus, bukan nomor utama kampus, karena sambungan WhatsApp tidak resmi ' +
  'yang dipakai aplikasi ini dapat membuat nomor diblokir oleh WhatsApp. ' +
  'Pengaman tetap berlaku: jeda antar pesan, batas harian, jam kirim, dan permintaan berhenti (STOP) dari mahasiswa.';
