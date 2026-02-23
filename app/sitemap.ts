import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Core pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://www.replay.build", lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: "https://www.replay.build/landing", lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://www.replay.build/pricing", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.replay.build/blog", lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: "https://www.replay.build/contact", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.replay.build/terms", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.replay.build/privacy", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // LLM-friendly documentation files
  const llmsPages: MetadataRoute.Sitemap = [
    { url: "https://www.replay.build/llms.txt", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.replay.build/llms-full.txt", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  // Learn / SEO content pages
  const learnPages: MetadataRoute.Sitemap = [
    { url: "https://www.replay.build/learn/behavior-driven-ui-reconstruction", lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://www.replay.build/learn/why-screenshots-fail-for-ui", lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://www.replay.build/rebuild/rebuild-ui-from-video", lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Documentation pages
  const docsPaths = [
    "docs",
    "docs/quickstart",
    "docs/changelog",
    "docs/faq",
    "docs/pricing",
    "docs/features/video-to-ui",
    "docs/features/library",
    "docs/features/blueprints",
    "docs/features/code-view",
    "docs/features/design-system",
    "docs/features/edit-with-ai",
    "docs/features/flow-map",
    "docs/features/publish",
    "docs/guides/first-project",
    "docs/guides/style-injection",
    "docs/guides/database-integration",
    "docs/integrations/supabase",
    "docs/integrations/project-settings",
    "docs/api",
  ];
  const docsPages: MetadataRoute.Sitemap = docsPaths.map((path) => ({
    url: `https://www.replay.build/${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "docs" ? 0.7 : 0.5,
  }));

  // Fetch ALL published blog posts (paginate past Supabase 1000 row limit)
  let allPosts: any[] = [];
  let blogFrom = 0;
  const batchSize = 1000;
  while (true) {
    const { data: batch } = await supabase
      .from("blog_posts")
      .select("slug, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(blogFrom, blogFrom + batchSize - 1);
    if (!batch || batch.length === 0) break;
    allPosts = allPosts.concat(batch);
    if (batch.length < batchSize) break;
    blogFrom += batchSize;
  }

  const blogPages: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `https://www.replay.build/blog/${post.slug}`,
    lastModified: new Date(post.published_at || post.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Fetch published user projects
  let allProjects: any[] = [];
  let projFrom = 0;
  while (true) {
    const { data: batch } = await supabase
      .from("published_projects")
      .select("slug, updated_at, created_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .range(projFrom, projFrom + batchSize - 1);
    if (!batch || batch.length === 0) break;
    allProjects = allProjects.concat(batch);
    if (batch.length < batchSize) break;
    projFrom += batchSize;
  }

  const publishedPages: MetadataRoute.Sitemap = allProjects.map((proj) => ({
    url: `https://www.replay.build/p/${proj.slug}`,
    lastModified: new Date(proj.updated_at || proj.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...llmsPages, ...learnPages, ...docsPages, ...blogPages, ...publishedPages];
}
