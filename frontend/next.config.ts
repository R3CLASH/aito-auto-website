import type { NextConfig } from 'next';

// Extra hosts for media on an external upload provider: comma-separated hostnames.
const extraHosts = (process.env.IMAGE_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Media is served by app/uploads/[...path], so it is same-origin.
    localPatterns: [{ pathname: '/uploads/**' }],
    remotePatterns: extraHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
};

export default nextConfig;
