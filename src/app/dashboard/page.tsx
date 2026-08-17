'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';

import { getUserDisplayName } from '@/core/auth/auth.service';
import { appConfig } from '@/core/config/app.config';
import { PageTitle } from '@/core/layout/PageData';

export default function DashboardPage() {
  const userName = useMemo(() => getUserDisplayName(), []);

  return (
    <>
      <PageTitle>Welcome{userName ? `, ${userName}` : ''}</PageTitle>
      <Box
        sx={{
          backgroundImage: "url('/media/banners/homepage.svg')",
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.55)',
            inset: 0,
            position: 'absolute',
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(200,0,0,0.72), rgba(130,0,0,0.72))',
            bottom: 0,
            clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)',
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            right: 0,
            top: 0,
            width: '60%',
            zIndex: 2,
          }}
        />
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            height: '100%',
            justifyContent: 'flex-end',
            minHeight: 0,
            position: 'relative',
            zIndex: 3,
          }}
        >
          <Box
            sx={{
              alignItems: 'flex-end',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 640,
              pr: { xs: 2, sm: 3, md: 5 },
              textAlign: 'right',
              width: '100%',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                color: '#fff',
                fontSize: { xs: '2.4rem', md: '3.5rem' },
                fontWeight: 700,
                m: 0,
              }}
            >
              {appConfig.appName}
            </Typography>
            <Typography
              sx={{
                color: '#fff',
                fontSize: { xs: '0.82rem', md: '1rem' },
                fontWeight: 300,
                maxWidth: 560,
                mt: 2,
                textAlign: 'right',
                textTransform: 'uppercase',
              }}
            >
              Base UI/UX HIS untuk project baru. Gunakan komponen table, form, dan layout yang sudah
              disediakan, lalu sesuaikan data sesuai modul bisnis.
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
