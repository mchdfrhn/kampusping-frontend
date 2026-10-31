'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/core/auth/useAuth';
import { appConfig } from '@/core/config/app.config';

export const DashboardPage = () => {
  const { user } = useAuth();
  const firstName = user?.full_name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Selamat datang kembali, ${firstName}` : 'Selamat datang kembali'}
        description={`Selamat datang di ${appConfig.appName}.`}
      />

      <Card>
        <CardHeader title="Akses Anda" subheader="Hal yang saat ini dapat dilakukan akun Anda." />
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2">
              {user?.roles.length
                ? 'Peran:'
                : 'Belum ada peran yang diberikan. Hubungi administrator untuk mendapatkan akses.'}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
              {user?.roles.map((role) => (
                <Chip key={role.id} label={role.name} size="small" />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};
