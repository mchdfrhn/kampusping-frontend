/** `0` -> `H`, `-7` -> `H-7`, `3` -> `H+3`: the label staff use for "days from the due date". */
export const formatOffsetLabel = (offsetDays: number): string => {
  if (offsetDays === 0) return 'H';
  return offsetDays < 0 ? `H-${-offsetDays}` : `H+${offsetDays}`;
};

/** The same offset in words, e.g. for a tooltip. */
export const describeOffset = (offsetDays: number): string => {
  if (offsetDays === 0) return 'pada hari jatuh tempo';
  return offsetDays < 0
    ? `${-offsetDays} hari sebelum jatuh tempo`
    : `${offsetDays} hari setelah jatuh tempo`;
};
