import { NextResponse } from 'next/server';
import { bucketConfigured, signedGet } from '@/lib/bucket';

/**
 * Serves Strapi media from the bucket on our own origin.
 *
 * Media filenames carry a content hash, so a file at a given URL never
 * changes and can be cached hard, both in the browser and at Railway's edge.
 */
const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const CACHE = 'public, max-age=31536000, immutable';

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const key = path.join('/');

  // Falls back to Strapi when no bucket is configured, which keeps `npm run
  // dev` working against a plain local Strapi with no extra setup.
  const upstream = bucketConfigured
    ? await signedGet(key)
    : await fetch(`${STRAPI_URL}/uploads/${key}`, { cache: 'no-store' });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Not found' }, { status: upstream.status === 404 ? 404 : 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
      'cache-control': CACHE,
      ...(upstream.headers.get('content-length')
        ? { 'content-length': upstream.headers.get('content-length')! }
        : {}),
    },
  });
}
