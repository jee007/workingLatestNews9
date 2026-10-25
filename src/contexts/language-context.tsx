
'use client';

import type { Language } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'language' in navigator) {
      const browserLang = navigator.language.split('-')[0] as Language;
      const supportedLanguages: Language[] = ['en', 'ar', 'ur', 'hi', 'te', 'ta', 'ml'];
      if (supportedLanguages.includes(browserLang)) {
        setLanguage(browserLang);
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
