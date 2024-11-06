/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-d3-tree'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      // Ajoutez d'autres patterns si nécessaire
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      //   pathname: '/images/**',
      // }
    ],
  },
};

module.exports = nextConfig;
