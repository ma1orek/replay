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
  // Verify cron secret (security)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    log.push("🚀 Starting AEO autonomous pipeline...");

    // Check if auto-publish is enabled
    const { data: config } = await supabase
      .from("aeo_config")
      .select("value")
      .eq("key", "auto_publish_enabled")
      .single();

    const autoPublishEnabled = config?.value === true;
    log.push(`⚙️  Auto-publish: ${autoPublishEnabled ? "ENABLED" : "DISABLED"}`);

    // STEP 1: Monitor AI Citations
    log.push("\n📊 STEP 1: Monitoring AI Citations...");
    try {
      const monitorResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/monitor-citations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: ["chatgpt", "claude", "gemini"]
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

    // STEP 2: Identify Content Gaps
    log.push("\n🔍 STEP 2: Identifying Content Gaps...");
    try {
      const gapsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/identify-gaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysToAnalyze: 7,
          autoGenerate: false // Don't auto-generate here, we'll do it in Step 3
        })
      });

      const gapsData = await gapsResponse.json();
      if (gapsData.success) {
        log.push(`✅ Identified ${gapsData.gapsIdentified} content gaps`);
        log.push(`   High priority (8+): ${gapsData.highPriorityGaps}`);
        if (gapsData.topGaps && gapsData.topGaps.length > 0) {
          log.push(`   Top gap: "${gapsData.topGaps[0].query}" (priority ${gapsData.topGaps[0].priority})`);
        }
      } else {
        log.push(`❌ Gap identification failed: ${gapsData.error}`);
      }
    } catch (error: any) {
      log.push(`❌ Gap identification error: ${error.message}`);
    }

    // STEP 3: Generate and Publish Content (if auto-publish enabled)
    if (autoPublishEnabled) {
      log.push("\n📝 STEP 3: Auto-Generating Content...");

      // Check daily publication limit
      const { data: dailyLimitConfig } = await supabase
        .from("aeo_config")
        .select("value")
        .eq("key", "max_daily_publications")
        .single();

      const maxDailyPublications = dailyLimitConfig?.value || 3;

      // Count today's publications
      const today = new Date().toISOString().split("T")[0];
      const { count: todayPublished } = await supabase
        .from("aeo_generated_content")
        .select("*", { count: "exact", head: true })
        .eq("published", true)
        .gte("published_at", `${today}T00:00:00Z`);

      const remainingPublications = maxDailyPublications - (todayPublished || 0);

      if (remainingPublications <= 0) {
        log.push(`⏸️  Daily publication limit reached (${maxDailyPublications})`);
      } else {
        log.push(`✅ Can publish ${remainingPublications} more articles today`);

        // Get minimum priority for generation
        const { data: minPriorityConfig } = await supabase
          .from("aeo_config")
          .select("value")
          .eq("key", "min_priority_for_generation")
          .single();

        const minPriority = minPriorityConfig?.value || 7;

        // Fetch high-priority gaps
        const { data: highPriorityGaps } = await supabase
          .from("aeo_content_gaps")
          .select("*")
          .eq("status", "identified")
          .gte("priority", minPriority)
          .order("priority", { ascending: false })
          .limit(remainingPublications);

        if (highPriorityGaps && highPriorityGaps.length > 0) {
          log.push(`   Found ${highPriorityGaps.length} high-priority gaps to fill`);

          // Generate content for each gap
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
                  autoPublish: true
                })
              });

              const generateData = await generateResponse.json();
              if (generateData.success) {
                log.push(`   ✅ Generated: "${generateData.title}"`);
                log.push(`      Word count: ${generateData.wordCount}`);
                if (generateData.published) {
                  log.push(`      📰 Published: ${generateData.publishedUrl}`);
                } else {
                  log.push(`      ⏳ Awaiting manual approval`);
                }
              } else {
                log.push(`   ❌ Generation failed: ${generateData.error}`);
              }

              // Rate limiting: 30 second delay between generations
              await new Promise(resolve => setTimeout(resolve, 30000));

            } catch (error: any) {
              log.push(`   ❌ Error: ${error.message}`);
            }
          }
        } else {
          log.push(`   ℹ️  No high-priority gaps found (min priority: ${minPriority})`);
        }
      }
    } else {
      log.push("\n⏸️  STEP 3: Auto-generation disabled");
    }

    // STEP 4: Performance Tracking (check if recently published content improved citations)
    log.push("\n📈 STEP 4: Tracking Performance...");
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
        steps_completed: 4,
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
