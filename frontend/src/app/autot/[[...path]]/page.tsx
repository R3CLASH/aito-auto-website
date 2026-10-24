import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import BlockRenderer from '@/components/BlockRenderer';
import CarDetailView from '@/components/car/CarDetailView';
import { getCarBySlug, getCarTemplate, getCarTemplateBlocks, getCatalog, getPage } from '@/lib/strapi';
import { getSiteContext, pageMetadata } from '@/lib/context';
import { euro, km } from '@/lib/format';

/**
 * /autot                              → all cars
 * /autot/[brand]                      → main category (brand)
 * /autot/[brand]/[model]              → sub category (model)
 * /autot/[brand]/[model]/[car-slug]   → single vehicle
 * ?tyyppi=[vehicle-type-slug]         → vehicle type filter
 */
type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ tyyppi?: string }>;
};

const LISTING_SLUG = 'autot';

async function resolve(path: string[] = []) {
  const catalog = await getCatalog();
  const [brandSlug, modelSlug, carSlug] = path.map((s) => decodeURIComponent(s));
  if (path.length > 3) return { kind: 'missing' as const };
  const brand = brandSlug ? catalog.brands.find((b) => b.slug === brandSlug) : undefined;
  if (brandSlug && !brand) return { kind: 'missing' as const };
  const model = modelSlug ? brand?.models.find((m) => m.slug === modelSlug) : undefined;
  if (modelSlug && !model) return { kind: 'missing' as const };
  if (carSlug) {
    const car = await getCarBySlug(carSlug);
    if (!car) return { kind: 'missing' as const };
    return { kind: 'car' as const, car, brand: brand!, model: model! };
  }
  return { kind: 'list' as const, brand, model, catalog };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { path } = await params;
  const { tyyppi } = await searchParams;
  const r = await resolve(path);
  if (r.kind === 'missing') return { title: 'Sivua ei löytynyt' };
  if (r.kind === 'car') {
    const c = r.car;
    const meta = await pageMetadata(null, c.href, `${c.title} ${c.year}`);
    return {
      ...meta,
      description: `${c.title}, ${c.year}, ${km(c.mileage)}, ${c.fuel}, ${c.transmission}. Hinta ${euro(c.price)}, kuukausierä alk. ${c.monthly} €/kk.`,
      openGraph: { ...meta.openGraph, images: c.image ? [c.image.url] : c.placeholder ? [c.placeholder.url] : [] },
    };
  }
  const page = await getPage(LISTING_SLUG);
  const base = `/autot${r.brand ? `/${r.brand.slug}` : ''}${r.model ? `/${r.model.slug}` : ''}`;
  if (r.brand) {
    const label = r.model ? `${r.brand.name} ${r.model.name}` : r.brand.name;
    return pageMetadata(null, base, `${label} – vaihtoautot myynnissä`);
  }
  const type = tyyppi ? r.catalog.types.find((t) => t.slug === tyyppi) : undefined;
  return pageMetadata(page, base, type ? `${type.name} – vaihtoautot` : undefined);
}

export default async function AutotPage({ params, searchParams }: Props) {
  const { path } = await params;
  const { tyyppi } = await searchParams;
  const r = await resolve(path);
  if (r.kind === 'missing') notFound();

  const ctx = await getSiteContext();

  if (r.kind === 'car') {
    // Keep one canonical URL per car even if brand/model in the address are wrong.
    if (r.car.brand.slug !== r.brand.slug || r.car.model.slug !== r.model.slug) permanentRedirect(r.car.href);
    const [tpl, blocks] = await Promise.all([getCarTemplate(), getCarTemplateBlocks()]);
    return <CarDetailView car={r.car} tpl={tpl} ctx={ctx} templateBlocks={blocks} />;
  }

  const page = await getPage(LISTING_SLUG);
  const type = tyyppi && ctx.catalog.types.some((t) => t.slug === tyyppi) ? tyyppi : '';
  const filter = { type, brand: r.brand?.slug || '', model: r.model?.slug || '' };
  const blocks = page?.blocks?.length
    ? page.blocks
    : [{ __component: 'sections.inventory-browser', id: 0 }];
  // Make sure the listing always has the browser even if an editor removed it.
  const hasBrowser = blocks.some((b) => b.__component === 'sections.inventory-browser');
  return <BlockRenderer blocks={hasBrowser ? blocks : [{ __component: 'sections.inventory-browser', id: 0 }, ...blocks]} ctx={ctx} filter={filter} />;
}
