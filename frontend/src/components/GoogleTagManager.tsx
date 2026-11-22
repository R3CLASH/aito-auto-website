'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GTM_SRC, gtmBootstrap } from '@/lib/gtm';
import { readConsent, onConsentChange, type ConsentValue } from '@/lib/consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const BOOT_ID = 'gtm-bootstrap';
const SRC_ID = 'gtm-src';

/** Bootstrap the dataLayer, then pull gtm.js in — the order the container expects. */
function injectGtm(id: string) {
  if (document.getElementById(SRC_ID)) return;

  const boot = document.createElement('script');
  boot.id = BOOT_ID;
  boot.textContent = gtmBootstrap(id);
  document.head.appendChild(boot);

  const src = document.createElement('script');
  src.id = SRC_ID;
  src.async = true;
  src.src = GTM_SRC(id);
  document.head.appendChild(src);
}

/**
 * Google Tag Manager, loaded only after the visitor accepts cookies.
 *
 * Google's own instructions put this as high in <head> as possible, and on a
 * plain HTML site that is right. Here it cannot be: GTM loads Google Analytics,
 * which sets cookies and sends visitor data to Google, and under GDPR and the
 * ePrivacy rules that needs agreement first -- the same rule that already
 * governs the Meta Pixel on this site. So nothing is rendered for it until
 * consent exists: no script element, gtm.js is never fetched, and Google
 * receives no request at all.
 *
 * Within a page view that is still "as high as possible": the container is
 * injected into <head> the moment consent is read, before anything else runs.
 *
 * Page views on client-side navigation are deliberately NOT pushed here. GA4's
 * enhanced measurement already counts browser history events by default, so
 * pushing our own page_view would record every move twice. The neutral
 * `spa_route_change` event below fires no tag unless a trigger is built for it,
 * so it is there if the container ever needs an explicit hook.
 */
export default function GoogleTagManager({ gtmId }: { gtmId: string }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const loaded = useRef(false);
  const lastPath = useRef<string | null>(null);

  // localStorage is unavailable while rendering on the server.
  useEffect(() => {
    setConsent(readConsent());
    return onConsentChange(setConsent);
  }, []);

  useEffect(() => {
    if (!gtmId || consent !== 'granted') return;

    if (!loaded.current) {
      loaded.current = true;
      injectGtm(gtmId);
      lastPath.current = pathname;
      return;
    }

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window.dataLayer?.push({
      event: 'spa_route_change',
      page_path: pathname,
      page_title: document.title,
    });
  }, [consent, pathname, gtmId]);

  return null;
}
