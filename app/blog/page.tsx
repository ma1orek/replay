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
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return <BlogList initialPosts={(posts as BlogPost[]) || []} />;
}
