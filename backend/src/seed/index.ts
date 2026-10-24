import type { Core } from '@strapi/strapi';
import fs from 'node:fs';
import path from 'node:path';
import * as data from './data';

const SEED_DIR = path.join(process.cwd(), 'data', 'seed');

async function uploadFile(strapi: Core.Strapi, fileName: string, alt: string) {
  const filepath = path.join(SEED_DIR, fileName);
  if (!fs.existsSync(filepath)) return null;
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name: fileName } });
  if (existing) return existing;
  const stats = fs.statSync(filepath);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const mimetype = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      data: { fileInfo: { name: fileName, alternativeText: alt, caption: alt } },
      files: { filepath, originalFilename: fileName, mimetype, size: stats.size },
    });
  return file;
}

const doc = (strapi: Core.Strapi, uid: string) => strapi.documents(uid as any) as any;

export async function seed(strapi: Core.Strapi) {
  strapi.log.info('[seed] Seeding Aito Auto demo content…');

  // Media
  const logo = await uploadFile(strapi, 'logo.png', 'Aito Auto Oy');

  // Vehicle types
  const typeIds: Record<string, string> = {};
  for (const t of data.vehicleTypes) {
    const img = await uploadFile(strapi, t.image, t.name);
    const created = await doc(strapi, 'api::vehicle-type.vehicle-type').create({
      data: { name: t.name, shortName: t.shortName, slug: t.slug, order: t.order, silhouette: img?.id ?? null },
    });
    typeIds[t.slug] = created.documentId;
  }

  // Brands
  const brandIds: Record<string, string> = {};
  for (const b of data.brands) {
    const created = await doc(strapi, 'api::brand.brand').create({ data: b });
    brandIds[b.slug] = created.documentId;
  }

  // Models + cars
  const brandName = Object.fromEntries(data.brands.map((b) => [b.slug, b.name]));
  let first = true;
  for (const [brandSlug, modelName, modelSlug, typeSlug, cars] of data.models) {
    const model = await doc(strapi, 'api::car-model.car-model').create({
      data: { name: modelName, slug: modelSlug, brand: brandIds[brandSlug] },
    });
    for (const [variant, year, mileage, fuel, transmission, price] of cars) {
      const title = `${brandName[brandSlug]} ${modelName} ${variant}`;
      const slug = `${modelSlug}-${variant}-${year}`
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const feat = data.featured.find(([m, v]) => m === modelSlug && v === variant);
      const extra = first ? data.showcaseCar : {};
      first = false;
      await doc(strapi, 'api::car.car').create({
        status: 'published',
        data: {
          title, slug, variant, year, mileage, fuel, transmission, price,
          drivetrain: typeSlug === 'maasturi-suv' || /AWD|4x4/.test(variant) ? 'Neliveto' : 'Etuveto',
          car_model: model.documentId,
          vehicle_type: typeIds[typeSlug],
          featured: Boolean(feat),
          badge: feat ? feat[2] : null,
          vatDeductible: typeSlug === 'pakettiauto',
          saleStatus: 'available',
          ...extra,
          highlights: ((extra as any).highlights || []).map((label: string) => ({ label })),
          equipment: ((extra as any).equipment || []).map((label: string) => ({ label })),
        },
      });
    }
  }

  // Services
  for (const s of data.services) {
    await doc(strapi, 'api::service.service').create({ status: 'published', data: s });
  }

  // Pages
  for (const pg of data.pages) {
    await doc(strapi, 'api::page.page').create({ status: 'published', data: pg });
  }

  // Single types
  await doc(strapi, 'api::global.global').create({ data: { ...data.global, logo: logo?.id ?? null } });
  await doc(strapi, 'api::finance-setting.finance-setting').create({ data: data.finance });
  await doc(strapi, 'api::car-detail-page.car-detail-page').create({ data: data.carDetailPage });

  strapi.log.info('[seed] Done.');
}
