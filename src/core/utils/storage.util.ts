/**
 * localStorage wrapper that never throws: storage can be unavailable (private mode, blocked
 * cookies) and the app must keep working without it.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  remove(key: string): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
