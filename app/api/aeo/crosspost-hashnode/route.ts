/**
 * Replay AEO - Hashnode Auto-Crosspost
 * Crossposts published articles to Hashnode with canonical URL back to replay.build
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const HASHNODE_API_KEY = process.env.HASHNODE_API_KEY || "";
const HASHNODE_PUBLICATION_ID = process.env.HASHNODE_PUBLICATION_ID || "";
const SITE_URL = "https://replay.build";

/**
 * POST - Crosspost an article to Hashnode
 * Body: { contentId } or { slug }
 */
export async function POST(req: Request) {
  try {
    if (!HASHNODE_API_KEY || !HASHNODE_PUBLICATION_ID) {
      return NextResponse.json({ error: "HASHNODE_API_KEY or HASHNODE_PUBLICATION_ID not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { contentId, slug } = body;

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

    // Add footer CTA
    const articleBody = `${content}\n\n---\n\n*Originally published on [Replay Blog](${canonicalUrl}). [Try Replay](https://replay.build/tool) — convert any UI video into production React code.*`;

    // Extract tags for Hashnode
    const tags = keywords.slice(0, 5).map(k => ({
      slug: k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: k,
    }));

    // Hashnode GraphQL API
    const mutation = `
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post {
            id
            url
            slug
          }
        }
      }
    `;

    const response = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": HASHNODE_API_KEY,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            title,
            contentMarkdown: articleBody,
            publicationId: HASHNODE_PUBLICATION_ID,
            tags,
            originalArticleURL: canonicalUrl,
            disableComments: false,
          },
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("Hashnode API errors:", result.errors);
      return NextResponse.json({ error: "Hashnode API error", details: result.errors }, { status: 500 });
    }

    const hashnodeUrl = result.data?.publishPost?.post?.url;
    console.log(`Crossposted to Hashnode: ${hashnodeUrl}`);

    return NextResponse.json({
      success: true,
      hashnodeUrl,
      hashnodeId: result.data?.publishPost?.post?.id,
    });

  } catch (error: any) {
    console.error("Hashnode crosspost error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
