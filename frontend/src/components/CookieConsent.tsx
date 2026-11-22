'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  CONSENT_OPEN_EVENT,
  clearMarketingCookies,
  readConsent,
  writeConsent,
  type ConsentValue,
} from '@/lib/consent';

/**
 * Cookie banner for the marketing pixel.
 *
 * Shown once until the visitor answers, and reopened from the footer link.
 * Accept and reject are the same size and weight on purpose: under GDPR a
 * refusal must be as easy to give as agreement, so there is no styling that
 * nudges towards "accept", nothing is pre-selected, and closing the banner
 * without choosing is not treated as consent -- it simply asks again next
 * visit.
 */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    const stored = readConsent();
    setCurrent(stored);
    setOpen(stored === null);

    const reopen = () => {
      setCurrent(readConsent());
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  const choose = useCallback((value: ConsentValue) => {
    const hadConsent = readConsent() === 'granted';
    writeConsent(value);
    setCurrent(value);
    setOpen(false);

    if (value === 'denied') {
      // Stop any events already queued and drop what was stored on this domain.
      window.fbq?.('consent', 'revoke');
      clearMarketingCookies();
      // fbevents.js cannot be unloaded from a running page, so when it was
      // already active this session, reload to a clean one.
      if (hadConsent) window.location.reload();
    }
  }, []);

  if (!open) return null;

  return (
    <div className="cc" role="dialog" aria-modal="false" aria-labelledby="cc-title">
      <div className="cc-in">
        <div className="cc-copy">
          <h2 id="cc-title" className="cc-title">Evästeet</h2>
          <p>
            Käytämme sivuston toiminnan kannalta välttämättömiä evästeitä aina. Analytiikka- ja
            markkinointievästeitä (Google Analytics ja Meta-pikseli) käytämme vain
            suostumuksellasi – niiden avulla mittaamme sivuston käyttöä ja mainontamme
            toimivuutta. Voit muuttaa valintaasi milloin tahansa sivun alareunasta.{' '}
            <Link href="/tietosuojaseloste">Lue tietosuojaselosteesta</Link>.
          </p>
        </div>
        <div className="cc-actions">
          <button type="button" className="btn btn-navy cut cc-btn" onClick={() => choose('denied')}>
            Vain välttämättömät
          </button>
          <button type="button" className="btn btn-azure cut cc-btn" onClick={() => choose('granted')}>
            Hyväksy kaikki
          </button>
        </div>
        {current ? (
          <p className="cc-note">
            Nykyinen valintasi: {current === 'granted' ? 'markkinointievästeet sallittu' : 'vain välttämättömät'}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
