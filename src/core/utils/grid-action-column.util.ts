const ACTION_ICON_SLOT = 40;
const ACTION_ICON_GAP = 8;
const ACTION_COLUMN_PADDING = 24;

export const STATUS_COLUMN_MIN = 108;
const STATUS_COLUMN_MAX = 240;
const STATUS_CHAR_WIDTH = 8;
const STATUS_COLUMN_PADDING = 36;

export function getStatusColumnWidth(statusNames: Iterable<string | null | undefined>): number {
  let longest = 'Status'.length;
  for (const name of statusNames) {
    longest = Math.max(longest, (name || '-').length);
  }
  const estimated = longest * STATUS_CHAR_WIDTH + STATUS_COLUMN_PADDING;
  return Math.min(STATUS_COLUMN_MAX, Math.max(STATUS_COLUMN_MIN, estimated));
}

export function getActionColumnWidth(buttonCount: number): number {
  if (buttonCount <= 0) return 72;
  const width =
    ACTION_COLUMN_PADDING + buttonCount * ACTION_ICON_SLOT + (buttonCount - 1) * ACTION_ICON_GAP;
  return Math.max(72, width);
}
