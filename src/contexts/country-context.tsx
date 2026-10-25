
'use client';

import { COUNTRIES, type CountryCode } from '@/lib/types';
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface CountryContextType {
  country: CountryCode;
  setCountry: (country: CountryCode) => void;
}

export const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getCountryFromParams = useCallback((): CountryCode => {
    const countryParam = searchParams.get('country');
    const validCodes = COUNTRIES.map(c => c.code);
    if (countryParam && (validCodes as string[]).includes(countryParam)) {
      return countryParam as CountryCode;
    }
    return 'us'; // default country
  }, [searchParams]);

  const [country, setCountryState] = useState<CountryCode>(getCountryFromParams);

  useEffect(() => {
    setCountryState(getCountryFromParams());
  }, [getCountryFromParams]);

  const setCountry = useCallback((newCountry: CountryCode) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('country', newCountry);
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }, [pathname, router, searchParams]);

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
}
