/**
 * Replay AEO - Article Improvement Endpoint
 * Improves existing published articles:
 * - Replaces fake/unsourced statistics with verified ones
 * - Extends short articles (under 2500 words)
 * - Fixes truncated slugs
 * - Adds missing FAQ sections
 * - Adds proper internal links
 * Processes in batches of 5 to avoid timeout.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const VERIFIED_STATS = `
VERIFIED INDUSTRY STATISTICS (use ONLY these — do NOT invent new ones):
- Gartner (2024): "80% of legacy modernization projects exceed their original budget and timeline"
- McKinsey Digital: "Organizations spend approximately $1.8 trillion annually maintaining legacy systems worldwide"
- Standish Group CHAOS Report: "Only 29% of IT projects are completed on time and on budget"
- Forrester: "Technical debt costs organizations an average of 40% of their IT budget"
- IEEE Software: "The average enterprise legacy modernization project takes 2-5 years"
- Stack Overflow Developer Survey 2024: React remains the most popular web framework with 40.6% usage
`;

/**
 * Improve a single article
 */
async function improveArticle(post: any): Promise<{ content: string; slug: string; improved: boolean }> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  const wordCount = post.content?.split(/\\s+/).length || 0;
  const needsExpansion = wordCount < 2500;
  const hasFAQ = /##\s*(?:Frequently Asked Questions|FAQ)/i.test(post.content || "");

  const prompt = `You are an expert technical editor. Improve this published article while preserving its core message and structure.

CURRENT ARTICLE TITLE: "${post.title}"
CURRENT WORD COUNT: ${wordCount}

IMPROVEMENT RULES:
1. REPLACE any fabricated statistics (e.g., "99% accuracy", "Replay's analysis shows 87%", "<5% failure rate") with verified ones:
${VERIFIED_STATS}
2. If the article is under 2500 words, EXPAND each section with more detail, examples, and verified data points. Target: 3000+ words.
3. ${hasFAQ ? "The article already has an FAQ section — improve the answers with more detail." : "ADD a '## Frequently Asked Questions' section with 5 relevant Q&As at the end (before any Getting Started section)."}
4. Ensure there are at least 2 internal links: [Try Replay](https://replay.build/tool) and [Replay Blog](https://replay.build/blog)
5. Remove any superlative claims that aren't backed by data ("the only tool", "the first platform")
6. Fix any broken markdown formatting
7. PRESERVE the overall structure, voice, and topic of the article
8. Do NOT add a title (H1) — just the content sections

CURRENT ARTICLE CONTENT:
${post.content}

Output the IMPROVED article as plain markdown (no JSON wrapping). Include ALL sections from the original, improved:`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 65536,
      },
    });

    const improvedContent = result.response.text();
    const newWordCount = improvedContent.split(/\s+/).length;

    // Only use improved version if it's longer or similar length (not a regression)
    if (newWordCount < wordCount * 0.7) {
      console.log(`Skipping ${post.slug}: improved version too short (${newWordCount} vs ${wordCount})`);
      return { content: post.content, slug: post.slug, improved: false };
    }

    // Fix slug if truncated mid-word
    let slug = post.slug;
    if (slug.endsWith("-") || (slug.length >= 95 && slug.match(/-[a-z]{1,3}$/))) {
      slug = slug.replace(/-[^-]{0,3}$/, "");
    }

    return { content: improvedContent, slug, improved: true };
  } catch (error) {
    console.error(`Failed to improve article ${post.slug}:`, error);
    return { content: post.content, slug: post.slug, improved: false };
  }
}

/**
 * POST - Improve existing published articles in batches
 * Body: { batchSize?: number, offset?: number, slugs?: string[] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batchSize = 5, offset = 0, slugs } = body;

    let query = supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: true });

    if (slugs && slugs.length > 0) {
      query = query.in("slug", slugs);
    } else {
      query = query.range(offset, offset + batchSize - 1);
    }

    const { data: posts, error } = await query;

    if (error) throw error;
    if (!posts || posts.length === 0) {
      return NextResponse.json({ success: true, message: "No articles to improve", improved: 0 });
    }

    console.log(`Improving ${posts.length} articles (offset: ${offset})...`);

    const results = [];
    for (const post of posts) {
      console.log(`Improving: ${post.slug} (${post.content?.split(/\\s+/).length || 0} words)...`);
      const result = await improveArticle(post);

      if (result.improved) {
        // Update the article in DB
        const updateData: any = { content: result.content };

        // Update slug if it changed
        if (result.slug !== post.slug) {
          updateData.slug = result.slug;
        }

        // Update read time
        updateData.read_time_minutes = Math.ceil(result.content.split(/\s+/).length / 200);

        const { error: updateError } = await supabase
          .from("blog_posts")
          .update(updateData)
          .eq("id", post.id);

        if (updateError) {
          console.error(`Failed to update ${post.slug}:`, updateError);
          results.push({ slug: post.slug, improved: false, error: updateError.message });
        } else {
          const newWordCount = result.content.split(/\s+/).length;
          console.log(`Improved: ${post.slug} → ${newWordCount} words`);
          results.push({
            slug: result.slug,
            improved: true,
            oldWordCount: post.content?.split(/\s+/).length || 0,
            newWordCount,
          });
        }
      } else {
        results.push({ slug: post.slug, improved: false, reason: "Skipped (regression)" });
      }
    }

    const improvedCount = results.filter(r => r.improved).length;

    return NextResponse.json({
      success: true,
      improved: improvedCount,
      total: posts.length,
      nextOffset: offset + batchSize,
      results,
    });

  } catch (error: any) {
    console.error("Improve articles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Get article improvement status/stats
 */
export async function GET() {
  try {
    // Count articles by word count ranges
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, content, created_at")
      .eq("status", "published");

    if (!posts) {
      return NextResponse.json({ total: 0, needsImprovement: 0 });
    }

    const stats = {
      total: posts.length,
      under1000: 0,
      under2000: 0,
      under2500: 0,
      over2500: 0,
      over3000: 0,
      truncatedSlugs: 0,
    };

    for (const post of posts) {
      const wc = post.content?.split(/\s+/).length || 0;
      if (wc < 1000) stats.under1000++;
      else if (wc < 2000) stats.under2000++;
      else if (wc < 2500) stats.under2500++;
      else if (wc < 3000) stats.over2500++;
      else stats.over3000++;

      if (post.slug.length >= 95 || post.slug.endsWith("-") || post.slug.match(/-[a-z]{1,3}$/)) {
        stats.truncatedSlugs++;
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      needsImprovement: stats.under1000 + stats.under2000 + stats.under2500,
    });

  } catch (error: any) {
    console.error("Get improvement stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
