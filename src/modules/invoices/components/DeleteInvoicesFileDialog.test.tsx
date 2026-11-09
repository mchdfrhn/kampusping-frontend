import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { invoicesService } from '../services/invoices.service';
import type { InvoiceDeleteByFilePreview } from '../types';
import { DeleteInvoicesFileDialog } from './DeleteInvoicesFileDialog';

vi.mock('../services/invoices.service', () => ({
  invoicesService: {
    previewDeleteByFile: vi.fn(),
    deleteByCodes: vi.fn(),
    deleteByFile: vi.fn(),
  },
}));

const service = vi.mocked(invoicesService);

const mockPreview: InvoiceDeleteByFilePreview = {
  total_codes_in_file: 3,
  found_count: 2,
  not_found_count: 1,
  affected_messages_count: 1,
  found_invoices: [
    {
      id: 1,
      invoice_code: 'INV-001',
      student_nim: '2021001',
      student_name: 'Budi Santoso',
      semester: '2024/2025 Ganjil',
      amount: 1500000,
      due_date: '2024-12-01',
      status: 'unpaid',
    },
    {
      id: 2,
      invoice_code: 'INV-002',
      student_nim: '2021002',
      student_name: 'Siti Aminah',
      semester: '2024/2025 Ganjil',
      amount: 2000000,
      due_date: '2024-12-01',
      status: 'unpaid',
    },
  ],
  not_found_codes: ['INV-999'],
};

const renderDialog = (props = { open: true, onClose: vi.fn(), onSuccess: vi.fn() }) =>
  render(
    <NotifyProvider>
      <DeleteInvoicesFileDialog {...props} />
    </NotifyProvider>,
  );

describe('DeleteInvoicesFileDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload interface and shows preview when file is selected', async () => {
    service.previewDeleteByFile.mockResolvedValue(mockPreview);
    renderDialog();

    expect(screen.getByRole('dialog', { name: /hapus tagihan via berkas/i })).toBeInTheDocument();
    expect(screen.getByText(/pilih berkas untuk menghapus tagihan/i)).toBeInTheDocument();

    const file = new File(['kode tagihan\nINV-001\nINV-002\nINV-999'], 'tagihan.csv', {
      type: 'text/csv',
    });
    const fileInput = screen.getByTestId('delete-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(service.previewDeleteByFile).toHaveBeenCalledWith(file);
    });

    expect(await screen.findByText(/total kode tagihan di berkas:/i)).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hapus 2 tagihan/i })).toBeInTheDocument();
  });

  it('calls deleteByCodes when confirm button is clicked', async () => {
    service.previewDeleteByFile.mockResolvedValue(mockPreview);
    service.deleteByCodes.mockResolvedValue({
      deleted_invoices_count: 2,
      affected_messages_count: 1,
      not_found_count: 1,
    });

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderDialog({ open: true, onClose, onSuccess });

    const file = new File(['INV-001'], 'tagihan.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('delete-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const deleteBtn = await screen.findByRole('button', { name: /hapus 2 tagihan/i });
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(service.deleteByCodes).toHaveBeenCalledWith(['INV-001', 'INV-002'], false);
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
