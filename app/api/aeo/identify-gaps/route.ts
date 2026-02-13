/**
 * Replay AEO - Content Gap Identifier
 * Analyzes citation data to find queries where competitors dominate
 * Creates prioritized list of content to generate
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ContentGap {
  query: string;
  priority: number;
  competitorDominating: string;
  competitorPosition: number;
  replayCurrentPosition: number | null;
  gapType: "missing-content" | "weak-content" | "competitor-strength";
  targetKeywords: string[];
}

/**
 * Analyze recent citations to identify content gaps
 */
async function identifyGaps(daysToAnalyze: number = 7): Promise<ContentGap[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze);

  // Fetch recent citations
  const { data: citations, error } = await supabase
    .from("aeo_citations")
    .select("*")
    .gte("created_at", cutoffDate.toISOString())
    .order("created_at", { ascending: false });

  if (error || !citations) {
    console.error("Error fetching citations:", error);
    return [];
  }

  // Group citations by query
  const queryGroups: Record<string, any[]> = {};
  citations.forEach(citation => {
    if (!queryGroups[citation.query]) {
      queryGroups[citation.query] = [];
    }
    queryGroups[citation.query].push(citation);
  });

  const gaps: ContentGap[] = [];

  // Analyze each query
  for (const [query, queryCitations] of Object.entries(queryGroups)) {
    const replayMentions = queryCitations.filter(c => c.replay_mentioned);
    const competitorMentions = queryCitations.filter(
      c => c.competitor_mentioned && c.competitor_mentioned.length > 0
    );

    // Skip if Replay dominates (mentioned >70% of the time at position 1)
    const replayDominance = replayMentions.length / queryCitations.length;
    const avgReplayPosition =
      replayMentions.length > 0
        ? replayMentions.reduce((sum, c) => sum + (c.replay_position || 999), 0) /
          replayMentions.length
        : null;

    if (replayDominance > 0.7 && avgReplayPosition && avgReplayPosition < 1.5) {
      continue; // Already dominating, skip
    }

    // Identify top competitor
    const competitorCounts: Record<string, { count: number; avgPosition: number }> = {};
    competitorMentions.forEach(citation => {
      citation.competitor_mentioned.forEach((comp: string) => {
        if (!competitorCounts[comp]) {
          competitorCounts[comp] = { count: 0, avgPosition: 0 };
        }
        competitorCounts[comp].count++;
      });
    });

    // Find dominant competitor
    let topCompetitor = "";
    let topCompetitorCount = 0;
    for (const [comp, data] of Object.entries(competitorCounts)) {
      if (data.count > topCompetitorCount) {
        topCompetitorCount = data.count;
        topCompetitor = comp;
      }
    }

    // If no competitor mentioned, still identify as gap if Replay not mentioned
    if (!topCompetitor && replayMentions.length > 0) {
      continue; // Replay mentioned but no competitor = good, skip
    }

    // If no tool mentioned at all, set topCompetitor as "none"
    if (!topCompetitor) {
      topCompetitor = "none";
    }

    // Calculate competitor average position
    const competitorPositions = queryCitations
      .filter(c => c.competitor_mentioned?.includes(topCompetitor))
      .map(c => {
        const toolMention = c.mentioned_tools.find(
          (t: any) => t.tool.toLowerCase() === topCompetitor.toLowerCase()
        );
        return toolMention?.position || 999;
      });

    const avgCompetitorPosition =
      competitorPositions.length > 0
        ? competitorPositions.reduce((a, b) => a + b, 0) / competitorPositions.length
        : 999;

    // Determine gap type
    let gapType: "missing-content" | "weak-content" | "competitor-strength";
    if (replayMentions.length === 0) {
      gapType = "missing-content"; // Never mentioned
    } else if (replayDominance < 0.3) {
      gapType = "weak-content"; // Rarely mentioned
    } else {
      gapType = "competitor-strength"; // Mentioned but competitor dominates
    }

    // Calculate priority (1-10)
    let priority = 5; // base

    // Higher priority if:
    // - Replay never mentioned (+3)
    // - Competitor always mentioned (+2)
    // - Competitor in position 1 (+2)
    // - High query category priority
    if (replayMentions.length === 0) priority += 3;
    if (competitorMentions.length / queryCitations.length > 0.8) priority += 2;
    if (avgCompetitorPosition < 1.5) priority += 2;

    priority = Math.min(10, priority); // cap at 10

    // Extract keywords from query
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !["what", "how", "why", "when", "where", "best", "tool", "tools"].includes(word));

    gaps.push({
      query,
      priority,
      competitorDominating: topCompetitor,
      competitorPosition: avgCompetitorPosition,
      replayCurrentPosition: avgReplayPosition,
      gapType,
      targetKeywords: keywords
    });
  }

  // Sort by priority
  gaps.sort((a, b) => b.priority - a.priority);

  return gaps;
}

/**
 * Store identified gaps in database
 */
async function storeGaps(gaps: ContentGap[]): Promise<number> {
  let storedCount = 0;

  for (const gap of gaps) {
    try {
      // Check if gap already exists with ANY status (not just "identified")
      const { data: existingRows } = await supabase
        .from("aeo_content_gaps")
        .select("id, status")
        .eq("query", gap.query)
        .order("created_at", { ascending: false })
        .limit(1);

      const existing = existingRows?.[0];

      if (existing) {
        if (existing.status === "published") {
          // Already published — skip, don't regenerate
          continue;
        } else if (existing.status === "generating") {
          // Stuck in generating — reset to identified with updated priority
          const { error } = await supabase
            .from("aeo_content_gaps")
            .update({
              status: "identified",
              generation_started_at: null,
              priority: gap.priority,
              competitor_dominating: gap.competitorDominating,
              competitor_position: gap.competitorPosition,
              replay_current_position: gap.replayCurrentPosition,
              gap_type: gap.gapType,
              target_keywords: gap.targetKeywords
            })
            .eq("id", existing.id);
          if (!error) storedCount++;
          else console.error(`storeGaps update error for "${gap.query}":`, error);
        } else {
          // Status is "identified" or other — update priority/data
          const { error } = await supabase
            .from("aeo_content_gaps")
            .update({
              priority: gap.priority,
              competitor_dominating: gap.competitorDominating,
              competitor_position: gap.competitorPosition,
              replay_current_position: gap.replayCurrentPosition,
              gap_type: gap.gapType,
              target_keywords: gap.targetKeywords
            })
            .eq("id", existing.id);
          if (!error) storedCount++;
          else console.error(`storeGaps update error for "${gap.query}":`, error);
        }
      } else {
        // Insert new gap
        const { error } = await supabase.from("aeo_content_gaps").insert({
          query: gap.query,
          priority: gap.priority,
          competitor_dominating: gap.competitorDominating,
          competitor_position: gap.competitorPosition,
          replay_current_position: gap.replayCurrentPosition,
          status: "identified",
          gap_type: gap.gapType,
          target_keywords: gap.targetKeywords
        });
        if (!error) storedCount++;
        else console.error(`storeGaps insert error for "${gap.query}":`, error);
      }
    } catch (error) {
      console.error(`storeGaps exception for "${gap.query}":`, error);
    }
  }

  return storedCount;
}

/**
 * POST - Identify and store content gaps
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { daysToAnalyze = 7, autoGenerate = false } = body;

    console.log(`Identifying content gaps from last ${daysToAnalyze} days...`);

    // Identify gaps
    const gaps = await identifyGaps(daysToAnalyze);

    // Store gaps (returns count of successfully stored/updated)
    const storedCount = await storeGaps(gaps);

    // If auto-generate enabled, trigger content generation for high-priority gaps
    if (autoGenerate) {
      const { data: config } = await supabase
        .from("aeo_config")
        .select("value")
        .eq("key", "auto_publish_enabled")
        .single();

      const autoPublishEnabled = config?.value === true;

      if (autoPublishEnabled) {
        // Get top priority gaps
        const highPriorityGaps = gaps.filter(g => g.priority >= 8).slice(0, 3);

        // Trigger content generation (call generate-content API)
        for (const gap of highPriorityGaps) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/aeo/generate-content`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: gap.query,
                targetKeywords: gap.targetKeywords,
                competitorUrl: null // TODO: Add competitor URL
              })
            });
          } catch (error) {
            console.error("Auto-generate error:", error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      gapsIdentified: gaps.length,
      gapsStored: storedCount,
      highPriorityGaps: gaps.filter(g => g.priority >= 8).length,
      topGaps: gaps.slice(0, 10)
    });
  } catch (error: any) {
    console.error("Identify gaps error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Fetch stored content gaps
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "identified";
    const minPriority = parseInt(searchParams.get("minPriority") || "0");

    const { data: gaps, error } = await supabase
      .from("aeo_content_gaps")
      .select("*")
      .eq("status", status)
      .gte("priority", minPriority)
      .order("priority", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      gaps: gaps || []
    });
  } catch (error: any) {
    console.error("Get gaps error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
