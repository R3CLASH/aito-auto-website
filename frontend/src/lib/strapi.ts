import 'server-only';
import qs from 'qs';
import { cache } from 'react';
import { monthlyPayment } from './finance';
import type {
  BrandNode, CarDetail, CarSummary, Catalog, FinanceSettings, GlobalSettings, Media,
  PageData, ServiceItem, VehicleType, CarDetailTemplate,
} from './types';

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const TOKEN = process.env.STRAPI_API_TOKEN;
export const CACHE_TAG = 'strapi';

async function api<T = any>(path: string, query: Record<string, unknown> = {}): Promise<T> {
  const q = qs.stringify(query, { encodeValuesOnly: true });
  const url = `${STRAPI_URL}/api/${path}${q ? `?${q}` : ''}`;
  const res = await fetch(url, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
    next: { revalidate: 300, tags: [CACHE_TAG] },
  });
  if (res.status === 404) return { data: null } as T;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Strapi ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/** Turn a Strapi media object into a URL the browser can load (local uploads are proxied via /uploads). */
export function mediaUrl(m?: { url?: string } | null): string | null {
  if (!m?.url) return null;
  if (m.url.startsWith('http')) {
    // Media served by this Strapi instance → make it relative so it goes through the /uploads rewrite.
    if (m.url.startsWith(STRAPI_URL)) return m.url.slice(STRAPI_URL.length);
    return m.url;
  }
  return m.url;
}

function media(m: any): Media | null {
  const url = mediaUrl(m);
  if (!url) return null;
  return { url, alt: m.alternativeText || '', width: m.width || 1200, height: m.height || 800 };
}

/* ------------------------------------------------------------------ singles */

export const getGlobal = cache(async (): Promise<GlobalSettings> => {
  const res = await api('global', {
    populate: {
      logo: true, openingHours: true, navigation: true, headerCta: true, footerLinks: true,
      whatsappTopics: true, defaultSeo: { populate: { shareImage: true } },
    },
  });
  const g = res.data || {};
  return {
    siteName: g.siteName || 'Aito Auto Oy',
    tagline: g.tagline || '',
    logo: media(g.logo),
    whatsappNumber: (g.whatsappNumber || '').replace(/\D/g, ''),
    phone: g.phone || '',
    phoneDisplay: g.phoneDisplay || g.phone || '',
    email: g.email || '',
    street: g.street || '',
    postalCode: g.postalCode || '',
    city: g.city || '',
    businessId: g.businessId || '',
    invoicingAddress: g.invoicingAddress || '',
    mapsUrl: g.mapsUrl || '',
    mapEmbedUrl: g.mapEmbedUrl || '',
    openingHours: [...(g.openingHours || [])].sort((a: any, b: any) => a.dayIndex - b.dayIndex),
    openingHoursNote: g.openingHoursNote || '',
    navigation: g.navigation || [],
    headerCta: g.headerCta || null,
    footerTagline: g.footerTagline || '',
    footerLinks: g.footerLinks || [],
    whatsappTopics: (g.whatsappTopics || []).map((t: any) => t.label),
    defaultSeo: g.defaultSeo ? { ...g.defaultSeo, shareImage: media(g.defaultSeo.shareImage) } : null,
  };
});

export const getFinance = cache(async (): Promise<FinanceSettings> => {
  const res = await api('finance-setting');
  const f = res.data || {};
  const num = (v: any, d: number) => (v === null || v === undefined || v === '' ? d : Number(v));
  const terms = Array.isArray(f.termOptions) && f.termOptions.length ? f.termOptions.map(Number) : [24, 36, 48, 60, 72, 84];
  return {
    interestRate: num(f.interestRate, 4.9),
    interestMin: num(f.interestMin, 1.9),
    interestMax: num(f.interestMax, 9.9),
    openingFee: num(f.openingFee, 190),
    monthlyFee: num(f.monthlyFee, 9),
    defaultDownPct: num(f.defaultDownPct, 10),
    maxDownPct: num(f.maxDownPct, 50),
    downStep: num(f.downStep, 5) || 5,
    defaultTermMonths: num(f.defaultTermMonths, 60),
    termOptions: terms,
    maxBalloonPct: num(f.maxBalloonPct, 35),
    balloonStep: num(f.balloonStep, 5) || 5,
    partnerName: f.partnerName || '',
    exampleNote: f.exampleNote || '',
    disclaimer: f.disclaimer || '',
  };
});

export const getCarTemplate = cache(async (): Promise<CarDetailTemplate> => {
  const res = await api('car-detail-page', { populate: { trustBadges: true, blocks: blocksPopulate } });
  const d = res.data || {};
  return {
    trustBadges: (d.trustBadges || []).map((t: any) => t.label),
    specsTitle: d.specsTitle || 'Perustiedot',
    equipmentTitle: d.equipmentTitle || 'Mukana',
    calculatorEyebrow: d.calculatorEyebrow || 'Osamaksulaskuri',
    calculatorTitle: d.calculatorTitle || 'Säädä erä sopivaksi',
    descriptionTitle: d.descriptionTitle || 'Myyjän kuvaus',
    descriptionFallback: d.descriptionFallback || '',
    similarTitle: d.similarTitle || 'Muut samanlaiset',
    blocks: d.blocks || [],
  };
});

/* ------------------------------------------------------------------ catalog */

async function fetchAll(path: string, query: Record<string, unknown>) {
  const out: any[] = [];
  let page = 1;
  for (;;) {
    const res = await api(path, { ...query, pagination: { page, pageSize: 100 } });
    out.push(...(res.data || []));
    const pc = res.meta?.pagination?.pageCount || 1;
    if (page >= pc || page >= 50) break;
    page++;
  }
  return out;
}

export function carHref(c: { slug: string; brand: { slug: string }; model: { slug: string } }) {
  return `/autot/${c.brand.slug}/${c.model.slug}/${c.slug}`;
}

/** Everything the listing, home page sections and filters need, in one cached call. */
export const getCatalog = cache(async (): Promise<Catalog> => {
  const [typesRaw, brandsRaw, carsRaw, finance] = await Promise.all([
    fetchAll('vehicle-types', { sort: ['order:asc', 'name:asc'], populate: { silhouette: true } }),
    fetchAll('brands', { sort: ['order:asc', 'name:asc'], populate: { logo: true, car_models: { sort: ['name:asc'] } } }),
    fetchAll('cars', {
      sort: ['createdAt:desc'],
      filters: { saleStatus: { $ne: 'sold' } },
      fields: ['title', 'slug', 'variant', 'price', 'year', 'mileage', 'fuel', 'transmission', 'badge', 'featured', 'saleStatus', 'vatDeductible', 'createdAt'],
      populate: {
        images: { fields: ['url', 'alternativeText', 'width', 'height'] },
        car_model: { fields: ['name', 'slug'], populate: { brand: { fields: ['name', 'slug'] } } },
        vehicle_type: { fields: ['name', 'slug', 'shortName'] },
      },
    }),
    getFinance(),
  ]);

  const types: VehicleType[] = typesRaw.map((t: any) => ({
    name: t.name, slug: t.slug, shortName: t.shortName || t.name, silhouette: media(t.silhouette),
  }));
  const silhouetteBySlug = Object.fromEntries(types.map((t) => [t.slug, t.silhouette]));

  const cars: CarSummary[] = carsRaw
    .filter((c: any) => c.car_model?.brand)
    .map((c: any) => {
      const brand = { name: c.car_model.brand.name, slug: c.car_model.brand.slug };
      const model = { name: c.car_model.name, slug: c.car_model.slug };
      const type = c.vehicle_type ? { name: c.vehicle_type.name, slug: c.vehicle_type.slug } : null;
      const imgs = (c.images || []).map(media).filter(Boolean) as Media[];
      const car: CarSummary = {
        documentId: c.documentId,
        title: c.title,
        slug: c.slug,
        brand, model, type,
        variant: c.variant || '',
        price: c.price,
        year: c.year,
        mileage: c.mileage,
        fuel: c.fuel,
        transmission: c.transmission,
        badge: c.badge || (c.saleStatus === 'reserved' ? 'VARATTU' : ''),
        featured: !!c.featured,
        reserved: c.saleStatus === 'reserved',
        vatDeductible: !!c.vatDeductible,
        image: imgs[0] || null,
        placeholder: (type && silhouetteBySlug[type.slug]) || null,
        photoCount: imgs.length,
        monthly: Math.round(monthlyPayment(c.price, finance).monthly),
        href: '',
        createdAt: c.createdAt,
      };
      car.href = carHref(car);
      return car;
    });

  const brands: BrandNode[] = brandsRaw.map((b: any) => ({
    name: b.name, slug: b.slug, logo: media(b.logo),
    models: (b.car_models || []).map((m: any) => ({ name: m.name, slug: m.slug })),
  }));

  return { types, brands, cars };
});

/* ------------------------------------------------------------------ cars */

export const getCarBySlug = cache(async (slug: string): Promise<CarDetail | null> => {
  const res = await api('cars', {
    filters: { slug: { $eq: slug } },
    populate: {
      images: true, highlights: true, equipment: true, extraSpecs: true,
      car_model: { populate: { brand: true } },
      vehicle_type: { populate: { silhouette: true } },
    },
  });
  const c = res.data?.[0];
  if (!c || !c.car_model?.brand) return null;
  const finance = await getFinance();
  const car: CarDetail = {
    documentId: c.documentId,
    title: c.title,
    slug: c.slug,
    brand: { name: c.car_model.brand.name, slug: c.car_model.brand.slug },
    model: { name: c.car_model.name, slug: c.car_model.slug },
    type: c.vehicle_type ? { name: c.vehicle_type.name, slug: c.vehicle_type.slug } : null,
    variant: c.variant || '',
    price: c.price,
    year: c.year,
    mileage: c.mileage,
    fuel: c.fuel,
    transmission: c.transmission,
    drivetrain: c.drivetrain || '',
    powerKw: c.powerKw || null,
    color: c.color || '',
    inspectedUntil: c.inspectedUntil || '',
    co2: c.co2 || null,
    badge: c.badge || (c.saleStatus === 'reserved' ? 'VARATTU' : ''),
    featured: !!c.featured,
    reserved: c.saleStatus === 'reserved',
    sold: c.saleStatus === 'sold',
    vatDeductible: !!c.vatDeductible,
    images: (c.images || []).map(media).filter(Boolean),
    image: null,
    placeholder: media(c.vehicle_type?.silhouette),
    photoCount: (c.images || []).length,
    highlights: (c.highlights || []).map((h: any) => h.label),
    equipment: (c.equipment || []).map((h: any) => h.label),
    extraSpecs: c.extraSpecs || [],
    description: c.description || null,
    monthly: Math.round(monthlyPayment(c.price, finance).monthly),
    href: '',
    createdAt: c.createdAt,
  };
  car.image = car.images[0] || null;
  car.href = carHref(car);
  return car;
});

/* ------------------------------------------------------------------ pages */

const SECTION_POPULATE: Record<string, unknown> = {
  'sections.hero-showroom': { populate: { primaryCta: true, secondaryCta: true } },
  'sections.quick-search': true,
  'sections.statement': true,
  'sections.brand-ticker': true,
  'sections.vehicle-types-grid': true,
  'sections.latest-cars': true,
  'sections.process-road': { populate: { steps: true } },
  'sections.finance-teaser': true,
  'sections.services-list': { populate: { rows: true } },
  'sections.cta-banner': true,
  'sections.page-header': true,
  'sections.inventory-browser': true,
  'sections.services-detail': true,
  'sections.faq': { populate: { items: true } },
  'sections.about-hero': true,
  'sections.image-band': { populate: { image: true } },
  'sections.values-list': { populate: { items: true } },
  'sections.team': { populate: { members: { populate: { photo: true } } } },
  'sections.visit-cta': true,
  'sections.contact-hub': true,
  'sections.rich-text': true,
};

const blocksPopulate = { on: SECTION_POPULATE };

function normaliseBlocks(blocks: any[]): any[] {
  return (blocks || []).map((b) => {
    if (b.__component === 'sections.image-band') return { ...b, image: media(b.image) };
    if (b.__component === 'sections.team') {
      return { ...b, members: (b.members || []).map((m: any) => ({ ...m, photo: media(m.photo) })) };
    }
    return b;
  });
}

export const getPage = cache(async (slug: string): Promise<PageData | null> => {
  const res = await api('pages', {
    filters: { slug: { $eq: slug } },
    populate: { seo: { populate: { shareImage: true } }, blocks: blocksPopulate },
  });
  const p = res.data?.[0];
  if (!p) return null;
  return {
    title: p.title,
    slug: p.slug,
    seo: p.seo ? { ...p.seo, shareImage: media(p.seo.shareImage) } : null,
    blocks: normaliseBlocks(p.blocks),
  };
});

export const getPageSlugs = cache(async (): Promise<string[]> => {
  const all = await fetchAll('pages', { fields: ['slug'] });
  return all.map((p: any) => p.slug);
});

export const getServices = cache(async (): Promise<ServiceItem[]> => {
  const all = await fetchAll('services', { sort: ['order:asc'], populate: { facts: true } });
  return all.map((s: any) => ({
    title: s.title, slug: s.slug, summary: s.summary || '', body: s.body || '',
    facts: s.facts || [], special: s.special || 'none', ctaLabel: s.ctaLabel || '', ctaUrl: s.ctaUrl || '',
  }));
});

export const getCarTemplateBlocks = async () => normaliseBlocks((await getCarTemplate()).blocks);
