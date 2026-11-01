import { appConfig } from '@/core/config/app.config';

export const formatNumber = (value: number, locale = appConfig.locale) =>
  new Intl.NumberFormat(locale).format(value);

export const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

/** Initials for avatars: first letters of the first two words, e.g. "Jane Doe" -> "JD". */
export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

const RUPIAH_LOCALE = 'id-ID';
const rupiahNumber = new Intl.NumberFormat(RUPIAH_LOCALE, { maximumFractionDigits: 0 });

/** Whole rupiah with dot grouping and no space, e.g. `Rp1.250.000`; negatives read `-Rp5`. */
export const formatRupiah = (amount: number): string => {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}Rp${rupiahNumber.format(Math.abs(rounded))}`;
};
