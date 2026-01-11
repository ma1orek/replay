import { createServerSupabaseClient } from "@/lib/supabase/server";
import BlogPostContent from "./BlogPostContent";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Force dynamic because we are fetching from DB
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_description, target_keyword")
    .eq("slug", params.slug)
    .single();

  if (!post) {
    return {
      title: "Article Not Found | Replay",
    };
  }

  return {
    title: `${post.title} | Replay Blog`,
    description: post.meta_description,
    keywords: post.target_keyword,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !post) {
    notFound();
  }

  return <BlogPostContent post={post} />;
}
