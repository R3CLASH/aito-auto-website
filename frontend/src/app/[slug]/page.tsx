import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import BlockRenderer from '@/components/BlockRenderer';
import { getPage } from '@/lib/strapi';
import { getSiteContext, pageMetadata } from '@/lib/context';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return pageMetadata(await getPage(slug), `/${slug}`);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (slug === 'etusivu') permanentRedirect('/');
  const [page, ctx] = await Promise.all([getPage(slug), getSiteContext()]);
  if (!page) notFound();
  return <BlockRenderer blocks={page.blocks} ctx={ctx} />;
}
