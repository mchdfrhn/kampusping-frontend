'use client';

import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';

import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import { whatsappService } from '../services/whatsapp.service';
import type { WhatsAppState } from '../types';

const STATE_CHIPS: Record<
  WhatsAppState,
  { label: string; status: 'success' | 'info' | 'warning' | 'error' }
> = {
  connected: { label: 'Terhubung', status: 'success' },
  connecting: { label: 'Menyambungkan…', status: 'info' },
  qr: { label: 'Menunggu pemindaian', status: 'warning' },
  disconnected: { label: 'Terputus', status: 'error' },
};

const QR_SIZE = 208;

export const WhatsAppPanel = () => {
  const notify = useNotify();
  const canRead = usePermission(permissions.settingsRead);
  const canUpdate = usePermission(permissions.settingsUpdate);
  const { status, failed, refresh } = useWhatsAppStatus(canRead);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  if (!canRead) return null;

  const handleLogout = async () => {
    try {
      await whatsappService.logout();
      notify.success('Sesi WhatsApp diputus.');
      refresh();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal memutuskan sesi WhatsApp.'));
    } finally {
      setConfirmingLogout(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Koneksi WhatsApp"
        subheader="Nomor yang dipakai untuk mengirim pengingat tagihan."
        action={
          status && !failed ? (
            <AppStatusChip
              label={STATE_CHIPS[status.state].label}
              status={STATE_CHIPS[status.state].status}
              sx={{ mr: 1, mt: 0.5 }}
            />
          ) : undefined
        }
      />
      <CardContent>
        {failed ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshOutlinedIcon />}
                onClick={refresh}
              >
                Coba lagi
              </Button>
            }
          >
            Tidak dapat memuat status WhatsApp.
          </Alert>
        ) : !status ? (
          <Stack spacing={1} aria-busy="true" aria-label="Memuat status WhatsApp">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Stack>
        ) : (
          <Stack spacing={2}>
            {status.state === 'connected' ? (
              <Stack
                spacing={2}
                sx={{
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  py: 0.5,
                }}
              >
                <Typography color="text.secondary" variant="body2">
                  WhatsApp tersambung dan siap mengirim pesan.
                </Typography>
                {canUpdate ? (
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<LinkOffOutlinedIcon />}
                    sx={{ borderColor: 'divider', flexShrink: 0 }}
                    variant="outlined"
                    onClick={() => setConfirmingLogout(true)}
                  >
                    Putuskan sesi
                  </Button>
                ) : null}
              </Stack>
            ) : null}

            {status.state === 'connecting' ? (
              <Typography variant="body2">
                Sedang menyambungkan ke WhatsApp. Tunggu beberapa saat.
              </Typography>
            ) : null}

            {status.state === 'disconnected' ? (
              <Typography variant="body2">
                Pengiriman pesan dijeda otomatis selama WhatsApp terputus. Bila tetap terputus,
                restart gateway WhatsApp atau tekan Putuskan sesi lalu pindai ulang kode QR.
              </Typography>
            ) : null}

            {status.state === 'qr' ? (
              <Stack
                spacing={4}
                sx={{
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  py: 1,
                }}
              >
                {status.qr ? (
                  <Box
                    sx={{
                      bgcolor: 'common.white',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      flexShrink: 0,
                      lineHeight: 0,
                      p: 2.5,
                      width: 'fit-content',
                    }}
                  >
                    {/* Black on white regardless of theme: scanners need the contrast. The pairing
                        token exists only as drawing here; it is not logged, stored or put in a URL. */}
                    <QRCodeSVG
                      aria-label="Kode QR untuk menautkan WhatsApp"
                      bgColor="white"
                      fgColor="black"
                      role="img"
                      size={QR_SIZE}
                      value={status.qr}
                    />
                  </Box>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Menyiapkan kode QR…
                  </Typography>
                )}
                <Stack spacing={2} sx={{ flex: 1, maxWidth: 640 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        mb: 0.75,
                        textTransform: 'uppercase',
                      }}
                    >
                      Petunjuk Penautan
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                      Buka WhatsApp di ponsel → Perangkat tertaut → Tautkan perangkat → pindai kode
                      ini
                    </Typography>
                  </Box>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Gunakan nomor WhatsApp khusus, bukan nomor utama kampus. Sambungan WhatsApp yang
                    dipakai tidak resmi, sehingga nomor berisiko diblokir.
                  </Alert>
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        )}

        {canUpdate && status && status.state !== 'connected' ? (
          <Box sx={{ borderColor: 'divider', borderTop: 1, mt: 3, pt: 2.5 }}>
            <Button
              color="inherit"
              startIcon={<LinkOffOutlinedIcon />}
              sx={{ borderColor: 'divider' }}
              variant="outlined"
              onClick={() => setConfirmingLogout(true)}
            >
              Putuskan sesi
            </Button>
          </Box>
        ) : null}
      </CardContent>

      <AppConfirmDialog
        open={confirmingLogout}
        title="Putuskan sesi WhatsApp?"
        message="Sesi WhatsApp akan diputus dan Anda perlu memindai ulang kode QR."
        confirmText="Putuskan sesi"
        confirmColor="error"
        onClose={() => setConfirmingLogout(false)}
        onConfirm={handleLogout}
      />
    </Card>
  );
};
