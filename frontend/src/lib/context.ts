import 'server-only';
import type { Metadata } from 'next';
import { getCatalog, getFinance, getGlobal } from './strapi';
import type { PageData, SiteContext } from './types';

export async function getSiteContext(): Promise<SiteContext> {
  const [global, finance, catalog] = await Promise.all([getGlobal(), getFinance(), getCatalog()]);
  return { global, finance, catalog };
}

export async function pageMetadata(page: PageData | null, path: string, fallbackTitle?: string): Promise<Metadata> {
  const g = await getGlobal();
  const title = page?.seo?.metaTitle || (fallbackTitle ? `${fallbackTitle} – ${g.siteName}` : page ? `${page.title} – ${g.siteName}` : g.siteName);
  const description = page?.seo?.metaDescription || g.defaultSeo?.metaDescription || g.tagline;
  const image = page?.seo?.shareImage?.url || g.defaultSeo?.shareImage?.url || g.logo?.url;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: image ? [image] : [] },
  };
}
