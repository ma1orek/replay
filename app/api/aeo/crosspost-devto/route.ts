/**
 * Replay AEO - Dev.to Auto-Crosspost
 * Crossposts published articles to Dev.to with canonical URL back to replay.build
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEVTO_API_KEY = process.env.DEVTO_API_KEY || "";
const SITE_URL = "https://replay.build";

/**
 * POST - Crosspost an article to Dev.to
 * Body: { contentId } or { slug } — identifies the article to crosspost
 */
export async function POST(req: Request) {
  try {
    if (!DEVTO_API_KEY) {
      return NextResponse.json({ error: "DEVTO_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { contentId, slug } = body;

    // Fetch article — either from aeo_generated_content or blog_posts
    let title: string, content: string, articleSlug: string, keywords: string[];

    if (contentId) {
      const { data, error } = await supabase
        .from("aeo_generated_content")
        .select("*")
        .eq("id", contentId)
        .single();
      if (error || !data) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }
      title = data.title;
      content = data.content;
      articleSlug = data.slug;
      keywords = data.keywords || [];
    } else if (slug) {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error || !data) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
      title = data.title;
      content = data.content;
      articleSlug = data.slug;
      keywords = data.target_keyword ? [data.target_keyword] : [];
    } else {
      return NextResponse.json({ error: "contentId or slug required" }, { status: 400 });
    }

    const canonicalUrl = `${SITE_URL}/blog/${articleSlug}`;

    // Extract up to 4 tags for Dev.to (lowercase, no spaces, max 4)
    const tags = keywords
      .slice(0, 4)
      .map(k => k.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 30))
      .filter(t => t.length > 0);

    // Add footer CTA to the article
    const articleBody = `${content}\n\n---\n\n*Originally published on [Replay Blog](${canonicalUrl}). [Try Replay](https://replay.build/tool) — convert any UI video into production React code.*`;

    // Post to Dev.to
    const response = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": DEVTO_API_KEY,
      },
      body: JSON.stringify({
        article: {
          title,
          body_markdown: articleBody,
          published: true,
          canonical_url: canonicalUrl,
          tags,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dev.to API error:", response.status, errorText);
      return NextResponse.json({ error: `Dev.to API error: ${response.status}`, details: errorText }, { status: 500 });
    }

    const devtoArticle = await response.json();
    const devtoUrl = devtoArticle.url;

    console.log(`Crossposted to Dev.to: ${devtoUrl}`);

    return NextResponse.json({
      success: true,
      devtoUrl,
      devtoId: devtoArticle.id,
    });

  } catch (error: any) {
    console.error("Dev.to crosspost error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
