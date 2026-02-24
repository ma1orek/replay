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
  // Cache headers per route
  async headers() {
    return [
      {
        // Published user pages — never cache (always fresh after Update)
        source: "/p/:slug",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        // Blog posts — cache 1h at edge, revalidate in background for 24h
        source: "/blog/:slug",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        // Blog list — cache 10min at edge
        source: "/blog",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=600, stale-while-revalidate=3600" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
