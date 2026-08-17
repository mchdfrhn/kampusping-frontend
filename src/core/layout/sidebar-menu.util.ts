import { appConfig } from '@/core/config/app.config';
import { routes } from '@/core/config/route.config';
import { getMenuIconByName, getStaticMenuSlugMapping, menuConfig } from '@/core/config/menu.config';
import { storageKeys } from '@/core/constants/storage.constant';
import { getMenu, getMenuMapping, type MenuApiItem } from '@/core/iam/iam.service';
import type { MenuItemConfig } from '@/core/types/menu.type';
import { storage } from '@/core/utils/storage.util';

export type CachedSidebarMenuItem = {
  label: string;
  path: string;
  slug?: string;
  iconName?: string | null;
};

export const normalizeMenuLink = (link?: string) => {
  if (!link) return '';
  const trimmed = link.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const flattenMenuItems = (items: MenuApiItem[]): MenuApiItem[] =>
  items.flatMap((item) => [item, ...(Array.isArray(item.items) ? flattenMenuItems(item.items) : [])]);

export const sortMenuItems = (items: MenuApiItem[]) =>
  [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);

export const uniqueMenuItemsByLink = (items: MenuApiItem[]): MenuApiItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const link = normalizeMenuLink(item.link);
    if (!link || seen.has(link)) return false;
    seen.add(link);
    return true;
  });
};

export const dashboardMenuItem: CachedSidebarMenuItem = {
  label: 'Dashboard',
  path:
    appConfig.masterAppUrl && appConfig.masterAppUrl !== '/'
      ? appConfig.masterAppUrl
      : routes.dashboard,
  iconName: 'DashboardOutlinedIcon',
};

export const toMenuItemConfig = (item: CachedSidebarMenuItem): MenuItemConfig => ({
  label: item.label,
  path: item.path,
  slug: item.slug,
  icon: getMenuIconByName(item.iconName),
});

export const withDashboardMenu = (items: MenuItemConfig[]): MenuItemConfig[] => {
  const dashboard = toMenuItemConfig(dashboardMenuItem);
  const merged = items.filter((item) => item.path !== dashboard.path);
  return [dashboard, ...merged];
};

export const staticMenuItemConfigs = (): MenuItemConfig[] => menuConfig;

export const readCachedSidebarMenuItems = (): CachedSidebarMenuItem[] => {
  try {
    const raw = storage.get(storageKeys.iamMenus);
    if (!raw) return [];
    const items = JSON.parse(raw) as CachedSidebarMenuItem[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

export const persistSidebarMenuCache = (items: CachedSidebarMenuItem[]) => {
  storage.set(storageKeys.iamMenus, JSON.stringify(items));
  const mapping = items.reduce<Record<string, string>>((acc, item) => {
    if (item.path && item.slug) acc[item.path] = item.slug;
    return acc;
  }, {});
  if (Object.keys(mapping).length > 0) {
    storage.set(storageKeys.menusMapping, JSON.stringify(mapping));
  }
};

export const buildSidebarMenuItemsFromIam = async (): Promise<CachedSidebarMenuItem[]> => {
  const staticMapping = getStaticMenuSlugMapping();
  const iamItems = sortMenuItems(uniqueMenuItemsByLink(flattenMenuItems(await getMenu())));

  const mappedItems = await Promise.all(
    iamItems.map(async (item) => {
      const path = normalizeMenuLink(item.link);
      if (!path) return null;

      let slug: string | undefined = item.slug || staticMapping[path];
      if (!slug) {
        const mapping = await getMenuMapping(item.id);
        slug = mapping?.slug;
      }

      return {
        label: item.label || path,
        path,
        slug,
        iconName: item.icon,
      } satisfies CachedSidebarMenuItem;
    }),
  );

  return mappedItems.filter((item) => item !== null) as CachedSidebarMenuItem[];
};

export const refreshSidebarMenuItemConfigs = async (): Promise<MenuItemConfig[]> => {
  try {
    const nextItems = await buildSidebarMenuItemsFromIam();
    if (nextItems.length > 0) {
      persistSidebarMenuCache(nextItems);
      return withDashboardMenu(nextItems.map(toMenuItemConfig));
    }
  } catch {
    const cached = readCachedSidebarMenuItems();
    if (cached.length > 0) {
      return withDashboardMenu(cached.map(toMenuItemConfig));
    }
  }

  return staticMenuItemConfigs();
};

export const clearSidebarMenuCache = () => {
  storage.remove(storageKeys.iamMenus);
};
