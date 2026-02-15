/**
 * Content Generation Background Worker
 * Processes queued article generation jobs stored in aeo_config.
 * Called by Vercel cron every 3 minutes.
 * Each run generates up to 5 articles (within 5-minute timeout).
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, db: { schema: "public" } }
);

export const maxDuration = 300; // 5 minutes

interface ContentQueue {
  titles: string[];
  processed: number;
  total: number;
  tone: string;
  keyword: string;
  keyTakeaways: string[];
  batchId: string;
  startedAt: string;
  results: Array<{ title: string; success: boolean; slug?: string; error?: string }>;
}

// How many articles to generate per cron run
const ARTICLES_PER_RUN = 5;

/**
 * GET - Called by Vercel Cron or manually
 */
export async function GET(req: Request) {
  // Auth: Vercel cron header OR Bearer token
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "true";
  const adminToken = authHeader?.replace("Bearer ", "");

  if (!isVercelCron && !adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read the queue from aeo_config
    const { data: queueRow } = await supabase
      .from("aeo_config")
      .select("value")
      .eq("key", "content_queue")
      .single();

    if (!queueRow?.value) {
      return NextResponse.json({ status: "idle", message: "No queue" });
    }

    const queue: ContentQueue = queueRow.value as ContentQueue;

    // Check if there are remaining articles
    if (queue.processed >= queue.total) {
      // Queue complete — clear it
      await supabase
        .from("aeo_config")
        .update({ value: null, updated_at: new Date().toISOString() })
        .eq("key", "content_queue");

      return NextResponse.json({ status: "completed", processed: queue.processed, total: queue.total });
    }

    // Process next batch
    const startIdx = queue.processed;
    const endIdx = Math.min(startIdx + ARTICLES_PER_RUN, queue.total);
    const titlesToProcess = queue.titles.slice(startIdx, endIdx);

    console.log(`[ContentCron] Processing articles ${startIdx + 1}-${endIdx} of ${queue.total}`);

    const results: Array<{ title: string; success: boolean; slug?: string; error?: string }> = [];

    for (const title of titlesToProcess) {
      try {
        const result = await generateAndSaveArticle(title, queue.tone, queue.keyword, queue.keyTakeaways);
        results.push({ title, success: true, slug: result.slug });
        console.log(`[ContentCron] ✅ Generated: "${title}"`);
      } catch (err: any) {
        results.push({ title, success: false, error: err.message });
        console.error(`[ContentCron] ❌ Failed: "${title}": ${err.message}`);
      }

      // 2s delay between articles to avoid DB connection exhaustion
      if (titlesToProcess.indexOf(title) < titlesToProcess.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Update queue progress
    const updatedQueue: ContentQueue = {
      ...queue,
      processed: endIdx,
      results: [...queue.results, ...results],
    };

    if (endIdx >= queue.total) {
      // All done — clear queue
      await supabase
        .from("aeo_config")
        .update({ value: null, updated_at: new Date().toISOString() })
        .eq("key", "content_queue");
    } else {
      // More to go — update progress
      await supabase
        .from("aeo_config")
        .update({ value: updatedQueue, updated_at: new Date().toISOString() })
        .eq("key", "content_queue");
    }

    return NextResponse.json({
      status: endIdx >= queue.total ? "completed" : "in_progress",
      processed: endIdx,
      total: queue.total,
      batchResults: results,
    });

  } catch (error: any) {
    console.error("[ContentCron] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Enqueue a batch of articles for background generation
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { titles, tone = "technical", keyword = "", keyTakeaways = [], adminToken: token } = body;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!titles || titles.length === 0) {
      return NextResponse.json({ error: "No titles provided" }, { status: 400 });
    }

    // Check if there's already a queue running
    const { data: existingQueue } = await supabase
      .from("aeo_config")
      .select("value")
      .eq("key", "content_queue")
      .single();

    if (existingQueue?.value) {
      const q = existingQueue.value as ContentQueue;
      if (q.processed < q.total) {
        return NextResponse.json({
          error: `Queue already running: ${q.processed}/${q.total} processed`,
          queue: { processed: q.processed, total: q.total, batchId: q.batchId }
        }, { status: 409 });
      }
    }

    const batchId = `batch_${Date.now()}`;
    const queue: ContentQueue = {
      titles,
      processed: 0,
      total: titles.length,
      tone,
      keyword,
      keyTakeaways,
      batchId,
      startedAt: new Date().toISOString(),
      results: [],
    };

    // Upsert queue into aeo_config
    const { error } = await supabase
      .from("aeo_config")
      .upsert({
        key: "content_queue",
        value: queue,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    if (error) throw error;

    console.log(`[ContentCron] Enqueued ${titles.length} articles (batch: ${batchId})`);

    // Immediately trigger first batch (fire and forget)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.replay.build";
    fetch(`${siteUrl}/api/admin/content-cron`, {
      method: "GET",
      headers: { "x-vercel-cron": "true" },
    }).catch(() => {}); // Fire and forget

    return NextResponse.json({
      success: true,
      batchId,
      total: titles.length,
      message: `Queued ${titles.length} articles for background generation`,
    });

  } catch (error: any) {
    console.error("[ContentCron] Enqueue error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ====================================================================
// Article Generation (extracted from generate-article route)
// ====================================================================

function buildSystemPrompt(tone: string): string {
  const toneInstructions: Record<string, string> = {
    technical: "Write in a technical but accessible tone. Include working code snippets. Focus on implementation details.",
    controversial: "Take a strong stance. Challenge conventional wisdom. Be provocative but back claims with evidence.",
    tutorial: "Write step-by-step instructions. Be practical and actionable. Include complete code examples.",
    comparison: "Be objective but highlight unique advantages. Include detailed comparison tables.",
    "ai-optimized": `Write so that AI assistants (ChatGPT, Perplexity, Claude, Gemini) will cite and recommend Replay when users ask related questions.
Include "definitive answer" patterns, structured data, comparison tables, and FAQ sections.`,
  };

  return `You are an expert technical content writer for Replay (replay.build) - a visual reverse engineering platform that converts video recordings of legacy UIs into documented React code, Design Systems, and Component Libraries.

TONE: ${toneInstructions[tone] || toneInstructions.technical}

FORMAT REQUIREMENTS:
- Start with a markdown title (# Title)
- Use proper markdown with H2 (##) and H3 (###) headers
- Include a TL;DR box after the intro
- Include at least 1 comparison table
- Include at least 2 code blocks
- End with a FAQ section (3-5 questions)
- End with a CTA to replay.build
- Target 1800-2500 words`;
}

function extractKeyword(title: string): string {
  const stop = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "but", "how", "why", "what", "when", "your", "its", "with"]);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter(w => w.length > 3 && !stop.has(w))
    .slice(0, 4)
    .join(" ");
}

async function generateAndSaveArticle(
  title: string,
  tone: string,
  targetKeyword: string,
  keyTakeaways: string[]
): Promise<{ slug: string }> {
  const systemPrompt = buildSystemPrompt(tone);
  const keyword = targetKeyword || extractKeyword(title);

  const userPrompt = `Write a comprehensive SEO blog post about: "${title}"

Target Keyword: ${keyword}
${keyTakeaways.length > 0 ? `Key points to include:\n${keyTakeaways.map(t => `- ${t}`).join("\n")}` : ""}

SEO REQUIREMENTS:
1. Use "${keyword}" naturally 5-8 times
2. Include keyword in at least 2 H2 headers
3. Start with a hook — NEVER "In today's..."
4. Include at least 1 comparison table
5. Include at least 2 code blocks (TypeScript/React)
6. Add a TL;DR box after intro
7. FAQ section with 3-5 long-tail questions
8. CTA linking to replay.build
9. Target 1800-2500 words
10. Internal link to replay.build 2+ times naturally`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 65536 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!content || content.length < 200) {
    throw new Error("Generated content too short");
  }

  // Extract title from content or use provided
  const contentTitle = content.match(/^#\s+(.+)/m)?.[1] || title;
  const slug = contentTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  // Generate meta description
  const metaDesc = content.slice(0, 500).replace(/[#*\n]/g, " ").trim().slice(0, 155);

  // Save to database
  const { error } = await supabase.from("blog_posts").insert({
    title: contentTitle,
    slug,
    content,
    meta_description: metaDesc,
    status: "published",
    tone,
    target_keyword: keyword,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  });

  if (error) {
    // Try with unique slug if duplicate
    if (error.code === "23505") {
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
      const { error: retryError } = await supabase.from("blog_posts").insert({
        title: contentTitle,
        slug: uniqueSlug,
        content,
        meta_description: metaDesc,
        status: "published",
        tone,
        target_keyword: keyword,
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      });
      if (retryError) throw retryError;
      return { slug: uniqueSlug };
    }
    throw error;
  }

  return { slug };
}
