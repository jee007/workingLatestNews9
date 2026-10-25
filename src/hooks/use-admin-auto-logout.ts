
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from './use-toast';

export function useAdminAutoLogout() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;

    if (
      auth?.currentUser &&
      previousPathname &&
      previousPathname.startsWith('/admin') &&
      !pathname.startsWith('/admin')
    ) {
      signOut(auth)
        .then(() => {
          toast({
            title: 'Logged Out',
            description: 'You have been logged out of the admin panel.',
          });
        })
        .catch((error) => {
          console.error("Auto-logout on navigation failed:", error);
        });
    }

    previousPathnameRef.current = pathname;
  }, [pathname, toast]);
}
