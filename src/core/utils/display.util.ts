import type { ReactNode } from 'react';

export const formatOptionalText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return text;
};

export const joinOptionalParts = (
  parts: Array<string | null | undefined>,
  separator = ' - ',
): string => {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
};

export const isEmptyDisplayValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === false) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
};

export const compactDetailRows = <T extends { label: string; value: ReactNode }>(rows: T[]): T[] =>
  rows.filter((row) => !isEmptyDisplayValue(row.value));
