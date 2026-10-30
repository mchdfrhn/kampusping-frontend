import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/id';

import { appConfig } from '@/core/config/app.config';

dayjs.locale(appConfig.locale);

/** Format used by date pickers. */
export const DATE_INPUT_FORMAT = 'DD MMM YYYY';
/** Format the API expects for date-only query parameters. */
export const DATE_API_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'DD MMM YYYY';
export const DISPLAY_DATETIME_FORMAT = 'DD MMM YYYY, HH:mm';

type DateInput = string | Date | Dayjs | null | undefined;

const parse = (value: Exclude<DateInput, null | undefined>): Dayjs => dayjs(value);

/**
 * The API returns timezone-aware ISO timestamps (UTC). dayjs converts them to the viewer's local
 * time zone when formatting, so no manual offset is needed.
 */
export const formatDisplayDateTime = (value: DateInput, emptyText = '-'): string => {
  if (!value) return emptyText;
  const parsed = parse(value);
  return parsed.isValid() ? parsed.format(DISPLAY_DATETIME_FORMAT) : emptyText;
};

export const formatDisplayDate = (value: DateInput, emptyText = '-'): string => {
  if (!value) return emptyText;
  const parsed = parse(value);
  return parsed.isValid() ? parsed.format(DISPLAY_DATE_FORMAT) : emptyText;
};

/** Suffix for export file names, e.g. `2026-10-30`. */
export const formatExportDateSuffix = (): string => dayjs().format(DATE_API_FORMAT);
