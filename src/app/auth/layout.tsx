import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>;
}
