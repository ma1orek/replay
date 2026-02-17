import { createServerSupabaseClient } from "@/lib/supabase/server";
import BlogList, { BlogPost } from "./BlogList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Replay Blog - AI Engineering & UI Development Insights",
  description: "Deep dives into video-to-code technology, AI engineering, frontend development, and building the future of UI tools.",
  openGraph: {
    title: "Replay Blog - AI Engineering & UI Development Insights",
    description: "Deep dives into video-to-code technology, AI engineering, frontend development, and building the future of UI tools.",
    type: "website",
  },
};

// Force dynamic since we fetch fresh posts
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const supabase = await createServerSupabaseClient();
  // Fetch ALL published posts (Supabase default limit is 1000, so paginate)
  let allPosts: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data: batch } = await supabase
      .from("blog_posts")
      .select("id,title,slug,meta_description,target_keyword,tone,status,read_time_minutes,seo_score,created_at,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, from + batchSize - 1);
    if (!batch || batch.length === 0) break;
    allPosts = allPosts.concat(batch);
    if (batch.length < batchSize) break;
    from += batchSize;
  }
  const posts = allPosts;

  return <BlogList initialPosts={(posts as BlogPost[]) || []} />;
}
