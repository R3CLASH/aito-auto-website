import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Public URL of the CMS behind a domain/reverse proxy, e.g. https://cms.aitoauto.fi
  url: env('PUBLIC_URL', ''),
  proxy: env.bool('IS_PROXIED', Boolean(env('PUBLIC_URL', ''))),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

export default config;
