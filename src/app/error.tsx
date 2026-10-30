'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <Typography component="h1" variant="h4">
        Something went wrong
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420, my: 2 }}>
        An unexpected error occurred. You can try again, and if it keeps happening contact support.
      </Typography>
      <Button onClick={reset} variant="contained">
        Try again
      </Button>
    </Box>
  );
}
