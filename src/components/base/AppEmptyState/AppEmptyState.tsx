import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export type AppEmptyStateProps = { title?: string; description?: string; action?: ReactNode };

export const AppEmptyState = ({
  title = 'Tidak ada data',
  description = 'Belum ada data untuk ditampilkan.',
  action,
}: AppEmptyStateProps) => (
  <Box
    sx={{
      display: 'grid',
      placeItems: 'center',
      gap: 1.5,
      minHeight: 220,
      textAlign: 'center',
      p: 3,
    }}
  >
    <InboxOutlinedIcon color="disabled" sx={{ fontSize: 48 }} />
    <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
    <Typography color="text.secondary" variant="body2">
      {description}
    </Typography>
    {action}
  </Box>
);
