/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Force no-cache on published pages
  async headers() {
    return [
      {
        source: "/p/:slug",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
