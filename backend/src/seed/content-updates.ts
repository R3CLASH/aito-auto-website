import type { Core } from '@strapi/strapi';
import { complaintsPage, complaintsService, privacyBody } from './legal';

/**
 * One-off content changes for databases seeded before they existed. Each step
 * checks first and only touches content an editor has not changed, so this is
 * safe to run on every boot: once applied (or edited by hand) it does nothing.
 */

const doc = (strapi: Core.Strapi, uid: string) => strapi.documents(uid as any) as any;

/** The seeded privacy policy had [placeholders]; replace it with the full text. */
async function fillPrivacyPolicy(strapi: Core.Strapi) {
  const pages = doc(strapi, 'api::page.page');
  const page = await pages.findFirst({ filters: { slug: 'tietosuojaseloste' }, status: 'draft', populate: { blocks: true } });
  if (!page) return;
  const blocks: any[] = page.blocks || [];
  const placeholder = blocks.find((b) => b.__component === 'sections.rich-text' && JSON.stringify(b.body || []).includes('[0000000-0]'));
  if (!placeholder) return;

  await pages.update({
    documentId: page.documentId,
    data: { blocks: blocks.map((b) => (b === placeholder ? { ...b, body: privacyBody } : b)) },
  });
  await pages.publish({ documentId: page.documentId });
  strapi.log.info('[content] Privacy policy filled in.');
}

/** The complaints page and its entry on the services page. */
async function addComplaints(strapi: Core.Strapi) {
  const pages = doc(strapi, 'api::page.page');
  if (!(await pages.findFirst({ filters: { slug: complaintsPage.slug }, status: 'draft' }))) {
    await pages.create({ status: 'published', data: complaintsPage });
    strapi.log.info('[content] Complaints page created.');
  }
  const services = doc(strapi, 'api::service.service');
  if (!(await services.findFirst({ filters: { slug: complaintsService.slug }, status: 'draft' }))) {
    await services.create({ status: 'published', data: complaintsService });
    strapi.log.info('[content] Complaints service created.');
  }
}

export async function applyContentUpdates(strapi: Core.Strapi) {
  for (const step of [fillPrivacyPolicy, addComplaints]) {
    try {
      await step(strapi);
    } catch (e) {
      strapi.log.error(`[content] ${step.name} failed: ${(e as Error).stack}`);
    }
  }
}
