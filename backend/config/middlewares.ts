import type { Core } from '@strapi/strapi';

/**
 * Media does not live on this service. The bucket is private, so uploads are
 * stored with URLs pointing at the website, which reads them back over a signed
 * request (see config/plugins.ts). The admin panel's default policy only allows
 * images from 'self', so every thumbnail is blocked before it is even fetched
 * unless the site's origin is named here.
 *
 * Both the apex and the www host are listed: rows written before the canonical
 * host settled still carry the other one, and a redirect does not help when the
 * first request never leaves the browser.
 */
const mediaOrigins = (site: string) => {
  const base = site.replace(/\/$/, '');
  if (!base) return [];
  const apex = base.replace('://www.', '://');
  const www = apex.replace('://', '://www.');
  return [...new Set([base, apex, www])];
};

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  const media = mediaOrigins(env('FRONTEND_URL', ''));

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': ["'self'", 'data:', 'blob:', 'https://market-assets.strapi.io', ...media],
            'media-src': ["'self'", 'data:', 'blob:', 'https://market-assets.strapi.io', ...media],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};

export default config;
