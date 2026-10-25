
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { BookmarkProvider } from '@/contexts/bookmark-context';
import { CountryProvider } from '@/contexts/country-context';
import { useAdminAutoLogout } from '@/hooks/use-admin-auto-logout';
import { ReactNode } from 'react';

export function ClientLayout({ children }: { children: ReactNode }) {
  useAdminAutoLogout();

  return (
    <CountryProvider>
      <BookmarkProvider>
        <AppLayout>{children}</AppLayout>
      </BookmarkProvider>
    </CountryProvider>
  );
}
