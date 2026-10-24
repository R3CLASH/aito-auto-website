import type { Core } from '@strapi/strapi';
import { seed } from './seed';
import { applyAdminLayouts, registerValidation } from './admin-setup';

/** Content types the website reads without authentication. */
const PUBLIC_READ = [
  'api::vehicle-type.vehicle-type',
  'api::brand.brand',
  'api::car-model.car-model',
  'api::car.car',
  'api::service.service',
  'api::page.page',
  'api::global.global',
  'api::finance-setting.finance-setting',
  'api::car-detail-page.car-detail-page',
];

async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!role) return;

  for (const uid of PUBLIC_READ) {
    const ct = strapi.contentType(uid as any);
    const actions = ct.kind === 'singleType' ? ['find'] : ['find', 'findOne'];
    for (const a of actions) {
      const action = `${uid}.${a}`;
      const exists = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: role.id } });
      if (!exists) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({ data: { action, role: role.id } });
      }
    }
  }
}

/** Tell the Next.js site to refresh its cache whenever content changes. */
function registerRevalidation(strapi: Core.Strapi) {
  const url = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;

  let timer: NodeJS.Timeout | null = null;
  const ping = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await fetch(`${url.replace(/\/$/, '')}/api/revalidate`, {
          method: 'POST',
          headers: { 'x-revalidate-secret': secret },
        });
      } catch (e) {
        strapi.log.warn(`[revalidate] Could not reach ${url}: ${(e as Error).message}`);
      }
    }, 800);
  };

  const WRITE_ACTIONS = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'discardDraft']);
  strapi.documents.use(async (ctx, next) => {
    const result = await next();
    if (WRITE_ACTIONS.has(ctx.action) && ctx.uid.startsWith('api::') && ctx.uid !== 'api::lead.lead') ping();
    return result;
  });
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerValidation(strapi);
    registerRevalidation(strapi);
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
    await applyAdminLayouts(strapi);

    if (process.env.SEED_DEMO_DATA === 'false') return;
    const hasGlobal = await strapi.db.query('api::global.global').count();
    const hasPages = await strapi.db.query('api::page.page').count();
    if (!hasGlobal && !hasPages) {
      try {
        await seed(strapi);
      } catch (e) {
        strapi.log.error(`[seed] Failed: ${(e as Error).stack}`);
      }
    }
  },
};
