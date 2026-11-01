'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useCallback, useEffect, useState } from 'react';

import { AppLoading } from '@/components/base/AppLoading';
import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';

import { describePausedReason } from '../paused-reason';
import { settingsService } from '../services/settings.service';
import type { SettingsPayload, SettingsRecord } from '../types';
import { SettingsForm } from './SettingsForm';

export const SettingsPage = () => {
  const notify = useNotify();
  const canUpdate = usePermission(permissions.settingsUpdate);

  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  // Resuming changes only the pause, so it must not reset what the user is typing.
  const [pausedReason, setPausedReason] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .get()
      .then((loaded) => {
        if (cancelled) return;
        setLoadError(null);
        setSettings(loaded);
        setPausedReason(loaded.paused_reason);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getErrorMessage(error, 'Gagal memuat pengaturan.'));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoadError(null);
    setAttempt((value) => value + 1);
  }, []);

  const handleSave = async (payload: SettingsPayload) => {
    const saved = await settingsService.update(payload);
    setSettings(saved);
    setPausedReason(saved.paused_reason);
    notify.success('Pengaturan disimpan.');
  };

  const handleResume = async () => {
    setResuming(true);
    try {
      const resumed = await settingsService.resume();
      setPausedReason(resumed.paused_reason);
      notify.success('Pengiriman otomatis dilanjutkan.');
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal melanjutkan pengiriman.'));
    } finally {
      setResuming(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Atur identitas kampus, teks pembayaran, jendela kirim, dan pengaman pengiriman WhatsApp."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Pengaturan' }]}
      />

      {loadError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Coba lagi
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : !settings ? (
        <AppLoading fullScreen={false} label="Memuat pengaturan..." />
      ) : (
        <>
          {pausedReason ? (
            <Alert
              severity="warning"
              sx={{ mb: 3 }}
              action={
                canUpdate ? (
                  <Button
                    color="inherit"
                    disabled={resuming}
                    size="small"
                    onClick={() => void handleResume()}
                  >
                    Lanjutkan pengiriman
                  </Button>
                ) : undefined
              }
            >
              Pengiriman otomatis dijeda: {describePausedReason(pausedReason)}
            </Alert>
          ) : null}
          <SettingsForm settings={settings} canUpdate={canUpdate} onSave={handleSave} />
        </>
      )}
    </>
  );
};
