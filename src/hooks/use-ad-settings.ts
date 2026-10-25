
'use client';

import { useContext } from 'react';
import { AdSettingsContext } from '@/contexts/ad-settings-context';

export function useAdSettings() {
  const context = useContext(AdSettingsContext);
  if (context === undefined) {
    throw new Error('useAdSettings must be used within an AdSettingsProvider');
  }
  return context;
}
