'use client';

import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

import { getStoredUser } from '@/core/auth/auth.service';
import { userIsGroupAdmin } from '@/core/auth/auth-session.util';
import { appConfig } from '@/core/config/app.config';
import { groupSettingsMenuConfig } from '@/core/config/menu.config';
import {
  readCachedSidebarMenuItems,
  refreshSidebarMenuItemConfigs,
  staticMenuItemConfigs,
  toMenuItemConfig,
  withDashboardMenu,
} from '@/core/layout/sidebar-menu.util';
import type { MenuItemConfig } from '@/core/types/menu.type';
import { layoutTokens } from '@/design-system/tokens/layout.token';
import { useUiStore } from '@/store';

import { AppSidebarItem } from './AppSidebarItem';

export const AppSidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const width = sidebarOpen ? layoutTokens.sidebarWidth : layoutTokens.sidebarMiniWidth;
  const collapsed = !sidebarOpen && !isMobile;
  const showSettingsMenu =
    userIsGroupAdmin(getStoredUser()) || appConfig.allowLocalDevWithoutAuth;

  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(() => staticMenuItemConfigs());

  const allPaths = useMemo(
    () => [
      ...menuItems.map((item) => item.path),
      ...(showSettingsMenu ? groupSettingsMenuConfig.map((item) => item.path) : []),
    ],
    [menuItems, showSettingsMenu],
  );

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        const items = await refreshSidebarMenuItemConfigs();
        if (!ignore) setMenuItems(items);
      } catch {
        if (!ignore) {
          const cached = readCachedSidebarMenuItems();
          setMenuItems(
            cached.length > 0
              ? withDashboardMenu(cached.map(toMenuItemConfig))
              : staticMenuItemConfigs(),
          );
        }
      }
    };

    void run();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

  const drawerOpen = isMobile ? sidebarOpen : true;

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={drawerOpen}
      onClose={() => setSidebarOpen(false)}
      sx={{
        flexShrink: 0,
        transition: 'width 0.2s ease',
        width: isMobile ? 0 : width,
        '& .MuiDrawer-paper': {
          bgcolor: '#1E1E2D',
          borderRight: 0,
          boxSizing: 'border-box',
          color: '#fff',
          height: { xs: '100%', md: `calc(100vh - ${layoutTokens.headerHeight}px)` },
          overflowX: 'hidden',
          pt: { xs: `${layoutTokens.headerHeight + 8}px`, md: 0 },
          top: { xs: 0, md: layoutTokens.headerHeight },
          transition: 'width 0.2s ease',
          width: isMobile ? layoutTokens.sidebarWidth : width,
        },
      }}
    >
      <List disablePadding sx={{ pt: { xs: 0, md: 0.5 } }}>
        {menuItems.map((item) => (
          <AppSidebarItem
            key={item.path}
            item={item}
            allPaths={allPaths}
            collapsed={collapsed}
            onClick={() => isMobile && setSidebarOpen(false)}
          />
        ))}

        {showSettingsMenu ? (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: collapsed ? 1 : 1.5, my: 1 }} />
            {!collapsed ? (
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  lineHeight: '28px',
                  px: 2,
                  py: 0,
                  textTransform: 'uppercase',
                }}
              >
                Settings
              </ListSubheader>
            ) : null}
            {groupSettingsMenuConfig.map((item) => (
              <AppSidebarItem
                key={item.path}
                item={item}
                allPaths={allPaths}
                collapsed={collapsed}
                onClick={() => isMobile && setSidebarOpen(false)}
              />
            ))}
          </>
        ) : null}
      </List>
    </Drawer>
  );
};
