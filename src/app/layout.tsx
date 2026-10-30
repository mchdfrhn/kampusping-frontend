import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { appConfig } from '@/core/config/app.config';
import '@/styles/globals.css';

import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: appConfig.appName, template: `%s · ${appConfig.appName}` },
  description: appConfig.appDescription,
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: appConfig.primaryColor,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={appConfig.locale} className={inter.variable} suppressHydrationWarning>
      <body>
        {/* Applies the saved/system color scheme before first paint to avoid a flash. */}
        <InitColorSchemeScript attribute="class" defaultMode={appConfig.defaultThemeMode} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
