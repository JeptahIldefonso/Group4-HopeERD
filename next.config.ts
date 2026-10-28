import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
      {
        source: '/reports',
        destination: '/',
        permanent: false,
      },
      {
        source: '/reports/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
