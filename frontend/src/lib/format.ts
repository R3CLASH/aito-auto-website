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

export function isExternal(url: string) {
  return /^https?:\/\//.test(url) || url.startsWith('mailto:') || url.startsWith('tel:');
}

/** "01" style index. */
export const two = (i: number) => String(i).padStart(2, '0');
