/**
 * Google Tag Manager (container GTM-NMR39SQF).
 *
 * The ID is public and has to reach the browser, so it lives in the source
 * with an env override. Set NEXT_PUBLIC_GTM_ID to an empty string on a staging
 * or preview deployment to keep its traffic out of the real property.
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-NMR39SQF';

export const GTM_SRC = (id: string) =>
  `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;

/**
 * The dataLayer bootstrap that has to run before gtm.js arrives.
 *
 * This keeps the gtag() shim from the supplied snippet and adds the one line
 * it was missing: the `gtm.js` event. GTM's own loader pushes that event, and
 * "Page View" triggers inside the container fire on it -- load the container
 * without it and tags configured on page view never run, which looks exactly
 * like working analytics that records nothing.
 */
export const gtmBootstrap = (id: string) => `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
`.trim();
