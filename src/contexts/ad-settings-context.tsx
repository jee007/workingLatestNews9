
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdSettings {
  adsenseKey: string | null;
  adSlotId: string | null;
  gaMeasurementId: string | null;
}

interface AdSettingsContextType {
  settings: AdSettings;
  loading: boolean;
}

export const AdSettingsContext = createContext<AdSettingsContextType | undefined>(undefined);

export function AdSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdSettings>({ adsenseKey: null, adSlotId: null, gaMeasurementId: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      // If db is not initialized, we can't fetch settings.
      if (!db) {
          setLoading(false);
          return;
      }
      try {
        const settingsDocRef = doc(db, 'settings', 'ads');
        const docSnap = await getDoc(settingsDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            adsenseKey: data.adsenseKey || null,
            adSlotId: data.adSlotId || null,
            gaMeasurementId: data.gaMeasurementId || null,
          });
        }
      } catch (error) {
        // This can happen if Firebase is not configured yet, so we don't log an error.
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <AdSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </AdSettingsContext.Provider>
  );
}
