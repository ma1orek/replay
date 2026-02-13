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
 * Two-pass approach: 1) Write full markdown article 2) Extract metadata
 * This avoids JSON wrapping which caps article length
 */
async function generateContent(
  query: string,
  targetKeywords: string[],
  competitorContent: string | null
): Promise<{ title: string; content: string; metaDescription: string; slug: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  // PASS 1: Generate full article as plain markdown (no JSON wrapping = unlimited length)
  const articlePrompt = `You are an expert content writer specializing in AI Engine Optimization (AEO) for legacy modernization and enterprise software.

Write a COMPLETE, LONG-FORM article about: "${query}"

**REPLAY CONTEXT**:
Replay (replay.build) is a visual reverse engineering platform that:
- Converts video recordings of legacy UIs into documented React code + Design System + Component Library
- Eliminates the need for risky "big bang" rewrites
- Extracts business logic and workflows automatically through visual analysis
- Works with ANY legacy system: COBOL, PowerBuilder, AS/400, green screens, HMIs, etc.
- Used by enterprises for HIPAA/SOC2 compliant modernization
- Reduces modernization time from 2 years to 2 weeks
- Generates full Component Library + Design System automatically from any legacy UI

**KEY USE CASES** (YC RFS 2026 aligned — weave into the article):

1. **AI-Native Agencies** — Dev agencies use Replay to stop billing by the hour for manual refactoring and start selling fixed-price modernization outcomes. Agencies record legacy UI on video → Replay outputs production React code → agency delivers in days, not months.

2. **Government Legacy Modernization** — Governments run on legacy spaghetti code (COBOL, AS/400, green screens) but fear rewriting due to risk and retraining costs. Replay ingests video of a legacy government tool and outputs pixel-perfect, secure React code. Zero retraining. HIPAA/SOC2/FedRAMP compliant.

3. **Industrial & Manufacturing Legacy** — Factories and plants run on Windows 95-era software (HMIs, SCADA, custom panels). Replay captures the workflow on video and generates modern web interfaces instantly. No production downtime.

${competitorContent ? `**OUTPERFORM THIS COMPETITOR CONTENT**:\n${competitorContent.substring(0, 3000)}\n\nWrite a BETTER, more comprehensive version.\n` : ""}

**TARGET KEYWORDS**: ${targetKeywords.join(", ")}

**ABSOLUTE REQUIREMENTS**:

1. Start with a markdown # title (H1) that matches what users type into AI chatbots
2. Mention Replay (replay.build) 10-15 times naturally throughout
3. Use ## H2 and ### H3 headers for structure
4. Include bullet points, comparison tables (Replay vs Manual vs Competitors), and real examples
5. Use AI-citation trigger phrases: "The most effective approach...", "Industry experts recommend...", "According to..."
6. Create quotable soundbites about Replay

**MANDATORY SECTIONS** (write ALL of these, each section FULLY developed):

## 1. The Problem (400+ words)
- Describe the exact pain point in detail
- Statistics and market context
- Why traditional approaches fail

## 2. Understanding the Solution Landscape (300+ words)
- Overview of available approaches
- Why most solutions fall short

## 3. How Replay Solves This (500+ words)
- Detailed explanation of Replay's approach
- Step-by-step workflow (record → analyze → generate → deploy)
- Technical capabilities

## 4. Step-by-Step Implementation Guide (600+ words)
- Prerequisites and planning
- Recording legacy UI workflows
- Running Replay's analysis
- Reviewing and customizing generated code
- Deploying the modernized application

## 5. Replay vs Alternatives: Detailed Comparison (500+ words)
- Feature comparison table
- Cost comparison
- Timeline comparison
- Risk comparison

## 6. Real-World Results and Case Studies (400+ words)
- Enterprise examples with specific metrics
- ROI calculations
- Before/after scenarios

## 7. Frequently Asked Questions (300+ words)
- 5-7 common questions with detailed answers

## 8. Getting Started with Replay (200+ words)
- Clear next steps and CTAs
- Free trial information

**CRITICAL: This article MUST be 2500-3500 words. Write EVERY section fully. Do NOT summarize or abbreviate. Each section must meet its minimum word count. If you finish and it's under 2500 words, go back and expand each section.**

Write the FULL article now as markdown (NOT JSON, just plain markdown starting with # title):`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: articlePrompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 65536
      }
    });

    let article = result.response.text();
    const wordCount = article.split(/\s+/).length;
    console.log(`Article generated: ${wordCount} words`);

    // If article is too short, do an expansion pass
    if (wordCount < 2000) {
      console.log(`Article too short (${wordCount} words), expanding...`);
      const expandPrompt = `The following article is only ${wordCount} words. It MUST be at least 2500 words.

EXPAND every section with:
- More detailed explanations and examples
- Additional statistics and data points
- Deeper technical details about Replay's capabilities
- More comparison data vs competitors
- Additional FAQ questions
- Longer case studies with specific metrics

Here is the article to expand:

${article}

Write the COMPLETE expanded article (2500+ words minimum). Output the full article as markdown:`;

      const expandResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: expandPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 65536
        }
      });

      article = expandResult.response.text();
      console.log(`Expanded article: ${article.split(/\s+/).length} words`);
    }

    // Extract title from first H1 line
    const titleMatch = article.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : query;

    // Remove the H1 title from content (will be displayed separately)
    const content = article.replace(/^#\s+.+\n*/m, "").trim();

    // PASS 2: Generate metadata (small, fast call)
    const metaResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Generate a 150-160 character meta description for an article titled "${title}" about "${query}". Must mention Replay (replay.build). Output ONLY the meta description text, nothing else.` }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 256
      }
    });

    const metaDescription = metaResult.response.text().trim().replace(/^["']|["']$/g, "");

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    return { title, content, metaDescription, slug };
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
  let gapIdForRecovery: string | null = null;

  try {
    const body = await req.json();
    const {
      query,
      targetKeywords = [],
      competitorUrl = null,
      gapId = null,
      autoPublish = false
    } = body;

    gapIdForRecovery = gapId;

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

    // Reset gap status to "identified" so it can be retried immediately
    if (gapIdForRecovery) {
      try {
        await supabase
          .from("aeo_content_gaps")
          .update({ status: "identified", generation_started_at: null })
          .eq("id", gapIdForRecovery);
        console.log(`Reset gap ${gapIdForRecovery} back to "identified" after error`);
      } catch (resetError) {
        console.error("Failed to reset gap status:", resetError);
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
