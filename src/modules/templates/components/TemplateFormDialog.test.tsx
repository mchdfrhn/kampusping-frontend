import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/core/http/api-error';

import { templatesService } from '../services/templates.service';
import type { TemplatePreview, TemplateRecord } from '../types';
import { TemplateFormDialog } from './TemplateFormDialog';

vi.mock('../services/templates.service', () => ({
  templatesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    preview: vi.fn(),
  },
}));

const service = vi.mocked(templatesService);

const okPreview = (rendered = 'Pratinjau'): TemplatePreview => ({
  rendered: `${rendered}\n\nBalas STOP untuk berhenti.`,
  unknown_variables: [],
});

const existing: TemplateRecord = {
  id: 7,
  name: 'Pengingat H-7',
  body: 'Yth. {{nama}}, tagihan {{nominal}}.',
  is_active: true,
  created_at: '2026-11-01T01:00:00Z',
  updated_at: '2026-11-01T01:00:00Z',
};

const deferred = <Value,>() => {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const renderDialog = (props: Partial<ComponentProps<typeof TemplateFormDialog>> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <TemplateFormDialog open template={null} onClose={onClose} onSubmit={onSubmit} {...props} />,
  );
  return { onSubmit, onClose };
};

const bodyField = () => screen.getByLabelText(/^Isi pesan/) as HTMLTextAreaElement;
const nameField = () => screen.getByLabelText(/^Nama/) as HTMLInputElement;

beforeEach(() => {
  vi.resetAllMocks();
  service.preview.mockResolvedValue(okPreview());
});

describe('TemplateFormDialog', () => {
  it('inserts a variable placeholder at the caret of the body field', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(bodyField(), 'Yth. , segera bayar');
    bodyField().setSelectionRange(5, 5); // right after "Yth. "
    await user.click(screen.getByRole('button', { name: '{{nama}}' }));

    expect(bodyField().value).toBe('Yth. {{nama}}, segera bayar');
    await waitFor(() => expect(bodyField().selectionStart).toBe('Yth. {{nama}}'.length));
  });

  it('replaces the selected text when a variable chip is used', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(bodyField(), 'Halo XXX!');
    bodyField().setSelectionRange(5, 8);
    await user.click(screen.getByRole('button', { name: '{{nim}}' }));

    expect(bodyField().value).toBe('Halo {{nim}}!');
  });

  it('offers a chip for each of the nine allowed variables', () => {
    renderDialog();

    for (const name of [
      'nama',
      'nim',
      'semester',
      'nominal',
      'tanggal_jatuh_tempo',
      'cara_bayar',
      'link_pembayaran',
      'kontak_keuangan',
      'nama_kampus',
    ]) {
      expect(screen.getByRole('button', { name: `{{${name}}}` })).toBeInTheDocument();
    }
  });

  it('says that the opt-out sentence is added automatically', () => {
    renderDialog();

    expect(
      screen.getByText(
        'Kalimat «Balas STOP untuk berhenti.» ditambahkan otomatis di akhir setiap pesan.',
      ),
    ).toBeInTheDocument();
  });

  it('calls the preview once, after the debounce, with the final text', async () => {
    renderDialog();

    fireEvent.change(bodyField(), { target: { value: 'Yth. {{na' } });
    fireEvent.change(bodyField(), { target: { value: 'Yth. {{nama}}' } });

    expect(service.preview).not.toHaveBeenCalled(); // still inside the debounce window
    await waitFor(() => expect(service.preview).toHaveBeenCalledTimes(1));
    expect(service.preview).toHaveBeenCalledWith('Yth. {{nama}}');
    expect(await screen.findByLabelText('Pratinjau pesan')).toHaveTextContent('Pratinjau');
    expect(screen.getByLabelText('Pratinjau pesan')).toHaveTextContent(
      'Balas STOP untuk berhenti.',
    );
  });

  it('does not request a preview for an empty body', async () => {
    renderDialog();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(service.preview).not.toHaveBeenCalled();
  });

  it('ignores a stale preview response that arrives after a newer one', async () => {
    const first = deferred<TemplatePreview>();
    const second = deferred<TemplatePreview>();
    service.preview.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    renderDialog();

    fireEvent.change(bodyField(), { target: { value: 'Versi A' } });
    await waitFor(() => expect(service.preview).toHaveBeenCalledTimes(1));
    fireEvent.change(bodyField(), { target: { value: 'Versi B' } });
    await waitFor(() => expect(service.preview).toHaveBeenCalledTimes(2));

    await act(async () => {
      second.resolve(okPreview('Hasil B'));
    });
    expect(await screen.findByLabelText('Pratinjau pesan')).toHaveTextContent('Hasil B');

    await act(async () => {
      first.resolve(okPreview('Hasil A'));
    });
    expect(screen.getByLabelText('Pratinjau pesan')).toHaveTextContent('Hasil B');
    expect(screen.queryByText(/Hasil A/)).not.toBeInTheDocument();
  });

  it('warns about unknown variables and disables the save button while they are present', async () => {
    service.preview.mockResolvedValue({
      rendered: 'Yth. {{foo}}\n\nBalas STOP untuk berhenti.',
      unknown_variables: ['foo', 'bar'],
    });
    renderDialog();

    fireEvent.change(nameField(), { target: { value: 'Template uji' } });
    fireEvent.change(bodyField(), { target: { value: 'Yth. {{foo}} {{bar}}' } });

    expect(
      await screen.findByText(/Variabel tidak dikenal: \{\{foo\}\}, \{\{bar\}\}/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeDisabled();
  });

  it('enables the save button again once the unknown variable is removed', async () => {
    service.preview
      .mockResolvedValueOnce({ rendered: 'x', unknown_variables: ['foo'] })
      .mockResolvedValue(okPreview());
    renderDialog();

    fireEvent.change(bodyField(), { target: { value: 'Yth. {{foo}}' } });
    await screen.findByText(/Variabel tidak dikenal/);
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeDisabled();

    fireEvent.change(bodyField(), { target: { value: 'Yth. {{nama}}' } });
    await waitFor(() =>
      expect(screen.queryByText(/Variabel tidak dikenal/)).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeEnabled();
  });

  it('warns, without blocking, about malformed placeholders the server cannot catch', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    fireEvent.change(nameField(), { target: { value: 'Template uji' } });
    fireEvent.change(bodyField(), { target: { value: 'Yth. {{nama lengkap}} dan {{nim}' } });

    expect(
      await screen.findByText(
        'Ada tanda kurung ganda yang tidak lengkap atau tidak dikenal: {{nama lengkap}}, {{nim}',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tambah' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('shows a character counter and rejects a body past 2000 characters', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    fireEvent.change(nameField(), { target: { value: 'Template uji' } });
    fireEvent.change(bodyField(), { target: { value: 'abc' } });
    expect(screen.getByText('3/2000')).toBeInTheDocument();

    fireEvent.change(bodyField(), { target: { value: 'a'.repeat(2001) } });
    expect(screen.getByText('2001/2000')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    expect(await screen.findByText('Maksimal 2000 karakter')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    // an over-long body is never sent for a preview (the server would answer 422)
    expect(service.preview).not.toHaveBeenCalled();
  });

  it('requires a name and a body', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    expect(await screen.findByText('Nama wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Isi pesan wajib diisi')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed name, body and active flag', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    fireEvent.change(nameField(), { target: { value: '  Pengingat baru  ' } });
    fireEvent.change(bodyField(), { target: { value: ' Yth. {{nama}} ' } });
    await user.click(screen.getByRole('switch', { name: 'Aktif' }));
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Pengingat baru',
        body: 'Yth. {{nama}}',
        is_active: false,
      }),
    );
  });

  it('fills the form from the template being edited', async () => {
    renderDialog({ template: existing });

    expect(await screen.findByDisplayValue('Pengingat H-7')).toBeInTheDocument();
    expect(bodyField().value).toBe(existing.body);
    expect(screen.getByRole('switch', { name: 'Aktif' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Simpan perubahan' })).toBeInTheDocument();
  });

  it('shows the server 422 for unknown variables under the body field and stays open', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError('Variabel tidak dikenal: {{foo}}.', 422, 'validation_error', ['foo']),
      );
    const { onClose } = renderDialog({ onSubmit });

    fireEvent.change(nameField(), { target: { value: 'Template uji' } });
    fireEvent.change(bodyField(), { target: { value: 'Yth. {{foo}}' } });
    // the preview has not answered yet, so the button is still enabled: the server decides
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(bodyField()).toHaveAccessibleDescription(
        expect.stringContaining('Variabel tidak dikenal: {{foo}}.'),
      ),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a duplicate-name 409 under the name field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError('Templat dengan nama ini sudah ada.', 409, 'conflict'));
    renderDialog({ onSubmit });

    fireEvent.change(nameField(), { target: { value: 'Pengingat H-7' } });
    fireEvent.change(bodyField(), { target: { value: 'Yth. {{nama}}' } });
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription('Templat dengan nama ini sudah ada.'),
    );
  });

  it('shows other server errors in an alert inside the dialog', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError('Server error', 500));
    renderDialog({ onSubmit });

    fireEvent.change(nameField(), { target: { value: 'Template uji' } });
    fireEvent.change(bodyField(), { target: { value: 'Yth. {{nama}}' } });
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Server error');
  });
});
