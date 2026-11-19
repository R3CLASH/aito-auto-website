/**
 * Meta (Facebook) Pixel.
 *
 * The ID is a public identifier that has to reach the browser, so it lives in
 * the source with an env override. Set NEXT_PUBLIC_META_PIXEL_ID to an empty
 * string on a staging or preview deployment to keep its traffic out of the
 * real dataset.
 */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1462369685963794';

/**
 * Meta's standard loader, unchanged apart from the injected ID. It runs in the
 * document head so the first PageView is reported as early as possible; the
 * fbevents.js it pulls in is loaded async and does not block rendering.
 *
 * Only the first page of a visit is counted here. Next swaps later pages on the
 * client without reloading the document, so those are reported by
 * MetaPixelRouteTracker instead.
 */
export const metaPixelScript = (id: string) => `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
`.trim();
