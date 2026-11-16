import type { Core } from '@strapi/strapi';

/**
 * The email sales get for every form submission (leads and email inquiries):
 * a plain-text part and an HTML card laid out as customer / request / message
 * with one-tap reply buttons. `salesEmail` is pure so it can be rendered alone.
 */

export type Submission = {
  name: string;
  phone: string;
  email?: string | null;
  topic?: string;
  message?: string;
  carTitle?: string;
  carDetails?: string;
  tradeIn?: string;
  sourcePage?: string;
  documentId?: string;
};

export type Kind = {
  /** "Sähköpostikysely", "Yhteydenotto" … shown in the subject and header. */
  label: string;
  /** Content-type uid, for the "open in Strapi" link. */
  uid: string;
};

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const trimUrl = (v?: string) => (v || '').replace(/\/$/, '');
const telDigits = (phone: string) => phone.replace(/[^\d+]/g, '');

// Finnish numbers as typed ("040 123 4567") → international digits for wa.me.
const waDigits = (phone: string) => {
  const d = telDigits(phone);
  if (d.startsWith('+')) return d.slice(1);
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0')) return `358${d.slice(1)}`;
  return d;
};

const link = (href: string, text: string) => `<a href="${esc(href)}" style="color:#136a9c">${esc(text)}</a>`;

/** One labelled row; skipped when empty. `html` values are already escaped. */
const row = (label: string, value?: string | null, html?: string) =>
  value
    ? `<tr><td style="padding:10px 16px 10px 0;color:#5a6576;font-size:13px;white-space:nowrap;vertical-align:top;width:120px">${label}</td>` +
      `<td style="padding:10px 0;color:#0f1b2b;font-size:15px;vertical-align:top">${html ?? esc(value)}</td></tr>`
    : '';

const heading = (text: string) =>
  `<div style="color:#5a6576;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">${text}</div>`;

const button = (href: string, label: string, bg: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 18px;background:${bg};color:#ffffff;` +
  `font-weight:700;font-size:14px;text-decoration:none;border-radius:4px">${label}</a>`;

export function salesEmail(s: Submission, kind: Kind, urls: { site?: string; cms?: string }) {
  const site = trimUrl(urls.site);
  const cms = trimUrl(urls.cms);
  const pageUrl = s.sourcePage && site ? `${site}${s.sourcePage}` : '';
  const adminUrl = cms && s.documentId ? `${cms}/admin/content-manager/collection-types/${kind.uid}/${s.documentId}` : '';
  const selling = s.topic === 'Myy auto';
  const tradeInLabel = selling ? 'Myytävä auto' : 'Vaihtoauto';
  const what = selling
    ? ['Myy auto', s.carTitle || s.tradeIn].filter(Boolean).join(': ')
    : s.carTitle || s.topic || 'Verkkosivut';
  const subject = `${kind.label}: ${what} – ${s.name}`;
  const replyNote = s.email
    ? 'Vastaa tähän viestiin, niin vastaus menee suoraan asiakkaalle.'
    : 'Asiakas ei antanut sähköpostia – vastaa puhelimella tai WhatsAppissa.';

  // Plain-text part for clients that do not render HTML.
  const text = [
    `${kind.label} verkkosivuilta`,
    '',
    `Nimi: ${s.name}`,
    `Puhelin: ${s.phone}`,
    s.email ? `Sähköposti: ${s.email}` : null,
    s.topic ? `Aihe: ${s.topic}` : null,
    s.carTitle ? `Auto: ${s.carTitle}` : null,
    s.carDetails ? `Tiedot: ${s.carDetails}` : null,
    s.tradeIn ? `${tradeInLabel}: ${s.tradeIn}` : null,
    pageUrl ? `Sivu: ${pageUrl}` : null,
    '',
    'Viesti:',
    s.message || '-',
    '',
    replyNote,
    adminUrl ? `Avaa Strapissa: ${adminUrl}` : null,
  ].filter((l) => l !== null).join('\n');

  const html = `<!doctype html><html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:24px 12px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dadde2">
  <tr><td style="background:#16263d;padding:20px 24px">
    <div style="color:#9ccdea;font-size:12px;letter-spacing:.08em;text-transform:uppercase">${esc(kind.label)} · verkkosivut</div>
    <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px">${esc(what)}</div>
  </td></tr>
  <tr><td style="padding:20px 24px 4px">
    ${heading('Asiakas')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      ${row('Nimi', s.name, `<strong>${esc(s.name)}</strong>`)}
      ${row('Puhelin', s.phone, link(`tel:${telDigits(s.phone)}`, s.phone))}
      ${row('Sähköposti', s.email, s.email ? link(`mailto:${s.email}`, s.email) : undefined)}
    </table>
  </td></tr>
  <tr><td style="padding:12px 24px 4px">
    ${heading('Asia')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      ${row('Aihe', s.topic)}
      ${row('Auto', s.carTitle)}
      ${row('Tiedot', s.carDetails)}
      ${row(tradeInLabel, s.tradeIn)}
      ${row('Sivu', pageUrl, pageUrl ? link(pageUrl, s.sourcePage || pageUrl) : undefined)}
    </table>
  </td></tr>
  <tr><td style="padding:12px 24px 8px">
    ${heading('Viesti')}
    <div style="margin-top:4px;background:#f3f4f6;border-left:4px solid #1a7eb6;padding:14px 16px;color:#0f1b2b;font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(s.message || '-')}</div>
  </td></tr>
  <tr><td style="padding:16px 24px 12px">
    ${s.email ? button(`mailto:${s.email}?subject=${encodeURIComponent(`Re: ${what}`)}`, 'Vastaa sähköpostilla', '#16263d') : ''}
    ${button(`tel:${telDigits(s.phone)}`, 'Soita', '#1a7eb6')}
    ${button(`https://wa.me/${waDigits(s.phone)}`, 'WhatsApp', '#1f9d55')}
  </td></tr>
  <tr><td style="padding:12px 24px 20px;border-top:1px solid #dadde2;color:#5a6576;font-size:12px;line-height:1.5">
    ${replyNote}${adminUrl ? `<br>${link(adminUrl, 'Avaa Strapissa')}` : ''}
  </td></tr>
</table></body></html>`;

  return { subject, text, html };
}

/**
 * Mails a submission to sales. The recipient is INQUIRY_NOTIFY_TO, or the
 * address in Yleiset asetukset (Global) when that is unset. Returns false when
 * no recipient is configured, so the caller can record it; throws on send errors.
 */
export async function sendSalesEmail(strapi: Core.Strapi, s: Submission, kind: Kind) {
  let to = process.env.INQUIRY_NOTIFY_TO;
  if (!to) {
    const global = await strapi.documents('api::global.global').findFirst({ fields: ['email'] as any });
    to = (global as any)?.email || undefined;
  }
  if (!to) {
    strapi.log.warn('sales email: no recipient (set INQUIRY_NOTIFY_TO or Global → email)');
    return false;
  }

  const { subject, text, html } = salesEmail(s, kind, { site: process.env.FRONTEND_URL, cms: process.env.PUBLIC_URL });
  await strapi.plugin('email').service('email').send({
    to,
    ...(s.email ? { replyTo: s.email } : {}),
    subject,
    text,
    html,
  });

  strapi.log.info(`sales email: ${kind.label} sent to ${to}`);
  return true;
}
