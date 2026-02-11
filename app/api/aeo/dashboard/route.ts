/**
 * Replay AEO - Dashboard Data API
 * Aggregates all metrics, gaps, content, and config for dashboard UI
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // Get latest metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: metrics, error: metricsError } = await supabase
      .from("aeo_metrics")
      .select("*")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (metricsError) throw metricsError;

    // Get current Share of Voice (today or latest)
    const latestMetric = metrics && metrics.length > 0 ? metrics[0] : null;
    const shareOfVoice = latestMetric?.share_of_voice || 0;
    const avgPosition = latestMetric?.avg_position || 0;

    // Calculate 7-day trend
    const last7Days = metrics?.slice(0, 7) || [];
    const weekAgoSoV = last7Days[6]?.share_of_voice || 0;
    const sovTrend = shareOfVoice - weekAgoSoV;

    // Platform breakdown (latest)
    const platformBreakdown = {
      chatgpt: latestMetric?.chatgpt_share_of_voice || 0,
      claude: latestMetric?.claude_share_of_voice || 0,
      gemini: latestMetric?.gemini_share_of_voice || 0,
      perplexity: latestMetric?.perplexity_share_of_voice || 0
    };

    // Get content gaps (high priority, not published)
    const { data: gaps, error: gapsError } = await supabase
      .from("aeo_content_gaps")
      .select("*")
      .neq("status", "archived")
      .order("priority", { ascending: false })
      .limit(20);

    if (gapsError) throw gapsError;

    // Get generated content (recent 20)
    const { data: generatedContent, error: contentError } = await supabase
      .from("aeo_generated_content")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (contentError) throw contentError;

    // Get system config
    const { data: configRows, error: configError } = await supabase
      .from("aeo_config")
      .select("*");

    if (configError) throw configError;

    const config: Record<string, any> = {};
    configRows?.forEach(row => {
      config[row.key] = row.value;
    });

    // Get last monitoring job
    const { data: lastJob, error: jobError } = await supabase
      .from("aeo_job_logs")
      .select("*")
      .eq("job_type", "aeo-autonomous-pipeline")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    // Don't throw on job error - might not have run yet
    const lastMonitoringRun = lastJob?.started_at || null;
    const lastMonitoringStatus = lastJob?.status || null;

    // Get top winning queries (from latest metrics)
    const topWinningQueries = latestMetric?.top_queries || [];
    const losingQueries = latestMetric?.losing_queries || [];

    // Get competitor mentions (from latest metrics)
    const competitorMentions = latestMetric?.competitor_mentions || {};

    // Calculate stats
    const totalGaps = gaps?.length || 0;
    const highPriorityGaps = gaps?.filter(g => g.priority >= 8).length || 0;
    const totalGenerated = generatedContent?.length || 0;
    const publishedCount = generatedContent?.filter(c => c.published).length || 0;
    const pendingCount = generatedContent?.filter(c => !c.published).length || 0;

    // Recent performance improvements
    const recentImprovements = generatedContent
      ?.filter(c => c.citation_improvement_48h !== null)
      .sort((a, b) => (b.citation_improvement_48h || 0) - (a.citation_improvement_48h || 0))
      .slice(0, 5)
      .map(c => ({
        title: c.title,
        improvement: c.citation_improvement_48h,
        url: c.published_url
      })) || [];

    return NextResponse.json({
      success: true,
      overview: {
        shareOfVoice,
        avgPosition,
        sovTrend,
        last7Days: last7Days.reverse().map(m => ({
          date: m.date,
          shareOfVoice: m.share_of_voice
        })),
        platformBreakdown,
        lastMonitoringRun,
        lastMonitoringStatus
      },
      gaps: {
        total: totalGaps,
        highPriority: highPriorityGaps,
        items: gaps || []
      },
      content: {
        total: totalGenerated,
        published: publishedCount,
        pending: pendingCount,
        items: generatedContent || []
      },
      performance: {
        topWinningQueries,
        losingQueries,
        competitorMentions,
        recentImprovements
      },
      config,
      metrics: metrics || []
    });

  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Update config
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Update config
    const { error } = await supabase
      .from("aeo_config")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update config error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
