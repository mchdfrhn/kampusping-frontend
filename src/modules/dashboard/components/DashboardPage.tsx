'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { useAuth, usePermission } from '@/core/auth/useAuth';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatNumber } from '@/core/utils/format.util';
import { exampleService } from '@/modules/example/services/example.service';
import { EXAMPLE_STATUSES, type ExampleItemStatus } from '@/modules/example/types';

type StatusCounts = Record<ExampleItemStatus, number>;

/** Semantic colors from the active theme (CSS variables), so the chart follows light/dark mode. */
const STATUS_COLORS: Record<ExampleItemStatus, string> = {
  draft: 'var(--mui-palette-warning-main)',
  active: 'var(--mui-palette-success-main)',
  inactive: 'var(--mui-palette-text-disabled)',
};

const StatCard = ({ label, value }: { label: string; value: number | null }) => (
  <Card>
    <CardContent>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      {value === null ? (
        <Skeleton height={44} width={80} />
      ) : (
        <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.5 }} variant="h4">
          {formatNumber(value)}
        </Typography>
      )}
    </CardContent>
  </Card>
);

/** Counts items per status using the list endpoint's `total`, one tiny request per status. */
const ExampleOverview = () => {
  const notify = useNotify();
  const [counts, setCounts] = useState<StatusCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      EXAMPLE_STATUSES.map(async ({ value }) => {
        const page = await exampleService.list({ page: 1, page_size: 1, status: value });
        return [value, page.total] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled) setCounts(Object.fromEntries(entries) as StatusCounts);
      })
      .catch((error) => notify.error(getErrorMessage(error, 'Failed to load overview.')));
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : null;

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          mb: 3,
        }}
      >
        <StatCard label="Total items" value={total} />
        {EXAMPLE_STATUSES.map(({ value, label }) => (
          <StatCard key={value} label={label} value={counts ? counts[value] : null} />
        ))}
      </Box>

      <Card>
        <CardHeader title="Items by status" subheader="Live data from the example module." />
        <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
          {counts ? (
            total === 0 ? (
              <Typography color="text.secondary" sx={{ py: 6 }}>
                No items yet. Create some in Example items to see the chart.
              </Typography>
            ) : (
              <PieChart
                height={280}
                series={[
                  {
                    innerRadius: 60,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    data: EXAMPLE_STATUSES.map(({ value, label }, id) => ({
                      id,
                      label,
                      value: counts[value],
                      color: STATUS_COLORS[value],
                    })),
                  },
                ]}
              />
            )
          ) : (
            <Skeleton height={280} variant="rounded" width="100%" />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const canViewExamples = usePermission(permissions.examplesRead);
  const firstName = user?.full_name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Here is a quick overview of your workspace."
      />

      {canViewExamples ? (
        <ExampleOverview />
      ) : (
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
      )}
    </>
  );
};
