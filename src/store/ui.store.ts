'use client';

import { create } from 'zustand';

import { appConfig } from '@/core/config/app.config';
import type { ThemeMode } from '@/core/types/common.type';

type UiState = {
  sidebarOpen: boolean;
  themeMode: ThemeMode;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  themeMode: appConfig.defaultThemeMode,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setThemeMode: (mode) => set({ themeMode: mode }),
  toggleThemeMode: () =>
    set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
}));
