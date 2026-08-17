'use client';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { MenuItemConfig } from '@/core/types/menu.type';

export type AppSidebarItemProps = {
  item: MenuItemConfig;
  allPaths: string[];
  collapsed?: boolean;
  onClick?: () => void;
};

const isItemSelected = (pathname: string, itemPath: string, allPaths: string[]) => {
  if (pathname === itemPath) return true;
  if (!pathname.startsWith(`${itemPath}/`)) return false;
  const hasMoreSpecificMatch = allPaths.some(
    (other) =>
      other !== itemPath &&
      other.startsWith(itemPath) &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );
  return !hasMoreSpecificMatch;
};

export const AppSidebarItem = ({ item, allPaths, collapsed = false, onClick }: AppSidebarItemProps) => {
  const pathname = usePathname();
  const Icon = item.icon;
  const selected = isItemSelected(pathname, item.path, allPaths);
  const isExternal = /^https?:\/\//i.test(item.path);

  return (
    <ListItemButton
      component={Link}
      href={item.path}
      selected={selected}
      onClick={onClick}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      sx={{
        borderRadius: 1.5,
        color: 'rgba(255,255,255,0.66)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 38,
        mx: 1,
        my: 0.25,
        px: collapsed ? 1 : 1.5,
        py: 0.75,
        '& .MuiListItemIcon-root': {
          color: 'rgba(255,255,255,0.66)',
          minWidth: collapsed ? 0 : 32,
          '& svg': { fontSize: 15 },
        },
        '& .MuiTypography-root': { fontSize: 13, fontWeight: 500 },
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.08)',
          color: '#fff',
        },
        '&:hover .MuiListItemIcon-root': { color: '#fff' },
        '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
        '&.Mui-selected .MuiListItemIcon-root': { color: '#fff' },
        '&.Mui-selected:hover': { bgcolor: 'rgba(255,255,255,0.10)' },
      }}
    >
      {Icon ? (
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
      ) : null}
      {collapsed ? null : <ListItemText primary={item.label} />}
    </ListItemButton>
  );
};
