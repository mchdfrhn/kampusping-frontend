import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export type AppLoadingProps = { label?: string };

export const AppLoading = ({ label = 'Loading...' }: AppLoadingProps) => (
  <Box
    sx={{
      alignItems: 'center',
      bgcolor: '#f6f7fb',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      overflow: 'hidden',
      px: 2,
    }}
  >
    <Box
      sx={{
        '@keyframes loadingPulse': {
          '0%, 100%': { opacity: 0.5, transform: 'scale(0.96)' },
          '50%': { opacity: 1, transform: 'scale(1.04)' },
        },
        '@keyframes loadingRing': {
          to: { transform: 'rotate(360deg)' },
        },
        '@keyframes loadingShimmer': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: '#fff',
          borderRadius: '50%',
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          height: 116,
          justifyContent: 'center',
          position: 'relative',
          width: 116,
          '&::before': {
            animation: 'loadingRing 1.35s linear infinite',
            border: '3px solid rgba(227, 6, 19, 0.12)',
            borderRadius: '50%',
            borderTopColor: '#E30613',
            content: '""',
            inset: -8,
            position: 'absolute',
          },
          '&::after': {
            animation: 'loadingPulse 1.6s ease-in-out infinite',
            bgcolor: 'rgba(227, 6, 19, 0.08)',
            borderRadius: '50%',
            content: '""',
            inset: 8,
            position: 'absolute',
          },
        }}
      >
        <Box
          component="img"
          alt="Hino"
          src="/media/logos/hino_logo.jpeg"
          sx={{
            height: 78,
            objectFit: 'contain',
            position: 'relative',
            width: 78,
            zIndex: 1,
          }}
        />
      </Box>

      <Box sx={{ minWidth: 260 }}>
        <Typography color="text.primary" sx={{ fontWeight: 700, mb: 1 }} variant="body1">
          {label}
        </Typography>
        <Box
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.08)',
            borderRadius: 999,
            height: 4,
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            '&::before': {
              animation: 'loadingShimmer 1.4s ease-in-out infinite',
              background: 'linear-gradient(90deg, transparent, #E30613, transparent)',
              content: '""',
              inset: 0,
              position: 'absolute',
              width: '60%',
            },
          }}
        />
      </Box>
    </Box>
  </Box>
);
