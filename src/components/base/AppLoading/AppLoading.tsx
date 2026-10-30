import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { AppLogo } from '@/components/layout/AppLogo';

export type AppLoadingProps = {
  label?: string;
  /** Fill the viewport (default) or just the parent. */
  fullScreen?: boolean;
};

export const AppLoading = ({ label = 'Loading...', fullScreen = true }: AppLoadingProps) => (
  <Box
    role="status"
    aria-live="polite"
    sx={{
      alignItems: 'center',
      bgcolor: 'background.default',
      display: 'flex',
      justifyContent: 'center',
      minHeight: fullScreen ? '100vh' : 240,
      px: 2,
    }}
  >
    <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box
        sx={{
          '@keyframes appLoadingSpin': { to: { transform: 'rotate(360deg)' } },
          alignItems: 'center',
          display: 'flex',
          height: 76,
          justifyContent: 'center',
          position: 'relative',
          width: 76,
          '&::before': {
            animation: 'appLoadingSpin 1.1s linear infinite',
            border: '3px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            borderTopColor: 'primary.main',
            content: '""',
            inset: 0,
            position: 'absolute',
          },
        }}
      >
        <AppLogo size={40} />
      </Box>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
    </Box>
  </Box>
);
