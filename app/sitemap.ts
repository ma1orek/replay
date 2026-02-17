import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://replay.build", lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: "https://replay.build/tool", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://replay.build/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://replay.build/docs", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: "https://replay.build/blog", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const blogPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `https://replay.build/blog/${post.slug}`,
    lastModified: new Date(post.published_at || post.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
