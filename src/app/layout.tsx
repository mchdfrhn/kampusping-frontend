import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { appConfig } from '@/core/config/app.config';
import '@/styles/globals.css';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: appConfig.appName,
  description: `${appConfig.companyName} frontend starter`,
  icons: {
    icon: appConfig.favicon,
    shortcut: appConfig.favicon,
    apple: '/media/favicon/apple-touch-icon.png',
  },
  manifest: '/media/favicon/site.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="//fonts.googleapis.com/css?family=Poppins:300,400,500,600,700" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
