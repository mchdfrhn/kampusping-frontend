'use client';

import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthStore } from '@/core/auth/auth.store';
import { routes } from '@/core/config/route.config';
import { getInitials } from '@/core/utils/format.util';

export const UserMenu = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!user) return null;

  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        aria-label="Open user menu"
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ p: 0.5 }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: 14,
            fontWeight: 600,
            height: 36,
            width: 36,
          }}
        >
          {getInitials(user.full_name)}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 260, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography noWrap sx={{ fontWeight: 600 }} variant="body2">
            {user.full_name}
          </Typography>
          <Typography color="text.secondary" noWrap variant="caption">
            {user.email}
          </Typography>
          {user.roles.length > 0 ? (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {user.roles.map((role) => (
                <Chip key={role.id} label={role.name} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : null}
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            router.push(routes.profile);
          }}
        >
          <ListItemIcon>
            <PersonOutlineOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            void logout();
          }}
        >
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
};
