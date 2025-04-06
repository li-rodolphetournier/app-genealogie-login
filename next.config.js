/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-d3-tree"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
        pathname: "/uploads/**",
      },
    ],
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
    TEMP_DIR: process.env.NODE_ENV === "production" ? "/tmp" : "./tmp",
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
