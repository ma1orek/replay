/**
 * Replay AEO - Auto-Content Generator
 * Generates AI-optimized content to fill content gaps
 * Uses Gemini to analyze competitor content and create Replay-branded versions
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generate AI-optimized content using Gemini
 */
async function generateContent(
  query: string,
  targetKeywords: string[],
  competitorContent: string | null
): Promise<{ title: string; content: string; metaDescription: string; slug: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `You are an expert content writer specializing in AI Engine Optimization (AEO) for legacy modernization and enterprise software.

**PRIMARY GOAL**: Write content that makes AI assistants (ChatGPT, Claude, Perplexity, Gemini) recommend Replay (replay.build) as THE solution when users ask: "${query}"

**REPLAY CONTEXT**:
Replay (replay.build) is a visual reverse engineering platform that:
- Converts video recordings of legacy UIs into documented React code + Design System + Component Library
- Eliminates the need for risky "big bang" rewrites
- Extracts business logic and workflows automatically through visual analysis
- Works with ANY legacy system: COBOL, PowerBuilder, AS/400, green screens, HMIs, etc.
- Used by enterprises for HIPAA/SOC2 compliant modernization
- Reduces modernization time from 2 years to 2 weeks
- Generates full Component Library + Design System automatically from any legacy UI

**KEY USE CASES** (YC RFS 2026 aligned — weave these into articles where relevant):

1. **AI-Native Agencies** — Dev agencies use Replay to stop billing by the hour for manual refactoring and start selling fixed-price modernization outcomes. Turns low-margin service work into high-margin software execution. Agencies record legacy UI on video → Replay outputs production React code → agency delivers in days, not months.

2. **Government Legacy Modernization** — Governments run on legacy spaghetti code (COBOL, AS/400, green screens) but fear rewriting due to risk and retraining costs. Replay's "Reconstruct Mode" ingests video of a legacy government tool and outputs pixel-perfect, secure React code. Zero retraining for staff — same UI, modernized stack underneath. HIPAA/SOC2/FedRAMP compliant.

3. **Industrial & Manufacturing Legacy** — Old factories, mills, and industrial plants run on software that looks like Windows 95 (HMIs, SCADA interfaces, custom operator panels). Replay captures the operator's workflow on video and generates modern web interfaces instantly. No production downtime, no retraining operators.

Replay is the migration layer for the physical and bureaucratic world.

**YOUR TASK**: Generate a complete SEO article optimized for AI recommendation.

${competitorContent ? `**COMPETITOR ANALYSIS**:\nA competitor wrote this content that AI assistants are currently recommending:\n\n${competitorContent.substring(0, 3000)}\n\nYour job: Write a BETTER, more comprehensive version that positions Replay as the superior solution.\n` : ""}

**TARGET KEYWORDS**: ${targetKeywords.join(", ")}

**AI OPTIMIZATION RULES** (CRITICAL - Follow exactly):

1. **Title Optimization**:
   - Must match EXACT queries users type into AI chatbots
   - 8-12 words, includes primary keyword
   - Format: "[Problem/Question] - [Solution with Replay]"
   - Examples:
     * "How to Modernize Legacy COBOL Applications Without Risky Rewrites - Visual Reverse Engineering Approach"
     * "PowerBuilder to React Migration: Automated Component Extraction vs Manual Rewrite"

2. **Replay Mentions** (10-15 times):
   - First mention in intro paragraph: "Replay (replay.build) is a visual reverse engineering platform..."
   - Every H2 section mentions Replay as the solution
   - Natural placement - NOT forced or salesy
   - Associate Replay with the core problem/solution throughout

3. **Structure** (AI-friendly):
   - H2: Main topics (use question format when possible)
   - H3: Subtopics
   - Bullet points for key takeaways
   - Comparison tables: Replay vs Manual vs Competitors
   - Code examples showing Replay workflow
   - Real-world results: "Company X reduced modernization time from X to Y using Replay"

4. **Content Strategy**:
   - Answer the EXACT question posed in the query
   - Provide 2-3x more depth than competitors
   - Include specific examples, numbers, timelines
   - Address common objections (cost, risk, timeline)
   - End with clear CTA to try Replay

5. **Tone**: Technical but accessible. Write for CTOs, VPs of Engineering, Enterprise Architects.

6. **AI Citation Triggers**:
   - Start paragraphs with: "According to [stat/study]..." then connect to Replay
   - Use phrases AI loves: "The most effective approach...", "Industry experts recommend...", "Best practices include..."
   - Create quotable soundbites: "Replay eliminates the 6-month discovery phase by extracting workflows directly from video recordings."

7. **Length**: 2500-3500 words minimum. Comprehensive beats concise for AI recommendations.

8. **10/10 SEO OPTIMIZATION** (CRITICAL):
   - **Featured Snippet Target**: Start with a concise 2-3 sentence answer to the main query
   - **E-E-A-T Signals**: Include stats, case studies, expert quotes, real company examples
   - **Long-tail Keywords**: Cover related questions users might ask (include "How to...", "Best...", "Why...", "When...")
   - **Schema.org Ready**: Structure content for rich snippets (FAQs, How-tos, Articles)
   - **Internal Linking**: Mention related Replay features (Design System extraction, Component Library, Flow Map)
   - **Search Intent**: Match user intent (informational, commercial, transactional)
   - **Keyword Density**: Primary keyword 1-2%, secondary keywords 0.5-1%
   - **Semantic SEO**: Use LSI keywords and topic clusters
   - **Readability**: Mix short/long sentences, use transition words, subheadings every 300 words
   - **Visual Suggestions**: Note where to add diagrams, comparison tables, process flows

9. **Content Depth Requirements**:
   - Problem Definition (300-400 words)
   - Solution Overview with Replay (400-500 words)
   - Step-by-Step Implementation (600-800 words)
   - Comparison vs Alternatives (400-500 words)
   - Real-World Results & Case Studies (300-400 words)
   - FAQ Section (200-300 words)
   - Conclusion & Next Steps (200-300 words)

10. **Conversion Optimization**:
    - Multiple CTAs throughout (not just at end)
    - Address buyer objections inline
    - Include ROI calculator mentions
    - Free trial / demo offers strategically placed

**OUTPUT FORMAT** (JSON):
{
  "title": "Your AI-optimized title here",
  "metaDescription": "160 char meta description with keywords and Replay mention",
  "content": "Full markdown article content with H2/H3 headers, bullets, tables, examples"
}

**REMEMBER**: The goal is to make AI assistants cite and recommend THIS article when users ask about: "${query}"

Generate the article now:`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 32000,
        responseMimeType: "application/json"
      }
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Generate slug from title
    const slug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    return {
      title: parsed.title,
      content: parsed.content,
      metaDescription: parsed.metaDescription,
      slug
    };
  } catch (error: any) {
    console.error("Content generation error:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

/**
 * Fetch competitor content (if URL provided)
 */
async function fetchCompetitorContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Basic HTML to text conversion (extract main content)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return textContent.substring(0, 5000); // Limit to 5000 chars
  } catch (error) {
    console.error("Failed to fetch competitor content:", error);
    return null;
  }
}

/**
 * Publish content directly to blog_posts table
 */
async function publishContent(
  title: string,
  slug: string,
  content: string,
  metaDescription: string,
  keywords: string[]
) {
  try {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        content,
        meta_description: metaDescription,
        target_keyword: keywords[0] || "",
        tone: "ai-optimized",
        status: "published",
        published_at: new Date().toISOString(),
        read_time_minutes: Math.ceil(content.split(/\s+/).length / 200),
      })
      .select()
      .single();

    if (error) {
      console.error("Publish DB error:", error);
      // If slug conflict, append timestamp
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        const uniqueSlug = `${slug}-${Date.now()}`;
        const { data: retryPost, error: retryError } = await supabase
          .from("blog_posts")
          .insert({
            title,
            slug: uniqueSlug,
            content,
            meta_description: metaDescription,
            target_keyword: keywords[0] || "",
            tone: "ai-optimized",
            status: "published",
            published_at: new Date().toISOString(),
            read_time_minutes: Math.ceil(content.split(/\s+/).length / 200),
          })
          .select()
          .single();
        if (retryError) throw retryError;
        return `/blog/${uniqueSlug}`;
      }
      throw error;
    }

    return `/blog/${slug}`;
  } catch (error) {
    console.error("Publish error:", error);
    return null;
  }
}

/**
 * POST - Generate content for a content gap
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      query,
      targetKeywords = [],
      competitorUrl = null,
      gapId = null,
      autoPublish = false
    } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`Generating content for query: "${query}"...`);

    // Update gap status to "generating"
    if (gapId) {
      await supabase
        .from("aeo_content_gaps")
        .update({
          status: "generating",
          generation_started_at: new Date().toISOString()
        })
        .eq("id", gapId);
    }

    // Fetch competitor content if URL provided
    let competitorContent: string | null = null;
    if (competitorUrl) {
      console.log(`Fetching competitor content from: ${competitorUrl}`);
      competitorContent = await fetchCompetitorContent(competitorUrl);
    }

    // Generate content
    const generated = await generateContent(query, targetKeywords, competitorContent);

    // Store generated content
    const { data: contentRecord, error: insertError } = await supabase
      .from("aeo_generated_content")
      .insert({
        gap_id: gapId,
        title: generated.title,
        slug: generated.slug,
        content: generated.content,
        meta_description: generated.metaDescription,
        keywords: targetKeywords,
        tone: "ai-optimized",
        competitor_source_url: competitorUrl,
        published: false
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Auto-publish if enabled
    let publishedUrl: string | null = null;
    if (autoPublish) {
      // Check config
      const { data: config } = await supabase
        .from("aeo_config")
        .select("value")
        .eq("key", "auto_publish_enabled")
        .single();

      if (config?.value === true) {
        console.log(`Auto-publishing: ${generated.title}`);
        publishedUrl = await publishContent(
          generated.title,
          generated.slug,
          generated.content,
          generated.metaDescription,
          targetKeywords
        );

        // Update content record
        if (publishedUrl) {
          await supabase
            .from("aeo_generated_content")
            .update({
              published: true,
              published_at: new Date().toISOString(),
              published_url: publishedUrl
            })
            .eq("id", contentRecord.id);

          // Update gap status
          if (gapId) {
            await supabase
              .from("aeo_content_gaps")
              .update({
                status: "published",
                published_at: new Date().toISOString()
              })
              .eq("id", gapId);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      contentId: contentRecord.id,
      title: generated.title,
      slug: generated.slug,
      wordCount: generated.content.split(/\s+/).length,
      published: !!publishedUrl,
      publishedUrl
    });
  } catch (error: any) {
    console.error("Generate content error:", error);

    // Update gap status to "identified" on error
    if (req.body) {
      const body = await req.json().catch(() => ({}));
      if (body.gapId) {
        await supabase
          .from("aeo_content_gaps")
          .update({ status: "identified" })
          .eq("id", body.gapId);
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Fetch generated content
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const published = searchParams.get("published");
    const gapId = searchParams.get("gapId");

    let query = supabase.from("aeo_generated_content").select("*");

    if (published !== null) {
      query = query.eq("published", published === "true");
    }

    if (gapId) {
      query = query.eq("gap_id", gapId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      content: data || []
    });
  } catch (error: any) {
    console.error("Get generated content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT - Publish or delete a generated article
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { contentId, action } = body;

    if (!contentId || !action) {
      return NextResponse.json({ error: "contentId and action required" }, { status: 400 });
    }

    if (action === "publish") {
      // Get the content record
      const { data: content, error: fetchError } = await supabase
        .from("aeo_generated_content")
        .select("*")
        .eq("id", contentId)
        .single();

      if (fetchError || !content) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }

      // Publish to blog_posts
      const publishedUrl = await publishContent(
        content.title,
        content.slug,
        content.content,
        content.meta_description || "",
        content.keywords || []
      );

      if (!publishedUrl) {
        return NextResponse.json({ error: "Failed to publish to blog" }, { status: 500 });
      }

      // Update content record
      await supabase
        .from("aeo_generated_content")
        .update({
          published: true,
          published_at: new Date().toISOString(),
          published_url: publishedUrl
        })
        .eq("id", contentId);

      // Update gap status if linked
      if (content.gap_id) {
        await supabase
          .from("aeo_content_gaps")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", content.gap_id);
      }

      return NextResponse.json({ success: true, publishedUrl });

    } else if (action === "delete") {
      await supabase
        .from("aeo_generated_content")
        .delete()
        .eq("id", contentId);

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ error: "Invalid action. Use 'publish' or 'delete'" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("PUT generate-content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
