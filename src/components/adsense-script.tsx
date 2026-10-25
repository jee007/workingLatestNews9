
'use client';

import { useAdSettings } from '@/hooks/use-ad-settings';
import Script from 'next/script';

export function AdSenseScript() {
  const { settings, loading } = useAdSettings();

  if (loading || !settings.adsenseKey) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsenseKey}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
