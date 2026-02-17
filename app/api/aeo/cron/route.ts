/**
 * Replay AEO - Autonomous Cron Job
 * Runs every 6 hours to:
 * 1. Monitor AI citations
 * 2. Identify content gaps
 * 3. Generate and publish content
 *
 * Triggered by Vercel Cron
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300; // 5 minutes max execution time

/**
 * Main autonomous AEO pipeline
 */
export async function GET(req: Request) {
  // Verify cron secret — accept Vercel's header OR Bearer token
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "true";
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    log.push("🚀 Starting AEO autonomous pipeline...");

    // STEP 0: Recovery — unstick ALL gaps in "generating" status
    log.push("\n🔧 STEP 0: Recovering stuck jobs...");
    const { data: stuckGaps, error: stuckError } = await supabase
      .from("aeo_content_gaps")
      .update({ status: "identified", generation_started_at: null })
      .eq("status", "generating")
      .select();
    if (stuckGaps && stuckGaps.length > 0) {
      log.push(`   ♻️ Recovered ${stuckGaps.length} stuck gaps`);
    } else {
      log.push(`   ✅ No stuck jobs`);
    }

    // Check if auto-publish is enabled
    const { data: config } = await supabase
      .from("aeo_config")
      .select("value")
      .eq("key", "auto_publish_enabled")
      .single();

    const autoPublishEnabled = config?.value === true;
    log.push(`⚙️  Auto-publish: ${autoPublishEnabled ? "ENABLED" : "DISABLED"}`);

    // Determine which platforms have API keys
    const availablePlatforms: string[] = [];
    if (process.env.OPENAI_API_KEY) availablePlatforms.push("chatgpt");
    if (process.env.ANTHROPIC_API_KEY) availablePlatforms.push("claude");
    if (process.env.GEMINI_API_KEY) availablePlatforms.push("gemini");
    if (process.env.PERPLEXITY_API_KEY) availablePlatforms.push("perplexity");
    log.push(`📡 Available platforms: ${availablePlatforms.join(", ") || "NONE"}`);

    // STEP 1: Monitor AI Citations (only if we have API keys)
    if (availablePlatforms.length > 0) {
      log.push("\n📊 STEP 1: Monitoring AI Citations...");
      try {
        const monitorResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/monitor-citations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platforms: availablePlatforms
          })
        });

        const monitorData = await monitorResponse.json();
        if (monitorData.success) {
          log.push(`✅ Tested ${monitorData.summary.queriesTested} queries`);
          log.push(`   Share of Voice: ${monitorData.summary.shareOfVoice}`);
          log.push(`   Replay mentions: ${monitorData.summary.replayMentions}/${monitorData.summary.totalTests}`);
        } else {
          log.push(`❌ Monitoring failed: ${monitorData.error}`);
        }
      } catch (error: any) {
        log.push(`❌ Monitoring error: ${error.message}`);
      }
    } else {
      log.push("\n⏸️ STEP 1: Skipped — no AI platform API keys configured");
    }

    // STEP 2: Identify Content Gaps
    log.push("\n🔍 STEP 2: Identifying Content Gaps...");
    try {
      const gapsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/identify-gaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysToAnalyze: 7,
          autoGenerate: false
        })
      });

      const gapsData = await gapsResponse.json();
      if (gapsData.success) {
        log.push(`✅ Identified ${gapsData.gapsIdentified} content gaps (${gapsData.gapsStored || 0} stored/updated)`);
        log.push(`   High priority (8+): ${gapsData.highPriorityGaps}`);
      } else {
        log.push(`❌ Gap identification failed: ${gapsData.error}`);
      }
    } catch (error: any) {
      log.push(`❌ Gap identification error: ${error.message}`);
    }

    // STEP 3: Generate and Publish Content
    // Always attempt — don't gate on autoPublishEnabled for generation
    log.push("\n📝 STEP 3: Auto-Generating Content...");

    // Aggressive daily limit — 10 articles per day
    const MAX_DAILY = 10;

    // Count today's publications
    const today = new Date().toISOString().split("T")[0];
    const { count: todayPublished } = await supabase
      .from("aeo_generated_content")
      .select("*", { count: "exact", head: true })
      .eq("published", true)
      .gte("published_at", `${today}T00:00:00Z`);

    const remainingPublications = MAX_DAILY - (todayPublished || 0);

    if (remainingPublications <= 0) {
      log.push(`⏸️  Daily limit reached (${MAX_DAILY} published today)`);
    } else {
      log.push(`✅ Can publish ${remainingPublications} more articles today`);

      // Debug: count all gaps by status
      const { data: allGaps } = await supabase
        .from("aeo_content_gaps")
        .select("status")
        .neq("status", "archived");

      if (allGaps) {
        const statusCounts: Record<string, number> = {};
        allGaps.forEach(g => { statusCounts[g.status] = (statusCounts[g.status] || 0) + 1; });
        log.push(`   📊 Gap statuses: ${Object.entries(statusCounts).map(([s, c]) => `${s}=${c}`).join(", ")}`);
      }

      // Fetch high-priority gaps (priority >= 5 to be aggressive)
      const { data: highPriorityGaps, error: gapQueryError } = await supabase
        .from("aeo_content_gaps")
        .select("*")
        .eq("status", "identified")
        .gte("priority", 5)
        .order("priority", { ascending: false })
        .limit(Math.min(remainingPublications, 10)); // Max 10 per cron run (within 5min timeout)

      if (gapQueryError) {
        log.push(`   ❌ Gap query error: ${gapQueryError.message}`);
      }

      if (highPriorityGaps && highPriorityGaps.length > 0) {
        log.push(`   Found ${highPriorityGaps.length} gaps to fill`);

        for (const gap of highPriorityGaps) {
          try {
            log.push(`\n   📝 Generating: "${gap.query}"...`);

            const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/generate-content`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: gap.query,
                targetKeywords: gap.target_keywords || [],
                gapId: gap.id,
                autoPublish: autoPublishEnabled
              })
            });

            const generateData = await generateResponse.json();
            if (generateData.success) {
              log.push(`   ✅ Generated: "${generateData.title}" (${generateData.wordCount} words)`);
              if (generateData.published) {
                log.push(`      📰 Published: ${generateData.publishedUrl}`);
              }
            } else {
              log.push(`   ❌ Failed: ${generateData.error}`);
            }

            // 3 second delay between generations
            await new Promise(resolve => setTimeout(resolve, 3000));

          } catch (error: any) {
            log.push(`   ❌ Error: ${error.message}`);
          }
        }
      } else {
        log.push(`   ℹ️  No gaps found to fill`);
      }
    }

    // STEP 4: Auto-Crosspost ENTIRE BACKLOG to Dev.to + Hashnode
    // Processes 20 articles per platform per cron run (with 1.5s rate limit)
    // At 4 runs/day = ~160 crossposts/day → full backlog in ~30 days
    log.push("\n📢 STEP 4: Auto-Crossposting (backlog mode)...");

    const CROSSPOST_BATCH = 20; // articles per platform per cron run
    const CROSSPOST_DELAY = 1500; // ms between API calls (rate limit safety)

    // Dev.to crossposting — ALL uncrossposted articles (oldest first for backlog)
    if (process.env.DEVTO_API_KEY) {
      try {
        const { count: devtoRemaining } = await supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")
          .is("devto_url", null);

        const { data: devtoPosts } = await supabase
          .from("blog_posts")
          .select("slug, title")
          .eq("status", "published")
          .is("devto_url", null)
          .order("published_at", { ascending: true }) // oldest first = backlog
          .limit(CROSSPOST_BATCH);

        log.push(`   Dev.to: ${devtoRemaining || 0} remaining, processing ${devtoPosts?.length || 0}`);

        if (devtoPosts && devtoPosts.length > 0) {
          let devtoSuccess = 0;
          for (const post of devtoPosts) {
            try {
              const crosspostResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/crosspost-devto`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: post.slug })
              });
              const crosspostData = await crosspostResp.json();
              if (crosspostData.success) {
                devtoSuccess++;
                log.push(`   ✅ Dev.to: ${post.title}`);
              } else {
                log.push(`   ⚠️ Dev.to skip: ${post.slug} — ${crosspostData.error || "unknown"}`);
              }
            } catch (e: any) {
              log.push(`   ❌ Dev.to error for ${post.slug}: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, CROSSPOST_DELAY));
          }
          log.push(`   Dev.to batch done: ${devtoSuccess}/${devtoPosts.length} success, ~${(devtoRemaining || 0) - devtoSuccess} remaining`);
        }
      } catch (error: any) {
        log.push(`   ❌ Dev.to crosspost error: ${error.message}`);
      }
    } else {
      log.push(`   ⏸️ Dev.to: Skipped — DEVTO_API_KEY not configured`);
    }

    // Hashnode crossposting — ALL uncrossposted articles (oldest first for backlog)
    if (process.env.HASHNODE_API_KEY && process.env.HASHNODE_PUBLICATION_ID) {
      try {
        const { count: hashnodeRemaining } = await supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")
          .is("hashnode_url", null);

        const { data: hashnodePosts } = await supabase
          .from("blog_posts")
          .select("slug, title")
          .eq("status", "published")
          .is("hashnode_url", null)
          .order("published_at", { ascending: true }) // oldest first = backlog
          .limit(CROSSPOST_BATCH);

        log.push(`   Hashnode: ${hashnodeRemaining || 0} remaining, processing ${hashnodePosts?.length || 0}`);

        if (hashnodePosts && hashnodePosts.length > 0) {
          let hashnodeSuccess = 0;
          for (const post of hashnodePosts) {
            try {
              const crosspostResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/crosspost-hashnode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: post.slug })
              });
              const crosspostData = await crosspostResp.json();
              if (crosspostData.success) {
                hashnodeSuccess++;
                log.push(`   ✅ Hashnode: ${post.title}`);
              } else {
                log.push(`   ⚠️ Hashnode skip: ${post.slug} — ${crosspostData.error || "unknown"}`);
              }
            } catch (e: any) {
              log.push(`   ❌ Hashnode error for ${post.slug}: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, CROSSPOST_DELAY));
          }
          log.push(`   Hashnode batch done: ${hashnodeSuccess}/${hashnodePosts.length} success, ~${(hashnodeRemaining || 0) - hashnodeSuccess} remaining`);
        }
      } catch (error: any) {
        log.push(`   ❌ Hashnode crosspost error: ${error.message}`);
      }
    } else {
      log.push(`   ⏸️ Hashnode: Skipped — HASHNODE_API_KEY not configured`);
    }

    // STEP 5: Performance Tracking (check if recently published content improved citations)
    log.push("\n📈 STEP 5: Tracking Performance...");
    try {
      // Get content published 48 hours ago
      const cutoff48h = new Date();
      cutoff48h.setHours(cutoff48h.getHours() - 48);

      const { data: recentContent } = await supabase
        .from("aeo_generated_content")
        .select("*, aeo_content_gaps(*)")
        .eq("published", true)
        .gte("published_at", cutoff48h.toISOString())
        .is("citation_improvement_48h", null);

      if (recentContent && recentContent.length > 0) {
        log.push(`   Found ${recentContent.length} articles to track`);

        for (const content of recentContent) {
          // Get gap query
          const query = content.aeo_content_gaps?.query;
          if (!query) continue;

          // Get citations before and after publication
          const publishDate = new Date(content.published_at);
          const before48h = new Date(publishDate.getTime() - 48 * 60 * 60 * 1000);

          // Citations before publication
          const { data: citationsBefore } = await supabase
            .from("aeo_citations")
            .select("replay_mentioned")
            .eq("query", query)
            .gte("created_at", before48h.toISOString())
            .lt("created_at", publishDate.toISOString());

          // Citations after publication
          const { data: citationsAfter } = await supabase
            .from("aeo_citations")
            .select("replay_mentioned")
            .eq("query", query)
            .gte("created_at", publishDate.toISOString());

          if (citationsBefore && citationsAfter && citationsBefore.length > 0 && citationsAfter.length > 0) {
            const beforeRate = citationsBefore.filter(c => c.replay_mentioned).length / citationsBefore.length;
            const afterRate = citationsAfter.filter(c => c.replay_mentioned).length / citationsAfter.length;
            const improvement = ((afterRate - beforeRate) / (beforeRate || 0.01)) * 100;

            // Update content record
            await supabase
              .from("aeo_generated_content")
              .update({
                citation_improvement_48h: improvement,
                last_performance_check: new Date().toISOString()
              })
              .eq("id", content.id);

            log.push(`   📊 "${content.title}": ${improvement > 0 ? "+" : ""}${improvement.toFixed(1)}% improvement`);
          }
        }
      } else {
        log.push(`   ℹ️  No recent content to track`);
      }
    } catch (error: any) {
      log.push(`   ❌ Tracking error: ${error.message}`);
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`\n✅ AEO pipeline completed in ${duration}s`);

    // Log to database
    await supabase.from("aeo_job_logs").insert({
      job_type: "aeo-autonomous-pipeline",
      status: "completed",
      completed_at: new Date().toISOString(),
      summary: {
        duration_seconds: parseFloat(duration),
        steps_completed: 5,
        log: log.join("\n")
      }
    });

    return NextResponse.json({
      success: true,
      duration: parseFloat(duration),
      log: log.join("\n")
    });

  } catch (error: any) {
    log.push(`\n❌ FATAL ERROR: ${error.message}`);

    // Log error to database
    await supabase.from("aeo_job_logs").insert({
      job_type: "aeo-autonomous-pipeline",
      status: "failed",
      completed_at: new Date().toISOString(),
      errors: [{ message: error.message, stack: error.stack }],
      summary: {
        log: log.join("\n")
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        log: log.join("\n")
      },
      { status: 500 }
    );
  }
}
