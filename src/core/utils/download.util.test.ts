import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { saveBlob } from './download.util';

describe('saveBlob', () => {
  const createObjectURL = vi.fn(() => 'blob:laporan');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it('clicks a temporary link that downloads the blob under the given file name', () => {
    const clicked: { href: string; download: string; attached: boolean }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({
        href: this.href,
        download: this.download,
        attached: document.body.contains(this),
      });
    });
    const blob = new Blob(['isi'], { type: 'application/pdf' });

    saveBlob(blob, 'laporan-penagihan-mingguan-20261102.pdf');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked).toEqual([
      { href: 'blob:laporan', download: 'laporan-penagihan-mingguan-20261102.pdf', attached: true },
    ]);
  });

  it('removes the link and releases the object URL afterwards', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    saveBlob(new Blob(['x']), 'a.xlsx');

    expect(document.querySelector('a[download]')).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:laporan');
  });
});
