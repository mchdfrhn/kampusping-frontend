import { describe, expect, it } from 'vitest';

import { FILE_EXTENSION_MESSAGE, FILE_SIZE_MESSAGE, validateImportFile } from './validation';

const file = (name: string, size = 10) => {
  const result = new File(['x'], name);
  Object.defineProperty(result, 'size', { value: size });
  return result;
};

describe('validateImportFile', () => {
  it('accepts .csv and .xlsx in any letter case, up to exactly 5 MB', () => {
    expect(validateImportFile(file('tagihan.csv'))).toBeNull();
    expect(validateImportFile(file('TAGIHAN.XLSX'))).toBeNull();
    expect(validateImportFile(file('batas.csv', 5 * 1024 * 1024))).toBeNull();
  });

  it('rejects other extensions, including a csv hidden in the middle of the name', () => {
    expect(validateImportFile(file('tagihan.txt'))).toBe(FILE_EXTENSION_MESSAGE);
    expect(validateImportFile(file('tagihan.xls'))).toBe(FILE_EXTENSION_MESSAGE);
    expect(validateImportFile(file('tagihan.csv.exe'))).toBe(FILE_EXTENSION_MESSAGE);
  });

  it('rejects files over 5 MB', () => {
    expect(validateImportFile(file('besar.csv', 5 * 1024 * 1024 + 1))).toBe(FILE_SIZE_MESSAGE);
  });
});
