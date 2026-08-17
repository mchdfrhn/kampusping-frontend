export const formatNumber = (value: number, locale = 'id-ID') =>
  new Intl.NumberFormat(locale).format(value);

export const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
