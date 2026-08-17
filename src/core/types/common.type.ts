export type ThemeMode = 'light' | 'dark';
export type SidebarMode = 'full' | 'mini';
export type LayoutType = 'dashboard' | 'blank';

export type Nullable<T> = T | null;

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
