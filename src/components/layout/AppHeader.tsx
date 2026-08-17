'use client';

import KeyboardDoubleArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftOutlined';
import KeyboardDoubleArrowRightOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowRightOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback, type MouseEvent } from 'react';

import { clearAuthAndRedirect, getStoredUser, getUserDealerCode, getUserDealerName, getUserDisplayName, getUserEmail, getUserRoleLabel } from '@/core/auth/auth.service';
import { appConfig } from '@/core/config/app.config';
import { notificationService, type NotificationItem } from '@/core/services/notification.service';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { layoutTokens } from '@/design-system/tokens/layout.token';
import { useUiStore } from '@/store';

import { AppLogo } from './AppLogo';

export const AppHeader = () => {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const user = useMemo(() => getStoredUser(), []);
  const displayName = getUserDisplayName(user) ?? 'User';
  const email = getUserEmail(user) ?? '-';
  const roleLabel = getUserRoleLabel(user);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [profileUser, setProfileUser] = useState(() => getStoredUser());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openingNotificationId, setOpeningNotificationId] = useState<number | null>(null);
  const router = useRouter();

  const loadNotifications = useCallback(async () => {
    try {
      const [count, list] = await Promise.all([
        notificationService.unreadCount(),
        notificationService.list({ page: 1, page_size: 5, unread_only: true }),
      ]);
      setUnreadCount(count);
      setNotifications(list.items);
    } catch {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const openNotifications = (event: MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    void loadNotifications();
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (openingNotificationId !== null) return;
    setOpeningNotificationId(item.id);
    try {
      if (!item.is_read) {
        await notificationService.markRead(item.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) => prev.filter((row) => row.id !== item.id));
      }
      setNotificationAnchor(null);
      router.push(item.target_path);
    } finally {
      setOpeningNotificationId(null);
    }
  };

  const openProfile = (event: MouseEvent<HTMLElement>) => {
    setProfileUser(getStoredUser());
    setProfileAnchor(event.currentTarget);
  };

  const profileDisplayName = getUserDisplayName(profileUser) ?? displayName;
  const profileEmail = getUserEmail(profileUser) ?? email;
  const profileRoleLabel = getUserRoleLabel(profileUser) ?? roleLabel;
  const profileDealerCode = getUserDealerCode(profileUser);
  const profileDealerName = getUserDealerName(profileUser);

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        sx={{ boxShadow: 'none', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar disableGutters sx={{ minHeight: layoutTokens.headerHeight }}>
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: 'primary.main',
              display: 'flex',
              gap: 1.5,
              height: layoutTokens.headerHeight,
              justifyContent: sidebarOpen ? 'space-between' : 'center',
              overflow: 'hidden',
              px: sidebarOpen ? 1 : 0.5,
              transition: 'width 0.2s ease',
              width: {
                xs: layoutTokens.sidebarMiniWidth,
                md: sidebarOpen ? layoutTokens.sidebarWidth : layoutTokens.sidebarMiniWidth,
              },
            }}
          >
            {sidebarOpen ? (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, height: '100%', minWidth: 0 }}>
                <AppLogo />
              </Box>
            ) : null}
            <IconButton
              onClick={toggleSidebar}
              sx={{
                color: 'primary.contrastText',
                height: 40,
                width: 40,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              {sidebarOpen ? <KeyboardDoubleArrowLeftOutlinedIcon /> : <KeyboardDoubleArrowRightOutlinedIcon />}
            </IconButton>
          </Box>

          <Box
            sx={{
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'rgba(0,0,0,0.08)',
              display: 'flex',
              flex: 1,
              gap: 1,
              height: layoutTokens.headerHeight,
              justifyContent: 'flex-end',
              px: 2,
            }}
          >
            <Badge
              badgeContent={unreadCount > 0 ? unreadCount : undefined}
              color="error"
              overlap="circular"
              sx={{ '& .MuiBadge-badge': { transform: 'translate(25%, -25%)' } }}
            >
              <IconButton onClick={openNotifications}>
                <NotificationsOutlinedIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Badge>
            <IconButton onClick={openProfile} aria-label={appConfig.companyName} sx={{ p: 0.5 }}>
              <Box
                component="img"
                src="/media/logos/hino_logo.jpeg"
                alt={appConfig.companyName}
                sx={{
                  borderRadius: 1.25,
                  display: 'block',
                  height: 40,
                  objectFit: 'cover',
                  width: 40,
                }}
              />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Popover
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={() => setNotificationAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              mt: 0.75,
              overflow: 'hidden',
              width: { xs: 320, sm: 400 },
            },
          },
        }}
      >
        <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
            Notifications
          </Typography>
        </Box>
        <Stack sx={{ px: 0, py: 0 }}>
          {notifications.length === 0 ? (
            <Typography sx={{ color: '#6B6B6B', fontSize: 13, px: 2, py: 1.5 }}>No notifications.</Typography>
          ) : (
            notifications.map((item) => {
              const isOpening = openingNotificationId === item.id;
              const isDisabled = openingNotificationId !== null;

              return (
              <Box
                key={item.id}
                onClick={() => void handleNotificationClick(item)}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled && !isOpening ? 0.6 : 1,
                  pointerEvents: isDisabled ? 'none' : 'auto',
                  px: 2,
                  py: 1.25,
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': isDisabled ? undefined : { bgcolor: 'rgba(0, 91, 172, 0.04)' },
                }}
              >
                <Box
                  sx={{
                    alignItems: 'flex-start',
                    columnGap: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#202124',
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: '17px',
                      minWidth: 0,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: '#6B6B6B',
                      flexShrink: 0,
                      fontSize: 11,
                      lineHeight: '17px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isOpening ? 'Opening...' : item.created_at ? formatDisplayDateTime(item.created_at) : ''}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: '#6B6B6B',
                    display: 'block',
                    fontSize: 12,
                    lineHeight: '16px',
                    mt: 0.5,
                    width: '100%',
                  }}
                >
                  {item.message}
                </Typography>
              </Box>
              );
            })
          )}
        </Stack>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.25 }}>
          <Button
            onClick={() => {
              setNotificationAnchor(null);
              router.push('/notifications');
            }}
            sx={{ color: '#1976D2', fontSize: 12, fontWeight: 600, minHeight: 24, textTransform: 'none' }}
          >
            View All
          </Button>
        </Box>
      </Popover>

      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 2.5, overflow: 'hidden', width: 290 } } }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, px: 2, py: 1.5 }}>
          <Box
            component="img"
            src="/media/logos/hino_logo.jpeg"
            alt={profileDisplayName}
            sx={{ borderRadius: 1.5, height: 48, objectFit: 'cover', width: 48 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700 }} variant="body2">
              {profileDisplayName}
            </Typography>
            <Typography color="text.secondary" noWrap variant="caption">
              {profileEmail}
            </Typography>
            {profileDealerCode || profileDealerName ? (
              <Typography color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }} variant="caption">
                {[profileDealerCode, profileDealerName].filter(Boolean).join(' - ')}
              </Typography>
            ) : null}
            {profileRoleLabel ? (
              <Box sx={{ mt: 0.5 }}>
                <Chip color="success" label={profileRoleLabel} size="small" sx={{ fontWeight: 700, height: 22 }} />
              </Box>
            ) : null}
          </Box>
        </Box>
        <Divider />
        <Button
          fullWidth
          color="inherit"
          startIcon={<LogoutOutlinedIcon />}
          onClick={clearAuthAndRedirect}
          sx={{ borderRadius: 0, justifyContent: 'center', py: 1.25 }}
        >
          Sign Out
        </Button>
      </Popover>
    </>
  );
};
