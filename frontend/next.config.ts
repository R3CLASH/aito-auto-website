import type { NextConfig } from 'next';

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');

// Extra hosts for media on an external provider (S3, Cloudinary…): comma-separated hostnames.
const extraHosts = (process.env.IMAGE_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    // Strapi local uploads are proxied through /uploads (see rewrites), so they are same-origin.
    localPatterns: [{ pathname: '/uploads/**' }],
    remotePatterns: extraHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
  async rewrites() {
    return [{ source: '/uploads/:path*', destination: `${STRAPI_URL}/uploads/:path*` }];
  },
};

export default nextConfig;
