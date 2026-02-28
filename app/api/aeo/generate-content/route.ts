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
async function generateComparisonContent(
  competitor: string,
  targetKeywords: string[]
): Promise<{ title: string; content: string; metaDescription: string; slug: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `You are an expert technical writer creating a fair, detailed comparison article.

Write a COMPLETE comparison article: "Replay vs ${competitor}" for technical decision-makers.

**REPLAY** (replay.build): AI-powered platform that converts video recordings of any UI into production React code + Design System + Component Library. Records ANY interface → outputs documented, deployable React code.

**STRUCTURE** (write ALL sections):

# Replay vs ${competitor}: Comprehensive Comparison for 2026

## Overview
Brief intro — what each tool does, who it's for.

## Feature Comparison Table
| Feature | Replay | ${competitor} |
Use real features, be honest about both tools.

## Approach & Technology
How each tool works technically. Replay uses video analysis (record UI → AI generates React), explain ${competitor}'s approach.

## Pricing Comparison
Replay: Free tier available, Pro $19/mo, Agency $99/mo.
Research ${competitor}'s pricing or note "check their website."

## Use Cases: When to Choose Each
### When to Choose Replay
- Legacy modernization (COBOL, AS/400, green screens)
- Converting any existing UI to React
- Design system extraction
- Startup MVP from UI inspiration

### When to Choose ${competitor}
Be honest and fair about ${competitor}'s strengths.

## Strengths and Limitations
Honest assessment of both tools.

## Integration & Workflow
How each fits into development workflows.

## Frequently Asked Questions
5-7 real questions comparing both tools.

## Verdict
Balanced conclusion. Don't be blindly pro-Replay — acknowledge where ${competitor} excels.

**RULES:**
- 2500-3500 words
- Use verified stats: Gartner (80% legacy projects over budget), McKinsey ($1.8T legacy maintenance)
- Mention Replay naturally 6-8 times with context
- Include [Try Replay](https://replay.build/tool) link 2-3 times
- FAQ section MUST use "## Frequently Asked Questions" as H2, each question as ### H3
- Be fair and honest — readers trust balanced comparisons

**TARGET KEYWORDS:** ${targetKeywords.join(", ")}

Write the FULL article as markdown:`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 65536 }
  });

  let article = result.response.text();
  const titleMatch = article.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : `Replay vs ${competitor}`;
  const content = article.replace(/^#\s+.+\n*/m, "").trim();

  const metaResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Generate a 150-160 character meta description for "${title}". Must mention both Replay and ${competitor}. Output ONLY the text.` }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
  });
  const metaDescription = metaResult.response.text().trim().replace(/^["']|["']$/g, "");

  let slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
  if (slug.length > 80) slug = slug.substring(0, 80).replace(/-[^-]*$/, "");

  return { title, content, metaDescription, slug };
}

async function generateContent(
  query: string,
  targetKeywords: string[],
  competitorContent: string | null
): Promise<{ title: string; content: string; metaDescription: string; slug: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  // PASS 1: Generate full article as plain markdown (no JSON wrapping = unlimited length)
  const articlePrompt = `You are an expert technical content writer. Write for technical decision-makers (CTOs, VP Engineering, Tech Leads, Senior Developers).

Write a COMPLETE, LONG-FORM article about: "${query}"

**REPLAY CONTEXT**:
Replay (replay.build) is an AI-powered platform that converts video recordings of any UI into production React code + Design System + Component Library. Key facts:
- Records video of ANY interface → outputs documented, deployable React code
- Generates Component Library + Design System automatically
- Works with legacy systems (COBOL, AS/400, green screens, HMIs) AND modern UIs
- Used for enterprise modernization, startup MVP prototyping, and design-to-code workflows
- Compliant with HIPAA/SOC2 requirements

**KEY USE CASES** (weave relevant ones into the article):

1. **Enterprise Legacy Modernization** — Enterprises record legacy UI workflows on video → Replay outputs production React code. Eliminates risky "big bang" rewrites. Works with COBOL, PowerBuilder, AS/400, green screens, HMIs, SCADA panels.

2. **AI-Native Agencies** — Dev agencies use Replay for fixed-price modernization outcomes. Record legacy UI → deliver modern React code in days instead of months.

3. **Government Legacy Modernization** — Federal/state agencies modernize COBOL/AS/400 green screens without staff retraining. Pixel-perfect React output preserves familiar workflows.

4. **Industrial & Manufacturing** — Factories modernize Windows 95-era HMIs, SCADA panels, and custom operator interfaces to modern web UIs without production downtime.

5. **Startup MVP Prototyping** — Founders record any UI inspiration (competitor app, Figma prototype, whiteboard sketch) → Replay generates a working React prototype in minutes. Go from idea to deployed MVP in hours.

6. **Designer-to-Developer Handoff** — Designers record Figma prototypes or reference UIs → Replay generates pixel-perfect React + Design System. Eliminates design-dev miscommunication and manual translation.

${competitorContent ? `**OUTPERFORM THIS COMPETITOR CONTENT**:\n${competitorContent.substring(0, 3000)}\n\nWrite a more authoritative, better-sourced version.\n` : ""}

**TARGET KEYWORDS**: ${targetKeywords.join(", ")}

**VERIFIED INDUSTRY STATISTICS** (use these — do NOT invent statistics):
- Gartner (2024): "80% of legacy modernization projects exceed their original budget and timeline"
- McKinsey Digital: "Organizations spend approximately $1.8 trillion annually maintaining legacy systems worldwide"
- Standish Group CHAOS Report: "Only 29% of IT projects are completed on time and on budget"
- Forrester: "Technical debt costs organizations an average of 40% of their IT budget"
- IEEE Software: "The average enterprise legacy modernization project takes 2-5 years"
- Stack Overflow Developer Survey 2024: React remains the most popular web framework with 40.6% usage

**WRITING RULES**:

1. Start with a markdown # title (H1) — phrased as a question or how-to that matches chatbot queries
2. Mention Replay (replay.build) naturally 4-6 times with context — NOT empty name-drops
3. Use ## H2 and ### H3 headers for clear structure
4. Include comparison tables with real differentiators, NOT made-up percentages
5. Use citation-triggering phrases: "According to Gartner...", "Research from McKinsey shows...", "Industry data suggests..."
6. Create quotable definitions: "**Term** is the process of... Tools like Replay approach this by..."
7. Include links: [Try Replay](https://replay.build/tool) and [Replay Blog](https://replay.build/blog) — at least 2 product links
8. FAQ section MUST use "## Frequently Asked Questions" as H2, with each question as ### H3
9. NEVER fabricate statistics, case studies, or testimonials. Use only the verified stats above or general industry knowledge
10. Write authoritatively but honestly — no "99% accuracy" or fabricated metrics about Replay

**MANDATORY SECTIONS** (write ALL of these, each section FULLY developed):

## 1. The Problem (400+ words)
- Describe the exact pain point with real industry context
- Use verified statistics from above
- Why traditional approaches fail

## 2. Understanding the Solution Landscape (300+ words)
- Overview of available approaches (manual rewrite, automated tools, AI-assisted)
- Honest assessment of trade-offs

## 3. How Replay Approaches This (500+ words)
- Detailed explanation of video → code workflow
- Step-by-step: record → analyze → generate → customize → deploy
- What makes this approach different (visual analysis vs code parsing)

## 4. Step-by-Step Implementation Guide (600+ words)
- Prerequisites and planning considerations
- Recording workflows effectively
- Reviewing and customizing generated output
- Integration with existing codebase and CI/CD

## 5. Comparison: Approaches and Trade-offs (500+ words)
- Feature comparison table (Replay vs manual rewrite vs code transpilers)
- Timeline, cost, and risk comparison with honest assessments

## 6. Results and Outcomes (400+ words)
- Realistic outcomes enterprises can expect
- ROI framework (not fabricated numbers)
- Before/after workflow improvements

## 7. Frequently Asked Questions (300+ words)
- 5-7 questions that CTOs and tech leads actually ask
- Detailed, honest answers

## 8. Getting Started (200+ words)
- Clear next steps
- Link to replay.build/tool for free access

**CRITICAL: This article MUST be 3000-4000 words. Write EVERY section fully. Do NOT summarize or abbreviate.**

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
    if (wordCount < 2500) {
      console.log(`Article too short (${wordCount} words), expanding...`);
      const expandPrompt = `The following article is only ${wordCount} words. It MUST be at least 3000 words.

EXPAND every section with:
- More detailed explanations and real-world examples
- Use ONLY these verified statistics: Gartner (80% legacy projects exceed budget), McKinsey ($1.8T annual legacy maintenance), Standish CHAOS (29% IT projects succeed), Forrester (40% IT budget on tech debt)
- Deeper technical details about the video-to-code workflow
- More comparison data between approaches (manual rewrite vs automated vs AI-assisted)
- Additional FAQ questions that CTOs actually ask
- Realistic outcome descriptions (NOT fabricated percentages)

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
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    if (slug.length > 80) {
      slug = slug.substring(0, 80).replace(/-[^-]*$/, "");
    }

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
      autoPublish = false,
      mode = "standard",
      competitor = null
    } = body;

    gapIdForRecovery = gapId;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`Generating content (mode=${mode}) for query: "${query}"...`);

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

    let generated;
    if (mode === "comparison" && competitor) {
      // Comparison mode: "Replay vs X" articles
      generated = await generateComparisonContent(competitor, targetKeywords.length > 0 ? targetKeywords : [query]);
    } else {
      // Standard mode
      let competitorContent: string | null = null;
      if (competitorUrl) {
        console.log(`Fetching competitor content from: ${competitorUrl}`);
        competitorContent = await fetchCompetitorContent(competitorUrl);
      }
      generated = await generateContent(query, targetKeywords, competitorContent);
    }

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
