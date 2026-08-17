import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/id';

dayjs.extend(customParseFormat);

export const DATE_INPUT_FORMAT = 'DD-MM-YYYY';
export const DATE_API_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'DD MMMM YYYY';
export const DISPLAY_DATETIME_FORMAT = 'DD MMMM YYYY HH:mm';

/** Used only for export filenames (today's date in Jakarta). */
export const APP_TIMEZONE = 'Asia/Jakarta';

const API_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_TIMEZONE_SUFFIX = /[zZ]|[+-]\d{2}:?\d{2}$/;

const stripTimezoneSuffix = (value: string) => value.replace(HAS_TIMEZONE_SUFFIX, '');

const normalizeApiDateTimeInput = (value: string) => {
  const withoutTz = stripTimezoneSuffix(value.trim());
  const withoutFraction = withoutTz.replace(/\.\d+/, '');
  return withoutFraction.includes('T') ? withoutFraction : withoutFraction.replace(' ', 'T');
};

/** Parse API date (YYYY-MM-DD) as calendar date without timezone shifting. */
export const parseApiDate = (value: string | Date | Dayjs): Dayjs => {
  if (dayjs.isDayjs(value)) return value;
  if (value instanceof Date) return dayjs(value);
  const trimmed = value.trim();
  if (!trimmed) return dayjs('');
  if (API_DATE_ONLY.test(trimmed)) {
    return dayjs(trimmed, DATE_API_FORMAT, true);
  }
  return dayjs(value);
};

/**
 * Parse API datetime values stored as WIB wall clock.
 * No UTC conversion or +7 offset is applied.
 */
export const parseApiDateTime = (value: string | Date | Dayjs): Dayjs => {
  if (dayjs.isDayjs(value)) return value;
  if (value instanceof Date) return dayjs(value);
  const trimmed = value.trim();
  if (!trimmed) return dayjs('');

  if (API_DATE_ONLY.test(trimmed)) {
    return dayjs(trimmed, DATE_API_FORMAT, true);
  }

  const normalized = normalizeApiDateTimeInput(trimmed);
  const parsed = dayjs(normalized, 'YYYY-MM-DDTHH:mm:ss', true);
  if (parsed.isValid()) {
    return parsed;
  }

  return dayjs(trimmed);
};

export const formatDate = (
  value: string | Date | Dayjs | null | undefined,
  format = DATE_INPUT_FORMAT,
  emptyText = '-',
) => {
  if (!value) return emptyText;
  const parsed =
    typeof value === 'string' && API_DATE_ONLY.test(value.trim())
      ? parseApiDate(value)
      : dayjs(value);
  return parsed.isValid() ? parsed.format(format) : emptyText;
};

export const formatDisplayDate = (
  value: string | Date | Dayjs | null | undefined,
  emptyText = '-',
) => {
  if (!value) return emptyText;
  const parsed = typeof value === 'string' ? parseApiDate(value) : dayjs(value);
  if (!parsed.isValid()) return emptyText;
  return parsed.locale('id').format(DISPLAY_DATE_FORMAT);
};

export const formatDisplayDateTime = (
  value: string | Date | Dayjs | null | undefined,
  emptyText = '-',
) => {
  if (!value) return emptyText;
  const parsed = typeof value === 'string' || value instanceof Date ? parseApiDateTime(value) : value;
  if (!parsed.isValid()) {
    return typeof value === 'string' ? value.trim() : emptyText;
  }
  return parsed.locale('id').format(DISPLAY_DATETIME_FORMAT);
};

export const formatDisplayDateValue = (value: unknown) =>
  formatDisplayDate(typeof value === 'string' || value instanceof Date ? value : null);

/** Suffix for export filenames, e.g. 29-06-2026 (today in Asia/Jakarta). */
export const formatExportDateSuffix = (): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('day')}-${get('month')}-${get('year')}`;
};

export const buildExportFileName = (baseName: string, extension: 'xlsx' | 'pdf') =>
  `${baseName}-${formatExportDateSuffix()}.${extension}`;
