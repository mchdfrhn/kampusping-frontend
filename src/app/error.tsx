'use client';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h4">Something went wrong</Typography>
      <Typography color="text.secondary" sx={{ my: 2 }}>Please try again or contact the application owner.</Typography>
      <Button variant="contained" onClick={reset}>Try again</Button>
    </Container>
  );
}
