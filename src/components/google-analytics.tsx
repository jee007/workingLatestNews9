
'use client';

import { useAdSettings } from '@/hooks/use-ad-settings';
import Script from 'next/script';

export function GoogleAnalytics() {
  const { settings, loading } = useAdSettings();
  const gaMeasurementId = settings.gaMeasurementId;

  if (loading || !gaMeasurementId) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}');
          `,
        }}
      />
    </>
  );
}
