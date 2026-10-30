'use client';

import { create } from 'zustand';

import { storageKeys } from '@/core/constants/storage.constant';
import { storage } from '@/core/utils/storage.util';

type UiState = {
  /** Desktop sidebar shows icons only. Persisted per browser. */
  sidebarCollapsed: boolean;
  /** Mobile navigation drawer. */
  mobileNavOpen: boolean;
  /** Read persisted preferences. Call once after mount to avoid a hydration mismatch. */
  hydrate: () => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,

  hydrate: () => set({ sidebarCollapsed: storage.get(storageKeys.sidebarCollapsed) === 'true' }),

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    storage.set(storageKeys.sidebarCollapsed, String(next));
    set({ sidebarCollapsed: next });
  },

  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
