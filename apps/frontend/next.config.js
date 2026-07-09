/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile monorepo packages
  transpilePackages: ['@brunch/shared-types'],

  // Strict mode for better React debugging
  reactStrictMode: true,

  // API proxy to avoid CORS issues in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
