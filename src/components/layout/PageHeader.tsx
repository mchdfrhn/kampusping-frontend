import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

export type PageCrumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: PageCrumb[];
  /** Primary page actions, rendered on the right (e.g. a "Create" button). */
  actions?: ReactNode;
};

export const PageHeader = ({ title, description, breadcrumbs, actions }: PageHeaderProps) => (
  <Box sx={{ mb: 3 }}>
    {breadcrumbs && breadcrumbs.length > 0 ? (
      <Breadcrumbs aria-label="Jejak navigasi" sx={{ fontSize: 13, mb: 1 }}>
        {breadcrumbs.map((crumb) =>
          crumb.href ? (
            <Link
              key={crumb.label}
              component={NextLink}
              href={crumb.href}
              color="text.secondary"
              underline="hover"
            >
              {crumb.label}
            </Link>
          ) : (
            <Typography key={crumb.label} color="text.primary" sx={{ fontSize: 13 }}>
              {crumb.label}
            </Typography>
          ),
        )}
      </Breadcrumbs>
    ) : null}
    <Box
      sx={{
        alignItems: { sm: 'center' },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
    </Box>
  </Box>
);
