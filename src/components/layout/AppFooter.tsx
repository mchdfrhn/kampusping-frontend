import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { appConfig } from '@/core/config/app.config';

export const AppFooter = () => (
  <Box component="footer" sx={{ bgcolor: 'background.paper', flexShrink: 0, height: 40, px: 3, py: 1 }}>
    <Typography color="text.secondary" sx={{ lineHeight: '24px' }} variant="body2"><strong>2026 ©</strong> <Link href="https://www.hino.co.id/" target="_blank" color="inherit" underline="hover">{appConfig.companyName}</Link></Typography>
  </Box>
);
