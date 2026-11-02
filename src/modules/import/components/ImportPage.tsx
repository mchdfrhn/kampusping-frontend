'use client';

import Stack from '@mui/material/Stack';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { ApiError, getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';

import { importService } from '../services/import.service';
import type { ImportBatch, ImportSummary } from '../types';
import { ImportHistory } from './ImportHistory';
import { ImportPreview } from './ImportPreview';
import { ImportUploadForm } from './ImportUploadForm';

const describeApplied = (summary: ImportSummary) =>
  `Impor diterapkan: ${summary.students_new} mahasiswa baru, ` +
  `${summary.students_updated} mahasiswa diperbarui, ${summary.invoices_new} tagihan baru, ` +
  `${summary.invoices_updated} tagihan diperbarui, ${summary.invoices_skipped} tagihan dilewati.`;

export const ImportPage = () => {
  const notify = useNotify();
  const canCreate = usePermission(permissions.importsCreate);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  // Changing the key remounts the history, so it reloads from the first page (newest first).
  const [historyKey, setHistoryKey] = useState(0);

  const refreshHistory = () => setHistoryKey((key) => key + 1);

  const showPreview = (next: ImportBatch) => {
    setBatch(next);
    refreshHistory();
  };

  const closePreview = () => {
    setBatch(null);
    refreshHistory();
  };

  const handleApply = async (target: ImportBatch) => {
    try {
      const applied = await importService.apply(target.id);
      notify.success(describeApplied(applied.summary));
      closePreview();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal menerapkan impor.'));
      // 409: someone already applied or discarded it, so the preview is stale.
      if (error instanceof ApiError && error.status === 409) closePreview();
    }
  };

  const handleDiscard = async (target: ImportBatch) => {
    try {
      await importService.discard(target.id);
      notify.success('Impor dibatalkan.');
      closePreview();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal membatalkan impor.'));
      if (error instanceof ApiError && error.status === 409) closePreview();
    }
  };

  return (
    <>
      <PageHeader
        title="Impor Data"
        description="Unggah berkas ekspor CSV atau Excel dari SIAKAD/Civitas dan SIPEMA untuk memperbarui data mahasiswa dan tagihan. Pembayaran tetap dilakukan di SIAKAD/SIPEMA."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Impor Data' }]}
      />
      <Stack spacing={3}>
        {canCreate ? <ImportUploadForm onPreviewed={showPreview} /> : null}
        {batch ? (
          <ImportPreview
            key={`preview-${batch.id}`}
            batch={batch}
            canManage={canCreate}
            onApply={handleApply}
            onDiscard={handleDiscard}
          />
        ) : null}
        <ImportHistory key={`history-${historyKey}`} onOpenPreview={setBatch} />
      </Stack>
    </>
  );
};
