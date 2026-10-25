
'use client';

import { useAdSettings } from '@/hooks/use-ad-settings';
import { useEffect } from 'react';

export function AdBanner() {
  const { settings, loading } = useAdSettings();
  const { adsenseKey: publisherId, adSlotId } = settings;

  useEffect(() => {
    if (publisherId && adSlotId) {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error('AdSense push error:', err);
        }
    }
  }, [publisherId, adSlotId]);


  if (loading || !publisherId || !adSlotId) {
    return (
      <div className="flex items-center justify-center h-24 my-6 bg-muted/50 rounded-lg border border-dashed">
        <span className="text-muted-foreground text-sm">Advertisement Banner</span>
      </div>
    );
  }

  return (
    <div className="my-6 text-center overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={adSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
