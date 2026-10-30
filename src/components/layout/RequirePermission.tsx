'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';

type RequirePermissionProps = {
  /** The user must hold every listed permission to see the page. */
  permission: string | string[];
  children: ReactNode;
};

/** Page-level gate. The API still returns 403 on its own; this just avoids a broken-looking page. */
export const RequirePermission = ({ permission, children }: RequirePermissionProps) => {
  const allowed = usePermission(...(Array.isArray(permission) ? permission : [permission]));
  if (allowed) return <>{children}</>;

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'grid',
        gap: 1.5,
        justifyItems: 'center',
        py: 10,
        textAlign: 'center',
      }}
    >
      <LockOutlinedIcon color="disabled" sx={{ fontSize: 48 }} />
      <Typography variant="h5">You don&apos;t have access to this page</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        Your account does not have the required permission. Ask an administrator if you need it.
      </Typography>
      <Button component={Link} href={routes.dashboard} variant="outlined">
        Back to dashboard
      </Button>
    </Box>
  );
};

/** Inline variant: render children only when the permission is held. */
export const Can = ({ permission, children }: RequirePermissionProps) => {
  const allowed = usePermission(...(Array.isArray(permission) ? permission : [permission]));
  return allowed ? <>{children}</> : null;
};
