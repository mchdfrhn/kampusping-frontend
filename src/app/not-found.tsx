'use client';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h3">404</Typography>
      <Typography color="text.secondary" sx={{ my: 2 }}>Page not found.</Typography>
      <Button component={Link} href="/dashboard" variant="contained">Back to dashboard</Button>
    </Container>
  );
}
