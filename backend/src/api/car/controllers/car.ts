import { factories } from '@strapi/strapi';
import { toCsv, blocksToText, type CsvValue } from '../../../utils/csv';
import { isAuthenticatedAdmin } from '../../../utils/admin-auth';

const PAGE = 100;

/** Column headers, bilingual to match the labels used in the admin panel. */
const HEADERS = [
  'Tila (Status)',
  'Myyntitila (Sale status)',
  'Merkki (Brand)',
  'Malli (Model)',
  'Otsikko (Title)',
  'Versio (Variant)',
  'Ajoneuvotyyppi (Vehicle type)',
  'Vuosimalli (Year)',
  'Mittarilukema km (Mileage)',
  'Hinta EUR (Price)',
  'Kuukausierä EUR (Monthly)',
  'Käyttövoima (Fuel)',
  'Vaihteisto (Transmission)',
  'Vetotapa (Drivetrain)',
  'Teho kW (Power)',
  'Väri (Colour)',
  'Katsastettu (Inspected until)',
  'CO2 g/km',
  'Rekisterinumero (Reg. number)',
  'ALV-vähennyskelpoinen (VAT deductible)',
  'Nostettu (Featured)',
  'Tarra (Badge)',
  'Kuvia (Images)',
  'Varusteet (Equipment)',
  'Nostot (Highlights)',
  'Lisätiedot (Extra specs)',
  'Kuvaus (Description)',
  'Sisäiset muistiinpanot (Internal notes)',
  'Osoite (URL)',
  'Luotu (Created)',
  'Päivitetty (Updated)',
  'Tunniste (Document ID)',
];

/** Read every document of one status, a page at a time. */
async function findAll(strapi: any, status: 'draft' | 'published', params: object = {}) {
  const out: any[] = [];
  for (let start = 0; ; start += PAGE) {
    const batch = await strapi.documents('api::car.car').findMany({
      status,
      start,
      limit: PAGE,
      sort: ['createdAt:desc'],
      ...params,
    });
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
}

const date = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : '');

export default factories.createCoreController('api::car.car', ({ strapi }) => ({
  /**
   * GET /api/cars/export — the whole catalogue as a CSV.
   *
   * Every car is included, draft and published alike, each row carrying its
   * publish state and sale status so the dealer can filter in the spreadsheet
   * rather than wonder what was left out.
   */
  async exportCsv(ctx: any) {
    if (!(await isAuthenticatedAdmin(strapi, ctx))) {
      return ctx.unauthorized('Kirjaudu sisään hallintapaneeliin.');
    }

    // The draft pass returns every document; the published pass tells us which
    // of them are live.
    const cars = await findAll(strapi, 'draft', {
      populate: {
        car_model: { populate: ['brand'] },
        vehicle_type: true,
        images: { fields: ['id'] },
        equipment: true,
        highlights: true,
        extraSpecs: true,
      },
    });
    const live = new Set(
      (await findAll(strapi, 'published', { fields: ['documentId'] })).map((c: any) => c.documentId)
    );

    const siteUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

    const rows: CsvValue[][] = cars.map((c: any) => {
      const model = c.car_model || null;
      const brand = model?.brand || null;
      const path =
        brand && model && c.slug ? `/autot/${brand.slug}/${model.slug}/${c.slug}` : '';

      return [
        live.has(c.documentId) ? 'Julkaistu' : 'Luonnos',
        c.saleStatus ?? '',
        brand?.name ?? '',
        model?.name ?? '',
        c.title ?? '',
        c.variant ?? '',
        c.vehicle_type?.name ?? '',
        c.year ?? '',
        c.mileage ?? '',
        c.price ?? '',
        c.monthlyInstallment ?? '',
        c.fuel ?? '',
        c.transmission ?? '',
        c.drivetrain ?? '',
        c.powerKw ?? '',
        c.color ?? '',
        c.inspectedUntil ?? '',
        c.co2 ?? '',
        c.registrationNumber ?? '',
        Boolean(c.vatDeductible),
        Boolean(c.featured),
        c.badge ?? '',
        Array.isArray(c.images) ? c.images.length : 0,
        (c.equipment || []).map((e: any) => e.value ?? e.label ?? '').filter(Boolean).join(' | '),
        (c.highlights || []).map((h: any) => h.value ?? h.label ?? '').filter(Boolean).join(' | '),
        (c.extraSpecs || [])
          .map((s: any) => [s.label, s.value].filter(Boolean).join(': '))
          .filter(Boolean)
          .join(' | '),
        blocksToText(c.description),
        c.internalNotes ?? '',
        path ? `${siteUrl}${path}` : '',
        date(c.createdAt),
        date(c.updatedAt),
        c.documentId ?? '',
      ];
    });

    const delimiter = ctx.query?.delimiter === 'comma' ? ',' : ';';
    const stamp = new Date().toISOString().slice(0, 10);

    ctx.set('Content-Type', 'text/csv; charset=utf-8');
    ctx.set('Content-Disposition', `attachment; filename="aito-auto-autot-${stamp}.csv"`);
    ctx.set('Cache-Control', 'no-store');
    ctx.body = toCsv(HEADERS, rows, delimiter);
  },
}));
