import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { templatesService } from '@/modules/templates/services/templates.service';
import type { TemplateRecord } from '@/modules/templates/types';

import { messagesService } from '../services/messages.service';
import type {
  ManualFilterOptions,
  ManualMessagePreviewResponse,
  ManualMessageSendResponse,
} from '../types';
import { ManualSendPage } from './ManualSendPage';

vi.mock('../services/messages.service', () => ({
  messagesService: {
    getFilterOptions: vi.fn(),
    previewManual: vi.fn(),
    sendManual: vi.fn(),
  },
}));

vi.mock('@/modules/templates/services/templates.service', () => ({
  templatesService: {
    list: vi.fn(),
  },
}));

const mockTemplates: TemplateRecord[] = [
  {
    id: 1,
    name: 'Pengingat Tagihan SPP',
    body: 'Halo {{nama}}, tagihan SPP Anda {{nominal}} jatuh tempo {{tanggal_jatuh_tempo}}.',
    is_active: true,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Peringatan Tunggakan',
    body: 'Peringatan: Tagihan {{semester}} belum dibayar.',
    is_active: true,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
];

const mockOptions: ManualFilterOptions = {
  cohorts: ['2023', '2024'],
  study_programs: ['Teknik Informatika', 'Sistem Informasi'],
  semesters: ['Ganjil 2026/2027'],
};

const mockPreview: ManualMessagePreviewResponse = {
  total_matched: 2,
  eligible_count: 1,
  excluded_count: 1,
  excluded_breakdown: {
    paid: 1,
    opted_out: 0,
    exempt: 0,
    invalid_phone: 0,
    already_queued: 2,
  },
  sample_preview: {
    student_name: 'Budi Santoso',
    nim: '20230001',
    phone_masked: '+62812****7890',
    invoice_code: 'INV-001',
    amount: 1500000,
    body: 'Halo Budi Santoso, tagihan SPP Anda Rp1.500.000 jatuh tempo 20 November 2026.\n\nBalas STOP untuk berhenti.',
  },
  items: [
    {
      invoice_id: 101,
      invoice_code: 'INV-001',
      student_id: 1,
      student_name: 'Budi Santoso',
      nim: '20230001',
      phone_masked: '+62812****7890',
      study_program: 'Teknik Informatika',
      cohort: '2023',
      semester: 'Ganjil 2026/2027',
      amount: 1500000,
      due_date: '2026-11-20',
      invoice_status: 'unpaid',
      is_eligible: true,
      exclude_reason: null,
    },
    {
      invoice_id: 102,
      invoice_code: 'INV-002',
      student_id: 2,
      student_name: 'Siti Aminah',
      nim: '20230002',
      phone_masked: '+62813****1234',
      study_program: 'Teknik Informatika',
      cohort: '2023',
      semester: 'Ganjil 2026/2027',
      amount: 1500000,
      due_date: '2026-11-20',
      invoice_status: 'paid',
      is_eligible: false,
      exclude_reason: 'Sudah lunas',
    },
  ],
};

const mockSendResult: ManualMessageSendResponse = {
  batch_ref: 'MANUAL-20261103-ABC12345',
  queued_count: 1,
  excluded_count: 1,
  total_matched: 2,
};

const renderComponent = () =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
      <NotifyProvider>
        <ManualSendPage />
      </NotifyProvider>
    </LocalizationProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(templatesService.list).mockResolvedValue({
    items: mockTemplates,
    total: 2,
    page: 1,
    page_size: 20,
  });
  vi.mocked(messagesService.getFilterOptions).mockResolvedValue(mockOptions);
  vi.mocked(messagesService.previewManual).mockResolvedValue(mockPreview);
  vi.mocked(messagesService.sendManual).mockResolvedValue(mockSendResult);
});

describe('ManualSendPage', () => {
  it('renders page header, filters, and loads template options', async () => {
    renderComponent();

    expect(screen.getByText('Kirim Pesan Manual')).toBeInTheDocument();
    expect(screen.getByText('Kriteria Penerima & Templat Pesan')).toBeInTheDocument();
    expect(screen.getByLabelText(/Pilih Templat Pesan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Program Studi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Angkatan/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(templatesService.list).toHaveBeenCalledWith({ is_active: true, page_size: 100 });
      expect(messagesService.getFilterOptions).toHaveBeenCalled();
    });
  });

  it('has no semester filter; prodi and angkatan are dropdowns and the preview request omits semester', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tampilkan Pratinjau/i })).not.toBeDisabled();
    });

    expect(screen.queryByRole('combobox', { name: /Semester/i })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Program Studi/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Angkatan/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tampilkan Pratinjau/i }));

    expect(messagesService.previewManual).toHaveBeenCalledTimes(1);
    expect(vi.mocked(messagesService.previewManual).mock.calls[0][0]).not.toHaveProperty(
      'semester',
    );
  });

  it('fetches and displays preview with KPI cards and WhatsApp preview', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tampilkan Pratinjau/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /Tampilkan Pratinjau/i }));

    expect(messagesService.previewManual).toHaveBeenCalled();

    // Verify KPI summary cards
    expect(await screen.findByText('Total Tagihan Cocok')).toBeInTheDocument();
    expect(screen.getByText('Siap Dikirim (Memenuhi Syarat)')).toBeInTheDocument();
    expect(screen.getByText('Lunas: 1')).toBeInTheDocument();
    expect(screen.getByText('Sudah dalam antrean: 2')).toBeInTheDocument();

    // Verify table items
    expect(screen.getAllByText('Budi Santoso').length).toBeGreaterThan(0);
    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
    expect(screen.getByText('Siap Dikirim')).toBeInTheDocument();
    expect(screen.getAllByText('Dikecualikan').length).toBeGreaterThan(0);
    expect(screen.getByText('Sudah lunas')).toBeInTheDocument();

    // Verify WhatsApp mockup
    expect(screen.getByText('Pratinjau Pesan WhatsApp')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Halo Budi Santoso, tagihan SPP Anda Rp1.500.000 jatuh tempo 20 November 2026/i,
      ),
    ).toBeInTheDocument();
  });

  it('confirms and executes manual sending successfully', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tampilkan Pratinjau/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /Tampilkan Pratinjau/i }));

    const executeBtn = await screen.findByRole('button', { name: /Eksekusi Pengiriman/i });
    expect(executeBtn).toBeInTheDocument();
    expect(executeBtn).not.toBeDisabled();

    // Click to open confirmation dialog
    await user.click(executeBtn);

    expect(screen.getByText('Konfirmasi Pengiriman Pesan Manual')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Apakah Anda yakin ingin mengirim pesan penagihan manual ke 1 mahasiswa terpilih/i,
      ),
    ).toBeInTheDocument();

    // Confirm sending
    await user.click(screen.getByRole('button', { name: 'Kirim Sekarang' }));

    await waitFor(() => {
      expect(messagesService.sendManual).toHaveBeenCalledWith({
        template_id: 1,
        invoice_ids: [101],
      });
    });

    // Alert showing success
    expect(
      await screen.findByText(/Pengiriman pesan manual berhasil dijadwalkan!/i),
    ).toBeInTheDocument();
  });

  it('resets filters and clears preview when reset is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tampilkan Pratinjau/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /Tampilkan Pratinjau/i }));

    expect(await screen.findByText('Total Tagihan Cocok')).toBeInTheDocument();

    // Reset filters
    await user.click(screen.getByRole('button', { name: /Reset Filter/i }));

    expect(screen.queryByText('Total Tagihan Cocok')).not.toBeInTheDocument();
  });
});
