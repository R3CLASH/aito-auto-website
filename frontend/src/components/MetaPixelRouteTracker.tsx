'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Reports the page views Meta's own snippet cannot see.
 *
 * The snippet in the head fires one PageView when the document loads. Every
 * move after that -- a visitor going from the catalogue to a car, or to the
 * contact page -- is a client-side navigation with no page load, so without
 * this the whole visit is recorded as a single view of the entry page.
 *
 * Query strings are deliberately ignored: the inventory filters write to the
 * URL as the visitor narrows a search, and each of those is the same page, not
 * a new view.
 */
export default function MetaPixelRouteTracker({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!pixelId) return;

    // The head snippet already counted the page the visitor landed on.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.fbq?.('track', 'PageView');
  }, [pathname, pixelId]);

  return null;
}
