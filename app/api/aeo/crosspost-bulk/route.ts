/**
 * Replay AEO - Bulk Crosspost
 * Processes published articles in batches, crossposting to Dev.to and/or Hashnode.
 * Skips articles that already have a devto_url / hashnode_url.
 *
 * POST body: { platform: "devto" | "hashnode" | "all", batchSize?: number }
 * Returns: { processed, skipped, errors, nextOffset }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.replay.build";

export const maxDuration = 300; // 5 minutes

// Admin auth check
function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, password] = decoded.split(":");
    return email === process.env.ADMIN_EMAIL && password === (process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const platform = body.platform || "all"; // "devto" | "hashnode" | "all"
  const batchSize = Math.min(body.batchSize || 20, 50); // max 50 per call

  const results: { platform: string; slug: string; url?: string; error?: string }[] = [];
  let processed = 0;
  let skipped = 0;
  let devtoRateLimited = false;

  // Dev.to batch — stop immediately on 429
  if ((platform === "devto" || platform === "all") && process.env.DEVTO_API_KEY) {
    const devtoBatch = Math.min(batchSize, 10); // Dev.to limit ~10/day
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title")
      .eq("status", "published")
      .is("devto_url", null)
      .order("published_at", { ascending: true }) // oldest first for backlog
      .limit(devtoBatch);

    if (posts && posts.length > 0) {
      for (const post of posts) {
        try {
          const resp = await fetch(`${SITE_URL}/api/aeo/crosspost-devto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: post.slug }),
          });
          const data = await resp.json();
          if (data.rateLimited || resp.status === 429) {
            results.push({ platform: "devto", slug: post.slug, error: "Rate limited (429) — stopped batch" });
            devtoRateLimited = true;
            break;
          }
          if (data.success) {
            results.push({ platform: "devto", slug: post.slug, url: data.devtoUrl });
            processed++;
          } else {
            results.push({ platform: "devto", slug: post.slug, error: data.error });
            skipped++;
          }
        } catch (e: any) {
          results.push({ platform: "devto", slug: post.slug, error: e.message });
        }
        // 3s between Dev.to calls (strict rate limit)
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  // Hashnode batch — no rate limit issues, go fast
  if ((platform === "hashnode" || platform === "all") && process.env.HASHNODE_API_KEY) {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title")
      .eq("status", "published")
      .is("hashnode_url", null)
      .order("published_at", { ascending: true }) // oldest first for backlog
      .limit(batchSize); // Hashnode handles big batches

    if (posts && posts.length > 0) {
      for (const post of posts) {
        try {
          const resp = await fetch(`${SITE_URL}/api/aeo/crosspost-hashnode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: post.slug }),
          });
          const data = await resp.json();
          if (data.success) {
            results.push({ platform: "hashnode", slug: post.slug, url: data.hashnodeUrl });
            processed++;
          } else {
            results.push({ platform: "hashnode", slug: post.slug, error: data.error });
            skipped++;
          }
        } catch (e: any) {
          results.push({ platform: "hashnode", slug: post.slug, error: e.message });
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // Count remaining
  const { count: remainingDevto } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .is("devto_url", null);

  const { count: remainingHashnode } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .is("hashnode_url", null);

  return NextResponse.json({
    success: true,
    processed,
    skipped,
    devtoRateLimited,
    results,
    remaining: {
      devto: remainingDevto || 0,
      hashnode: remainingHashnode || 0,
    },
  });
}

/** GET - Check crosspost stats */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count: totalPublished } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: devtoPosted } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .not("devto_url", "is", null);

  const { count: hashnodePosted } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .not("hashnode_url", "is", null);

  return NextResponse.json({
    totalPublished: totalPublished || 0,
    devto: { posted: devtoPosted || 0, remaining: (totalPublished || 0) - (devtoPosted || 0) },
    hashnode: { posted: hashnodePosted || 0, remaining: (totalPublished || 0) - (hashnodePosted || 0) },
    configured: {
      devto: !!process.env.DEVTO_API_KEY,
      hashnode: !!(process.env.HASHNODE_API_KEY && process.env.HASHNODE_PUBLICATION_ID),
    },
  });
}
