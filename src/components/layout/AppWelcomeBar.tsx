'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export const AppWelcomeBar = () => {
  const displayName = 'Developer';

  return (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'rgba(0,0,0,0.08)',
        display: 'flex',
        height: 40,
        px: 2.25,
      }}
    >
      <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
        Welcome,{' '}
        <Box component="span" sx={{ color: '#009EF7' }}>
          {displayName}
        </Box>
      </Typography>
    </Box>
  );
};
