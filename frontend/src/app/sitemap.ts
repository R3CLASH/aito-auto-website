import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { getCatalog, getPageSlugs } from '@/lib/strapi';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [catalog, slugs] = await Promise.all([getCatalog(), getPageSlugs()]);
  const urls: MetadataRoute.Sitemap = [{ url: SITE_URL, changeFrequency: 'daily', priority: 1 }];
  for (const s of slugs) if (s !== 'etusivu') urls.push({ url: `${SITE_URL}/${s}`, changeFrequency: s === 'autot' ? 'daily' : 'monthly' });
  for (const b of catalog.brands) {
    if (!catalog.cars.some((c) => c.brand.slug === b.slug)) continue;
    urls.push({ url: `${SITE_URL}/autot/${b.slug}`, changeFrequency: 'daily' });
    for (const m of b.models) {
      if (catalog.cars.some((c) => c.model.slug === m.slug && c.brand.slug === b.slug)) urls.push({ url: `${SITE_URL}/autot/${b.slug}/${m.slug}`, changeFrequency: 'daily' });
    }
  }
  for (const c of catalog.cars) urls.push({ url: `${SITE_URL}${c.href}`, lastModified: c.createdAt, changeFrequency: 'weekly', priority: 0.8 });
  return urls;
}
