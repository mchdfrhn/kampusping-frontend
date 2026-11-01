'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/auth.store';
import { menuConfig } from '@/core/config/menu.config';
import { filterMenuByPermission } from '@/core/utils/navigation.util';
import { layoutTokens } from '@/design-system/tokens/layout.token';
import { mixToken } from '@/design-system/tokens/surface.token';
import { useUiStore } from '@/store';

import { AppLogo } from './AppLogo';

const isActivePath = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

type NavListProps = { collapsed: boolean; onNavigate?: () => void };

const NavList = ({ collapsed, onNavigate }: NavListProps) => {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  const groups = useMemo(() => filterMenuByPermission(menuConfig, user), [user]);

  return (
    <Box
      component="nav"
      aria-label="Navigasi utama"
      sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}
    >
      {groups.map((group, index) => (
        <List
          key={group.title ?? index}
          disablePadding
          subheader={
            group.title && !collapsed ? (
              <ListSubheader
                disableGutters
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  lineHeight: '32px',
                  px: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {group.title}
              </ListSubheader>
            ) : undefined
          }
          sx={{
            mb: 1.5,
            ...(group.title && collapsed
              ? { borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }
              : {}),
          }}
        >
          {group.items.map((item) => {
            const active = isActivePath(pathname, item.path);
            const Icon = item.icon;
            const button = (
              <ListItemButton
                component={Link}
                href={item.path}
                selected={active}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                sx={{
                  color: active ? 'primary.main' : 'text.secondary',
                  gap: 1.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  mb: 0.5,
                  minHeight: 44,
                  px: collapsed ? 0 : 1.5,
                  '&:hover': { bgcolor: mixToken('text-primary', 6) },
                  '&.Mui-selected, &.Mui-selected:hover': {
                    bgcolor: mixToken('primary-main', 12),
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', justifyContent: 'center', minWidth: 0 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                {!collapsed ? (
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        noWrap: true,
                        sx: { fontSize: 14, fontWeight: active ? 600 : 500 },
                      },
                    }}
                  />
                ) : null}
              </ListItemButton>
            );
            return (
              <Box component="li" key={item.path} sx={{ listStyle: 'none' }}>
                {collapsed ? (
                  <Tooltip placement="right" title={item.label}>
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
              </Box>
            );
          })}
        </List>
      ))}
    </Box>
  );
};

const Brand = ({ collapsed }: { collapsed: boolean }) => (
  <Box
    sx={{
      alignItems: 'center',
      borderBottom: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      flexShrink: 0,
      height: layoutTokens.headerHeight,
      justifyContent: collapsed ? 'center' : 'flex-start',
      px: collapsed ? 0 : 2.5,
    }}
  >
    <AppLogo withName={!collapsed} />
  </Box>
);

export const AppSidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileOpen = useUiStore((state) => state.setMobileNavOpen);

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { sx: { width: layoutTokens.sidebarWidth } } }}
      >
        <Brand collapsed={false} />
        <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </Drawer>
    );
  }

  const width = collapsed ? layoutTokens.sidebarMiniWidth : layoutTokens.sidebarWidth;
  return (
    <Drawer
      variant="permanent"
      sx={{
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          duration: theme.transitions.duration.shorter,
        }),
        width,
        '& .MuiDrawer-paper': {
          borderRight: '1px solid',
          borderColor: 'divider',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            duration: theme.transitions.duration.shorter,
          }),
          width,
        },
      }}
    >
      <Brand collapsed={collapsed} />
      <NavList collapsed={collapsed} />
    </Drawer>
  );
};
