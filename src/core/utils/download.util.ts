const parseContentDispositionFilename = (header: string | null): string | null => {
  if (!header) return null;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const basicMatch = /filename="?([^";]+)"?/i.exec(header);
  return basicMatch?.[1] ?? null;
};

export const downloadResponseFile = async (
  response: Response,
  fallbackFileName: string,
): Promise<void> => {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const detail = err.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Failed to export data');
  }

  const blob = await response.blob();
  const fileName =
    parseContentDispositionFilename(response.headers.get('content-disposition')) ||
    fallbackFileName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
