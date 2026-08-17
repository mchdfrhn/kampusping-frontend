'use client';

import { useEffect } from 'react';

import { getStaticMenuSlugMapping } from '@/core/config/menu.config';
import { storageKeys } from '@/core/constants/storage.constant';
import { getMenu, getMenuMapping, type MenuApiItem } from '@/core/iam/iam.service';
import { storage } from '@/core/utils/storage.util';

const normalizeLink = (link?: string) => {
  if (!link) return '';
  return link.startsWith('/') ? link : `/${link}`;
};

const flattenMenuItems = (items: MenuApiItem[]): MenuApiItem[] =>
  items.flatMap((item) => [item, ...(Array.isArray(item.items) ? flattenMenuItems(item.items) : [])]);

type CachedSidebarMenuItem = {
  path: string;
  slug?: string;
};

const mappingFromCachedMenu = (): Record<string, string> | null => {
  try {
    const raw = storage.get(storageKeys.iamMenus);
    if (!raw) return null;
    const cachedItems = JSON.parse(raw) as CachedSidebarMenuItem[];
    if (!Array.isArray(cachedItems)) return null;

    const mapping: Record<string, string> = {};
    for (const item of cachedItems) {
      if (item.path && item.slug) mapping[item.path] = item.slug;
    }
    return Object.keys(mapping).length > 0 ? mapping : null;
  } catch {
    return null;
  }
};

export const useMenuMapping = () => {
  useEffect(() => {
    const run = async () => {
      if (storage.get(storageKeys.menusMapping)) return;

      const cachedMapping = mappingFromCachedMenu();
      if (cachedMapping) {
        storage.set(storageKeys.menusMapping, JSON.stringify(cachedMapping));
        return;
      }

      const mapping: Record<string, string> = { ...getStaticMenuSlugMapping() };

      try {
        const items = await getMenu();
        const entries = await Promise.all(
          flattenMenuItems(items).map(async (item) => {
            const link = normalizeLink(item.link);
            if (!link) return null;

            if (item.slug) return [link, item.slug] as [string, string];
            if (mapping[link]) return [link, mapping[link]] as [string, string];

            try {
              const resp = await getMenuMapping(item.id);
              const slug = resp?.slug;
              if (slug) return [link, slug] as [string, string];
            } catch {
              // fallback to static mapping when backend mapping is unavailable
            }

            return mapping[link] ? ([link, mapping[link]] as [string, string]) : null;
          }),
        );

        for (const entry of entries) {
          if (!entry) continue;
          const [link, slug] = entry;
          mapping[link] = slug;
        }
      } catch {
        // keep static mapping only
      }

      storage.set(storageKeys.menusMapping, JSON.stringify(mapping));
    };

    void run();
  }, []);
};
