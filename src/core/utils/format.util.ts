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
