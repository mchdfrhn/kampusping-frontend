'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { AppSnackbar } from '@/components/base/AppSnackbar';

type Severity = 'success' | 'info' | 'warning' | 'error';

type Notify = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const NotifyContext = createContext<Notify | null>(null);

/** App-wide toast notifications: `const notify = useNotify(); notify.success('Saved')`. */
export const NotifyProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: Severity }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const show = useCallback(
    (severity: Severity) => (message: string) => setToast({ open: true, message, severity }),
    [],
  );

  const api = useMemo<Notify>(
    () => ({
      success: show('success'),
      error: show('error'),
      info: show('info'),
      warning: show('warning'),
    }),
    [show],
  );

  return (
    <NotifyContext.Provider value={api}>
      {children}
      <AppSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={(_, reason) =>
          reason !== 'clickaway' && setToast((prev) => ({ ...prev, open: false }))
        }
      />
    </NotifyContext.Provider>
  );
};

export const useNotify = (): Notify => {
  const context = useContext(NotifyContext);
  if (!context) throw new Error('useNotify must be used inside <NotifyProvider>.');
  return context;
};
