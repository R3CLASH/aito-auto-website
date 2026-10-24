import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlockRenderer from '@/components/BlockRenderer';
import { getPage } from '@/lib/strapi';
import { getSiteContext, pageMetadata } from '@/lib/context';

const HOME_SLUG = 'etusivu';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage(HOME_SLUG), '/');
}

export default async function Home() {
  const [page, ctx] = await Promise.all([getPage(HOME_SLUG), getSiteContext()]);
  if (!page) notFound();
  return <BlockRenderer blocks={page.blocks} ctx={ctx} />;
}
