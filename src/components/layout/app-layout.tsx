'use client';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { MainHeader } from './main-header';
import { SidebarNav } from './sidebar-nav';
import { Settings } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CategoryTabs } from './category-tabs';
import { Footer } from './footer';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          {/* Content removed and moved to MainHeader */}
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/admin" className="w-full">
                <SidebarMenuButton isActive={pathname.startsWith('/admin')} tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
            <MainHeader />
            <CategoryTabs />
            <main className="flex-1 p-4 md:p-6 bg-background">
                {children}
            </main>
            <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
