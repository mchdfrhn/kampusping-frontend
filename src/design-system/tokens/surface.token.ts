/**
 * Theme-aware tints built from the CSS variables MUI generates for the active color scheme, so they
 * follow light/dark mode without hardcoded hex values. Because the result is opaque when a base is
 * given, it is safe for sticky table cells that scroll over other content.
 */
const PAPER = 'var(--mui-palette-background-paper)';

/** CSS variable for the brand color of the active scheme, for use in gradients. */
export const PRIMARY = 'var(--mui-palette-primary-main)';

/** `percent`% of a palette token (e.g. `primary-main`) over `base`. */
export const mixToken = (token: string, percent: number, base = 'transparent'): string =>
  `color-mix(in srgb, var(--mui-palette-${token}) ${percent}%, ${base})`;

export const surfaceTokens = {
  zebra: mixToken('text-primary', 3, PAPER),
  hover: mixToken('primary-main', 8, PAPER),
  scrollbarThumb: mixToken('text-primary', 25, PAPER),
  scrollbarTrack: mixToken('text-primary', 6, PAPER),
} as const;
