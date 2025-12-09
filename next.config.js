const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Corriger l'avertissement sur les lockfiles multiples
  outputFileTracingRoot: require('path').join(__dirname),
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
        protocol: "http",
        hostname: "localhost",
        port: "3002",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "192.168.*.*", // IP locale pour développement réseau (pattern plus large)
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co", // Supabase Storage
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "etrameteinczkfuponai.supabase.co", // Hostname spécifique Supabase
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Désactiver l'optimisation pour les images locales si nécessaire
    unoptimized: false,
  },
  // Next.js 16 : serverActions reste dans experimental mais avec nouvelles options
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3002", "*.vercel.app"],
      bodySizeLimit: "2mb",
    },
  },
  typescript: {
    // ✅ Bug corrigé dans Next.js 16 : les types générés utilisent maintenant des chemins corrects
    ignoreBuildErrors: false,
  },
};

module.exports = withBundleAnalyzer(nextConfig);
