import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { AppBreadcrumbs } from '@/components/base/AppBreadcrumbs';
import type { BreadcrumbItem } from '@/core/types/common.type';

export type AppBreadcrumbHeaderProps = { title: string; breadcrumbs?: BreadcrumbItem[] };

export const AppBreadcrumbHeader = ({ title, breadcrumbs = [] }: AppBreadcrumbHeaderProps) => (
  <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
    <Typography variant="h6">{title}</Typography>
    {breadcrumbs.length > 0 ? <AppBreadcrumbs items={breadcrumbs} /> : null}
  </Box>
);
