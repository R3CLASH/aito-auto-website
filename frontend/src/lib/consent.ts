/**
 * Cookie consent for the marketing pixel.
 *
 * Under GDPR and the ePrivacy rules a tracking pixel may not run until the
 * visitor has agreed to it, so nothing here is opt-out: the Meta Pixel is not
 * loaded at all, and no request reaches Meta, until `marketing` is granted.
 *
 * The choice itself is kept in localStorage rather than a cookie. Storing a
 * visitor's own preference is "strictly necessary" and needs no consent, and
 * localStorage is never attached to requests, so it cannot be used for
 * tracking.
 */
export type ConsentValue = 'granted' | 'denied';

const KEY = 'aa-cookie-consent';

/** Bump when the categories change, so visitors are asked again. */
const VERSION = 1;

export const CONSENT_EVENT = 'aa-consent-change';
export const CONSENT_OPEN_EVENT = 'aa-consent-open';

type Stored = { v: number; marketing: ConsentValue; at: string };

/** The stored choice, or null when the visitor has not answered yet. */
export function readConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.v !== VERSION) return null;
    return parsed.marketing === 'granted' ? 'granted' : 'denied';
  } catch {
    // Private mode, blocked storage, or hand-edited junk: treat as unanswered.
    return null;
  }
}

export function writeConsent(marketing: ConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    const value: Stored = { v: VERSION, marketing, at: new Date().toISOString() };
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* Storage unavailable; the choice still applies for this page view. */
  }
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: marketing }));
}

/** Subscribe to changes; returns an unsubscribe function. */
export function onConsentChange(fn: (value: ConsentValue) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<ConsentValue>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}

/** Reopen the banner, e.g. from the footer link. */
export function openConsentSettings(): void {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/**
 * Drop the first-party cookies Meta's script sets on our own domain.
 *
 * Withdrawing consent has to clear what was already stored, not merely stop
 * sending new events. _fbp and _fbc are set by fbevents.js on this domain, so
 * they are ours to delete.
 */
export function clearMarketingCookies(): void {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const domains = [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const name of ['_fbp', '_fbc']) {
    for (const domain of new Set(domains)) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
    }
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}
