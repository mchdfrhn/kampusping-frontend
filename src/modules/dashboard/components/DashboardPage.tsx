'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/core/auth/useAuth';

export const DashboardPage = () => {
  const { user } = useAuth();
  const firstName = user?.full_name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Welcome to KampusPing."
      />

      <Card>
        <CardHeader title="Your access" subheader="What your account can currently do." />
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2">
              {user?.roles.length
                ? 'Roles:'
                : 'No roles assigned yet. Ask an administrator for access.'}
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
