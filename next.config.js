/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-d3-tree'],
  images: {
    domains: ['localhost', 'genealogie-2yn6zw9tc-li-rodolphetourniers-projects.vercel.app'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        pathname: '/uploads/**',
      }
    ],
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
    TEMP_DIR: process.env.NODE_ENV === 'production' ? '/tmp' : './tmp'
  },
  experimental: {
    serverActions: true,
  }
};

module.exports = nextConfig;
