import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

import type { BreadcrumbItem } from '@/core/types/common.type';

export type AppBreadcrumbsProps = { items: BreadcrumbItem[] };

export const AppBreadcrumbs = ({ items }: AppBreadcrumbsProps) => (
  <Breadcrumbs
    aria-label="breadcrumb"
    sx={{
      '& .MuiBreadcrumbs-separator': { mx: 0.75 },
      fontSize: 14,
    }}
  >
    {items.map((item, index) =>
      item.href && index < items.length - 1 ? (
        <Link
          key={item.label}
          component={NextLink}
          href={item.href}
          underline="hover"
          color="text.secondary"
          sx={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}
        >
          {item.label}
        </Link>
      ) : (
        <Typography key={item.label} color="text.primary" sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
          {item.label}
        </Typography>
      ),
    )}
  </Breadcrumbs>
);
