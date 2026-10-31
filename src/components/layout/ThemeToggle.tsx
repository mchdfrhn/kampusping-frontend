'use client';

import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';

export const ThemeToggle = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  // `mode` is undefined until the client has read the stored preference.
  if (!mode) return <IconButton disabled aria-hidden sx={{ visibility: 'hidden' }} />;

  const resolved = mode === 'system' ? systemMode : mode;
  const next = resolved === 'dark' ? 'light' : 'dark';
  const label = `Beralih ke mode ${next === 'dark' ? 'gelap' : 'terang'}`;

  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={() => setMode(next)}>
        {resolved === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
};
