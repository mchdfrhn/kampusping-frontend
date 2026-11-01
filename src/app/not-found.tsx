'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

import { useAuth } from '@/core/auth/useAuth';
import { firstAccessibleRoute } from '@/core/utils/navigation.util';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <Box
      sx={{
        display: 'grid',
        justifyItems: 'center',
        minHeight: '60vh',
        placeContent: 'center',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography color="primary" sx={{ fontSize: 72, fontWeight: 700, lineHeight: 1 }}>
        404
      </Typography>
      <Typography component="h1" sx={{ mt: 1 }} variant="h5">
        Halaman tidak ditemukan
      </Typography>
      <Typography color="text.secondary" sx={{ my: 2 }}>
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </Typography>
      <Button component={Link} href={firstAccessibleRoute(user)} variant="contained">
        Kembali ke halaman utama
      </Button>
    </Box>
  );
}
