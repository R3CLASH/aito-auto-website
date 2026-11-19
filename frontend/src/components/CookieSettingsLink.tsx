'use client';

import { openConsentSettings } from '@/lib/consent';

/** Footer entry point for changing or withdrawing the cookie choice. */
export default function CookieSettingsLink() {
  return (
    <button type="button" className="ft-cc" onClick={openConsentSettings}>
      Evästeasetukset
    </button>
  );
}
