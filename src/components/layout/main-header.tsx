'use client';

import { PanelLeft, X, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { CountrySwitcher } from '../article/country-switcher';
import { useSidebar } from '../ui/sidebar';
import { Button } from '../ui/button';

export function MainHeader() {
  const { toggleSidebar, openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          {openMobile ? <X className="h-6 w-6" /> : <PanelLeft className="h-6 w-6" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Link href="/" className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          <h1 className="hidden sm:block font-headline text-xl font-bold text-foreground">
            LatestNews9.com
          </h1>
        </Link>
      </div>
      <div className="flex-1" />
      <CountrySwitcher />
    </header>
  );
}
