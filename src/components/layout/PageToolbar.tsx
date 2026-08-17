'use client';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useMemo } from 'react';

import { usePageData } from '@/core/layout/PageData';

export const PageToolbar = () => {
  const { pageTitle, pageDescription, pageBreadcrumbs } = usePageData();

  const titleNode = useMemo(() => {
    if (!pageTitle) return null;
    const match = pageTitle.match(/^Welcome,\s*(.+)$/i);
    if (!match) return pageTitle;
    const name = String(match[1] || '')
      .replace(/^[,\s]+/, '')
      .trim();
    if (!name) return 'Welcome';
    return (
      <>
        {'Welcome, '}
        <Box component="span" sx={{ color: '#009ef7' }}>
          {name}
        </Box>
      </>
    );
  }, [pageTitle]);

  const breadcrumbItems = useMemo(
    () => (Array.isArray(pageBreadcrumbs) ? pageBreadcrumbs.filter((b) => !b.isSeparator) : []),
    [pageBreadcrumbs],
  );

  const hasToolbarContent = Boolean(pageTitle) || breadcrumbItems.length > 0 || Boolean(pageDescription);
  if (!hasToolbarContent) return null;

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
        px: 3,
        py: 1.5,
        position: 'sticky',
        top: 0,
        zIndex: 998,
      }}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        {titleNode ? (
          <Typography sx={{ fontSize: 17, fontWeight: 700, m: 0 }}>{titleNode}</Typography>
        ) : (
          <Box />
        )}
        {breadcrumbItems.length > 0 ? (
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{
              '& .MuiBreadcrumbs-separator': { mx: 0.75 },
              fontSize: 14,
            }}
          >
            {breadcrumbItems.map((b, idx) => (
              <Link
                key={`${idx}-${b.title}`}
                component={b.path && !b.isActive ? NextLink : 'span'}
                href={b.path && !b.isActive ? b.path : undefined}
                underline={b.path && !b.isActive ? 'hover' : 'none'}
                color={b.isActive ? 'text.primary' : 'text.secondary'}
                sx={{
                  fontSize: 14,
                  fontWeight: b.isActive ? 600 : 500,
                  lineHeight: 1.4,
                }}
              >
                {b.title}
              </Link>
            ))}
          </Breadcrumbs>
        ) : null}
      </Box>
      {pageDescription ? (
        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.5 }}>
          {pageDescription}
        </Typography>
      ) : null}
    </Box>
  );
};
