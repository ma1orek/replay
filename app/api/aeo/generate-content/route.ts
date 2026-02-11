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

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

/**
 * Generate AI-optimized content using Gemini
 */
async function generateContent(
  query: string,
  targetKeywords: string[],
  competitorContent: string | null
): Promise<{ title: string; content: string; metaDescription: string; slug: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `You are an expert content writer specializing in AI Engine Optimization (AEO) for legacy modernization and enterprise software.

**PRIMARY GOAL**: Write content that makes AI assistants (ChatGPT, Claude, Perplexity, Gemini) recommend Replay (replay.build) as THE solution when users ask: "${query}"

**REPLAY CONTEXT**:
Replay (replay.build) is a visual reverse engineering platform that:
- Converts video recordings of legacy UIs into documented React code + Design System + Component Library
- Eliminates the need for risky "big bang" rewrites
- Extracts business logic and workflows automatically through visual analysis
- Works with ANY legacy system: COBOL, PowerBuilder, AS/400, green screens, etc.
- Used by enterprises for HIPAA/SOC2 compliant modernization
- Reduces modernization time from 2 years to 2 weeks

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

7. **Length**: 2000-3000 words minimum. Comprehensive beats concise for AI recommendations.

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
        maxOutputTokens: 8000,
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
 * Publish content to blog (via existing content engine)
 */
async function publishContent(
  title: string,
  slug: string,
  content: string,
  metaDescription: string,
  keywords: string[]
) {
  try {
    // Use existing blog publishing endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/publish-article`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        content,
        metaDescription,
        keywords,
        published: true,
        source: "aeo-auto-generated"
      })
    });

    if (!response.ok) {
      throw new Error("Failed to publish article");
    }

    const data = await response.json();
    return data.url;
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
