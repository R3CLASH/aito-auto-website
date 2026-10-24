import type { Block, SiteContext } from '@/lib/types';
import { getServices } from '@/lib/strapi';
import * as S from './blocks/Sections';
import HeroShowroom, { type ShowroomTab } from './blocks/HeroShowroom';
import QuickSearch from './blocks/QuickSearch';
import Faq from './blocks/Faq';
import ServicesDetail from './blocks/ServicesDetail';
import ContactHub from './blocks/ContactHub';
import InventoryBrowser from './blocks/InventoryBrowser';

export type RouteFilter = { type: string; brand: string; model: string };

function showroomTabs(ctx: SiteContext): ShowroomTab[] {
  return ctx.catalog.types.map((t) => {
    const inType = ctx.catalog.cars.filter((c) => c.type?.slug === t.slug);
    return {
      slug: t.slug,
      label: t.shortName || t.name,
      count: inType.length,
      from: inType.length ? Math.min(...inType.map((c) => c.monthly)) : null,
      image: t.silhouette ? { url: t.silhouette.url, width: t.silhouette.width, height: t.silhouette.height } : null,
    };
  });
}

function quickSearchData(ctx: SiteContext) {
  return {
    types: ctx.catalog.types,
    brands: ctx.catalog.brands,
    cars: ctx.catalog.cars.map((c) => ({ brand: c.brand.slug, model: c.model.slug, type: c.type?.slug || '' })),
  };
}

/**
 * Maps every Strapi "sections.*" component in a page's dynamic zone to its React section.
 * Add a new component in Strapi → add one case here.
 */
export default async function BlockRenderer({ blocks, ctx, filter }: { blocks: Block[]; ctx: SiteContext; filter?: RouteFilter }) {
  const needsServices = blocks.some((b) => b.__component === 'sections.services-detail');
  const services = needsServices ? await getServices() : [];

  return (
    <>
      {blocks.map((block) => {
        const key = `${block.__component}-${block.id}`;
        const p = { block, ctx };
        switch (block.__component) {
          case 'sections.hero-showroom': return <HeroShowroom key={key} block={block} tabs={showroomTabs(ctx)} />;
          case 'sections.quick-search': return <QuickSearch key={key} block={block} data={quickSearchData(ctx)} />;
          case 'sections.statement': return <S.Statement key={key} {...p} />;
          case 'sections.brand-ticker': return <S.BrandTicker key={key} {...p} />;
          case 'sections.vehicle-types-grid': return <S.VehicleTypesGrid key={key} {...p} />;
          case 'sections.latest-cars': return <S.LatestCars key={key} {...p} />;
          case 'sections.process-road': return <S.ProcessRoad key={key} {...p} />;
          case 'sections.finance-teaser': return <S.FinanceTeaser key={key} {...p} />;
          case 'sections.services-list': return <S.ServicesList key={key} {...p} />;
          case 'sections.cta-banner': return <S.CtaBanner key={key} {...p} />;
          case 'sections.page-header': return <S.PageHeader key={key} {...p} />;
          case 'sections.rich-text': return <S.RichTextSection key={key} {...p} />;
          case 'sections.about-hero': return <S.AboutHero key={key} {...p} />;
          case 'sections.image-band': return <S.ImageBand key={key} {...p} />;
          case 'sections.values-list': return <S.ValuesList key={key} {...p} />;
          case 'sections.team': return <S.Team key={key} {...p} />;
          case 'sections.visit-cta': return <S.VisitCta key={key} {...p} />;
          case 'sections.faq': return <Faq key={key} block={block} />;
          case 'sections.services-detail': return <ServicesDetail key={key} block={block} services={services} />;
          case 'sections.contact-hub': return <ContactHub key={key} {...p} />;
          case 'sections.inventory-browser':
            return <InventoryBrowser key={key} block={block} catalog={ctx.catalog} initial={filter || { type: '', brand: '', model: '' }} />;
          default:
            if (process.env.NODE_ENV !== 'production') {
              return <div key={key} className="wrap" style={{ padding: 24, color: '#b42318' }}>Unknown section: {block.__component}</div>;
            }
            return null;
        }
      })}
    </>
  );
}
