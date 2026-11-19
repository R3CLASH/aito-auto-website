'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { metaPixelScript } from '@/lib/metaPixel';
import { readConsent, onConsentChange, type ConsentValue } from '@/lib/consent';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const SCRIPT_ID = 'meta-pixel';

/** Run Meta's loader, verbatim, once consent exists. */
function injectPixel(pixelId: string) {
  if (document.getElementById(SCRIPT_ID)) return;
  const el = document.createElement('script');
  el.id = SCRIPT_ID;
  el.textContent = metaPixelScript(pixelId);
  document.head.appendChild(el);
}

/**
 * The Meta Pixel, loaded only after the visitor agrees to marketing cookies.
 *
 * Nothing is placed in the document head at render time: until consent is
 * granted no script element exists, fbevents.js is never fetched, and Meta
 * receives no request at all. That is what the ePrivacy rules require, and it
 * is stricter than Meta's own consent API, which still loads the script and
 * merely holds events back.
 *
 * It also reports client-side navigations. Meta's snippet counts one PageView
 * per document load, but Next swaps pages without reloading, so a visit moving
 * from the catalogue to a car to the contact page would otherwise register as
 * a single view of the entry page. Query strings are ignored: the inventory
 * filters write to the URL as a search is narrowed, and those are the same
 * page rather than new views.
 */
export default function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const loaded = useRef(false);
  const lastPath = useRef<string | null>(null);

  // localStorage is not available while rendering on the server, so the stored
  // choice is read after mount.
  useEffect(() => {
    setConsent(readConsent());
    return onConsentChange(setConsent);
  }, []);

  useEffect(() => {
    if (!pixelId || consent !== 'granted') return;

    if (!loaded.current) {
      loaded.current = true;
      // The snippet ends with its own track('PageView') for this page.
      injectPixel(pixelId);
      lastPath.current = pathname;
      return;
    }

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window.fbq?.('track', 'PageView');
  }, [consent, pathname, pixelId]);

  return null;
}
