'use client';

import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import MenuOpenOutlinedIcon from '@mui/icons-material/MenuOpenOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { layoutTokens } from '@/design-system/tokens/layout.token';
import { useUiStore } from '@/store';

import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export const AppHeader = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  const label = isMobile ? 'Open navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: layoutTokens.headerHeight }}>
        <Tooltip title={label}>
          <IconButton
            aria-label={label}
            edge="start"
            onClick={() => (isMobile ? setMobileNavOpen(true) : toggleSidebar())}
          >
            {collapsed && !isMobile ? <MenuOutlinedIcon /> : <MenuOpenOutlinedIcon />}
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <ThemeToggle />
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
};
