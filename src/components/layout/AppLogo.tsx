import Box from '@mui/material/Box';
import Link from 'next/link';

import { appConfig } from '@/core/config/app.config';

export type AppLogoProps = { dark?: boolean; compact?: boolean };

export const AppLogo = ({ dark = false, compact = false }: AppLogoProps) => (
  <Box
    component={Link}
    href="/"
    sx={{
      alignItems: 'center',
      display: 'flex',
      height: '100%',
      lineHeight: 0,
      minWidth: 0,
    }}
  >
    <Box
      component="img"
      src={dark ? appConfig.companyLogoDark : appConfig.companyLogo}
      alt={appConfig.companyName}
      sx={{
        display: 'block',
        height: compact ? 24 : 30,
        objectFit: 'contain',
        width: 'auto',
      }}
    />
  </Box>
);
