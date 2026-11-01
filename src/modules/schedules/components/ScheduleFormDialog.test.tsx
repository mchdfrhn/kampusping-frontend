import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/core/http/api-error';
import type { TemplateRecord } from '@/modules/templates/types';

import type { ScheduleRuleRecord } from '../types';
import { ScheduleFormDialog } from './ScheduleFormDialog';

const makeTemplate = (id: number, name: string, isActive = true): TemplateRecord => ({
  id,
  name,
  body: 'Halo',
  is_active: isActive,
  created_at: '2026-11-01T01:00:00Z',
  updated_at: '2026-11-01T01:00:00Z',
});

const templates = [
  makeTemplate(1, 'Pengingat sebelum jatuh tempo'),
  makeTemplate(2, 'Tunggakan setelah jatuh tempo'),
  makeTemplate(3, 'Template lama', false),
  makeTemplate(4, 'Template lain yang nonaktif', false),
];

const rule: ScheduleRuleRecord = {
  id: 9,
  name: 'H-7',
  offset_days: -7,
  template: { id: 1, name: 'Pengingat sebelum jatuh tempo' },
  is_active: true,
  created_at: '2026-11-01T01:00:00Z',
  updated_at: '2026-11-01T01:00:00Z',
};

const renderDialog = (props: Partial<ComponentProps<typeof ScheduleFormDialog>> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <ScheduleFormDialog
      open
      rule={null}
      templates={templates}
      onClose={onClose}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { onSubmit, onClose };
};

const nameField = () => screen.getByLabelText(/^Nama/) as HTMLInputElement;
const offsetField = () => screen.getByLabelText(/^Offset hari/) as HTMLInputElement;

const pickTemplate = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('combobox', { name: /^Template/ }));
  await user.click(await screen.findByRole('option', { name }));
};

describe('ScheduleFormDialog', () => {
  it('explains the sign of the offset', () => {
    renderDialog();

    expect(
      screen.getByText('Negatif = sebelum jatuh tempo, 0 = hari jatuh tempo, positif = setelah'),
    ).toBeInTheDocument();
  });

  it('submits offset_days as a number together with the template id', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    fireEvent.change(nameField(), { target: { value: '  H-3  ' } });
    fireEvent.change(offsetField(), { target: { value: '-3' } });
    await pickTemplate(user, 'Tunggakan setelah jatuh tempo');
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toEqual({ name: 'H-3', offset_days: -3, template_id: 2, is_active: true });
    expect(typeof payload.offset_days).toBe('number');
    expect(typeof payload.template_id).toBe('number');
  });

  it('accepts 0 as the offset of the due date itself', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    fireEvent.change(nameField(), { target: { value: 'H' } });
    fireEvent.change(offsetField(), { target: { value: '0' } });
    await pickTemplate(user, 'Pengingat sebelum jatuh tempo');
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ offset_days: 0 })),
    );
  });

  it('requires a name, an offset and a template', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    expect(await screen.findByText('Nama wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Offset hari wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Template wajib dipilih')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ['61', 'Offset harus antara -60 dan 60'],
    ['-61', 'Offset harus antara -60 dan 60'],
    ['1.5', 'Offset harus berupa bilangan bulat'],
  ])('rejects the offset %s', async (value, message) => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    fireEvent.change(nameField(), { target: { value: 'Aturan' } });
    fireEvent.change(offsetField(), { target: { value } });
    await pickTemplate(user, 'Pengingat sebelum jatuh tempo');
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts the limits -60 and 60', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    fireEvent.change(nameField(), { target: { value: 'Batas' } });
    fireEvent.change(offsetField(), { target: { value: '60' } });
    await pickTemplate(user, 'Pengingat sebelum jatuh tempo');
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ offset_days: 60 })),
    );
  });

  it('offers active templates only when creating', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('combobox', { name: /^Template/ }));
    const listbox = await screen.findByRole('listbox');

    expect(
      within(listbox)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Pengingat sebelum jatuh tempo', 'Tunggakan setelah jatuh tempo']);
  });

  it('keeps the inactive template of the rule being edited selectable', async () => {
    const user = userEvent.setup();
    renderDialog({
      rule: { ...rule, template: { id: 3, name: 'Template lama' } },
    });

    expect(await screen.findByDisplayValue('H-7')).toBeInTheDocument();
    const select = screen.getByRole('combobox', { name: /^Template/ });
    expect(select).toHaveTextContent('Template lama');

    await user.click(select);
    const names = within(await screen.findByRole('listbox'))
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(names).toContain('Template lama');
    expect(names).not.toContain('Template lain yang nonaktif');
  });

  it('includes the rule template even when the template list is unavailable', async () => {
    renderDialog({ rule, templates: [] });

    expect(await screen.findByDisplayValue('H-7')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^Template/ })).toHaveTextContent(
      'Pengingat sebelum jatuh tempo',
    );
  });

  it('fills the form from the rule being edited and keeps the offset a number on save', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog({ rule });

    expect(await screen.findByDisplayValue('H-7')).toBeInTheDocument();
    expect(offsetField().value).toBe('-7');
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'H-7',
        offset_days: -7,
        template_id: 1,
        is_active: true,
      }),
    );
  });

  it('shows the duplicate-offset 409 under the offset field and stays open', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError('Sudah ada aturan jadwal dengan selisih hari ini.', 409, 'conflict'),
      );
    const { onClose } = renderDialog({ onSubmit });

    fireEvent.change(nameField(), { target: { value: 'H-7 lagi' } });
    fireEvent.change(offsetField(), { target: { value: '-7' } });
    await pickTemplate(user, 'Pengingat sebelum jatuh tempo');
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(offsetField()).toHaveAccessibleDescription(
        'Sudah ada aturan jadwal dengan selisih hari ini.',
      ),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a 422 without a field (template not found) in an alert inside the dialog', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError('Templat pesan tidak ditemukan.', 422, 'validation_error'));
    renderDialog({ onSubmit });

    fireEvent.change(nameField(), { target: { value: 'H-7' } });
    fireEvent.change(offsetField(), { target: { value: '-7' } });
    await pickTemplate(user, 'Pengingat sebelum jatuh tempo');
    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Templat pesan tidak ditemukan.',
    );
  });

  it('tells the user when there is no template to choose from', () => {
    renderDialog({ templates: [] });

    expect(
      screen.getByText('Belum ada template aktif. Buat template terlebih dahulu.'),
    ).toBeInTheDocument();
  });
});
