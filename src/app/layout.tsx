
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FilterProvider } from '@/contexts/filter-context';
import { AdSenseScript } from '@/components/adsense-script';
import { AdSettingsProvider } from '@/contexts/ad-settings-context';
import { GoogleAnalytics } from '@/components/google-analytics';
import { Suspense } from 'react';
import { ClientLayout } from '@/components/client-layout';
import Loading from './loading';

export const metadata: Metadata = {
  title: 'LatestNews9.com',
  description: 'Your multilingual news source, powered by AI.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📰</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Belleza&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AdSettingsProvider>
          <AdSenseScript />
          <GoogleAnalytics />
          <FilterProvider>
            <Suspense fallback={<Loading />}>
              <ClientLayout>{children}</ClientLayout>
            </Suspense>
          </FilterProvider>
        </AdSettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}
