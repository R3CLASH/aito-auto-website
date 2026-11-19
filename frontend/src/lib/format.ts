/** 27900 → "27 900" (Finnish thousands separator, non-breaking). */
export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const euro = (n: number) => `${fmt(n)} €`;
export const km = (n: number) => `${fmt(n)} km`;
export const pct = (n: number, digits = 1) => n.toFixed(digits).replace('.', ',');

export function waLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * Make a link typed into the CMS safe to put in an href.
 *
 * Someone entering a profile address naturally writes "facebook.com/aitoauto"
 * or "www.facebook.com/aitoauto". The browser reads a value with no scheme as a
 * path relative to the current page, so the icon quietly sends the visitor to
 * aitoautooy.fi/facebook.com/aitoauto instead of Facebook. Nothing in Strapi
 * validates these fields, so normalise here: add https:// when a scheme is
 * missing, and leave real internal paths, mailto: and tel: alone.
 */
export function externalUrl(url: string | null | undefined): string {
  const value = (url || '').trim();
  if (!value) return '';

  // Protocol-relative ("//example.com") -- pin it to https.
  if (value.startsWith('//')) return `https:${value}`;

  // Already carries a scheme, or is deliberately internal.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('/')) return value;

  // A bare "#anchor" or query stays as written.
  if (value.startsWith('#') || value.startsWith('?')) return value;

  return `https://${value}`;
}

export function isExternal(url: string) {
  return /^https?:\/\//.test(url) || url.startsWith('mailto:') || url.startsWith('tel:');
}

/** "01" style index. */
export const two = (i: number) => String(i).padStart(2, '0');
