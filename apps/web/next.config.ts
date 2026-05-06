import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const API_URL = process.env.API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_URL}/api/v1/:path*`,
      },
      {
        source: '/docs',
        destination: `${API_URL}/swagger-docs`,
      },
      {
        source: '/openapi.json',
        destination: `${API_URL}/openapi.json`,
      },
    ];
  },
};

export default nextConfig;
