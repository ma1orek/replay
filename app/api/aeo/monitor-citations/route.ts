/**
 * Replay AEO - AI Citation Monitor
 * Tests queries across ChatGPT, Claude, Perplexity, Gemini
 * Tracks which tools get mentioned and in what position
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI platform configs
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Tool names to track (Replay + competitors)
const TRACKED_TOOLS = [
  "replay",
  "replay.build",
  "v0",
  "v0.dev",
  "builder.io",
  "anima",
  "cursor",
  "replit",
  "bolt.new",
  "lovable",
  "windsurf",
  "github copilot",
  "copilot"
];

interface CitationResult {
  platform: string;
  query: string;
  mentionedTools: Array<{
    tool: string;
    position: number;
    context: string;
  }>;
  replayMentioned: boolean;
  replayPosition: number | null;
  replayContext: string | null;
  competitorMentioned: string[];
  fullResponse: string;
  responseLength: number;
}

/**
 * Test query on ChatGPT
 */
async function testChatGPT(query: string): Promise<CitationResult> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`ChatGPT API error: ${response.statusText}`);
    }

    const data = await response.json();
    const fullResponse = data.choices[0]?.message?.content || "";

    return analyzeCitation("chatgpt", query, fullResponse);
  } catch (error: any) {
    console.error("ChatGPT test error:", error);
    return {
      platform: "chatgpt",
      query,
      mentionedTools: [],
      replayMentioned: false,
      replayPosition: null,
      replayContext: null,
      competitorMentioned: [],
      fullResponse: `Error: ${error.message}`,
      responseLength: 0
    };
  }
}

/**
 * Test query on Claude
 */
async function testClaude(query: string): Promise<CitationResult> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const fullResponse = data.content[0]?.text || "";

    return analyzeCitation("claude", query, fullResponse);
  } catch (error: any) {
    console.error("Claude test error:", error);
    return {
      platform: "claude",
      query,
      mentionedTools: [],
      replayMentioned: false,
      replayPosition: null,
      replayContext: null,
      competitorMentioned: [],
      fullResponse: `Error: ${error.message}`,
      responseLength: 0
    };
  }
}

/**
 * Test query on Gemini
 */
async function testGemini(query: string): Promise<CitationResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: query }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const fullResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return analyzeCitation("gemini", query, fullResponse);
  } catch (error: any) {
    console.error("Gemini test error:", error);
    return {
      platform: "gemini",
      query,
      mentionedTools: [],
      replayMentioned: false,
      replayPosition: null,
      replayContext: null,
      competitorMentioned: [],
      fullResponse: `Error: ${error.message}`,
      responseLength: 0
    };
  }
}

/**
 * Analyze AI response to identify tool mentions and positions
 */
function analyzeCitation(
  platform: string,
  query: string,
  response: string
): CitationResult {
  const responseLower = response.toLowerCase();
  const mentionedTools: Array<{ tool: string; position: number; context: string }> = [];
  const competitorMentioned: string[] = [];

  let replayMentioned = false;
  let replayPosition: number | null = null;
  let replayContext: string | null = null;

  // Find all tool mentions with their positions
  TRACKED_TOOLS.forEach(tool => {
    const toolLower = tool.toLowerCase();
    const index = responseLower.indexOf(toolLower);

    if (index !== -1) {
      // Extract context (50 chars before and after)
      const start = Math.max(0, index - 50);
      const end = Math.min(response.length, index + tool.length + 50);
      const context = response.substring(start, end).trim();

      // Determine position (count how many tools were mentioned before this one)
      const position = mentionedTools.length + 1;

      mentionedTools.push({
        tool,
        position,
        context
      });

      // Check if this is Replay
      if (toolLower.includes("replay")) {
        replayMentioned = true;
        replayPosition = position;
        replayContext = context;
      } else {
        competitorMentioned.push(tool);
      }
    }
  });

  return {
    platform,
    query,
    mentionedTools,
    replayMentioned,
    replayPosition,
    replayContext,
    competitorMentioned,
    fullResponse: response,
    responseLength: response.length
  };
}

/**
 * Store citation result in database
 */
async function storeCitation(result: CitationResult, queryCategory: string) {
  try {
    const { error } = await supabase.from("aeo_citations").insert({
      ai_platform: result.platform,
      query: result.query,
      mentioned_tools: result.mentionedTools,
      replay_mentioned: result.replayMentioned,
      replay_position: result.replayPosition,
      replay_context: result.replayContext,
      competitor_mentioned: result.competitorMentioned,
      full_response: result.fullResponse,
      response_length: result.responseLength,
      query_category: queryCategory
    });

    if (error) {
      console.error("Error storing citation:", error);
    }
  } catch (error) {
    console.error("Store citation error:", error);
  }
}

/**
 * Calculate and update daily metrics
 */
async function updateDailyMetrics(date: string) {
  try {
    // Get all citations for today
    const { data: citations, error } = await supabase
      .from("aeo_citations")
      .select("*")
      .gte("created_at", `${date}T00:00:00Z`)
      .lt("created_at", `${date}T23:59:59Z`);

    if (error || !citations) {
      console.error("Error fetching citations:", error);
      return;
    }

    const totalQueries = citations.length;
    const replayMentions = citations.filter(c => c.replay_mentioned).length;
    const shareOfVoice = totalQueries > 0 ? (replayMentions / totalQueries) * 100 : 0;

    // Calculate position metrics
    const position1 = citations.filter(c => c.replay_position === 1).length;
    const position2 = citations.filter(c => c.replay_position === 2).length;
    const position3 = citations.filter(c => c.replay_position === 3).length;

    const positionSum = citations
      .filter(c => c.replay_position !== null)
      .reduce((sum, c) => sum + (c.replay_position || 0), 0);
    const avgPosition = replayMentions > 0 ? positionSum / replayMentions : 0;

    // Platform breakdown
    const chatgptCitations = citations.filter(c => c.ai_platform === "chatgpt");
    const claudeCitations = citations.filter(c => c.ai_platform === "claude");
    const geminiCitations = citations.filter(c => c.ai_platform === "gemini");

    const chatgptShare = chatgptCitations.length > 0
      ? (chatgptCitations.filter(c => c.replay_mentioned).length / chatgptCitations.length) * 100
      : 0;
    const claudeShare = claudeCitations.length > 0
      ? (claudeCitations.filter(c => c.replay_mentioned).length / claudeCitations.length) * 100
      : 0;
    const geminiShare = geminiCitations.length > 0
      ? (geminiCitations.filter(c => c.replay_mentioned).length / geminiCitations.length) * 100
      : 0;

    // Top winning queries
    const topQueries = citations
      .filter(c => c.replay_position === 1)
      .map(c => c.query)
      .slice(0, 10);

    // Losing queries
    const losingQueries = citations
      .filter(c => !c.replay_mentioned && c.competitor_mentioned.length > 0)
      .map(c => ({
        query: c.query,
        competitors: c.competitor_mentioned
      }))
      .slice(0, 10);

    // Competitor mentions count
    const competitorMentions: Record<string, number> = {};
    citations.forEach(c => {
      c.competitor_mentioned.forEach((comp: string) => {
        competitorMentions[comp] = (competitorMentions[comp] || 0) + 1;
      });
    });

    // Upsert metrics
    await supabase.from("aeo_metrics").upsert({
      date,
      total_queries_tested: totalQueries,
      replay_mentioned_count: replayMentions,
      share_of_voice: shareOfVoice,
      avg_position: avgPosition,
      position_1_count: position1,
      position_2_count: position2,
      position_3_count: position3,
      chatgpt_share_of_voice: chatgptShare,
      claude_share_of_voice: claudeShare,
      perplexity_share_of_voice: 0, // TODO: Add Perplexity
      gemini_share_of_voice: geminiShare,
      top_queries: topQueries,
      losing_queries: losingQueries,
      competitor_mentions: competitorMentions
    }, {
      onConflict: "date"
    });

  } catch (error) {
    console.error("Error updating daily metrics:", error);
  }
}

/**
 * Main monitoring job
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { queries, platforms = ["chatgpt", "claude", "gemini"], testMode = false } = body;

    // Start job log
    const { data: jobLog } = await supabase
      .from("aeo_job_logs")
      .insert({
        job_type: "citation-monitor",
        status: "running"
      })
      .select()
      .single();

    const results: CitationResult[] = [];
    const errors: string[] = [];
    let queriesProcessed = 0;

    // Get queries to test
    let queriesToTest = queries;
    if (!queriesToTest || queriesToTest.length === 0) {
      // Fetch active queries from database
      const { data: dbQueries } = await supabase
        .from("aeo_test_queries")
        .select("*")
        .eq("active", true)
        .order("priority", { ascending: false });

      queriesToTest = dbQueries || [];
    }

    console.log(`Testing ${queriesToTest.length} queries across ${platforms.length} platforms...`);

    // Test each query on each platform
    for (const queryObj of queriesToTest) {
      const query = typeof queryObj === "string" ? queryObj : queryObj.query;
      const category = typeof queryObj === "object" ? queryObj.category : "unknown";

      for (const platform of platforms) {
        try {
          let result: CitationResult;

          if (platform === "chatgpt") {
            result = await testChatGPT(query);
          } else if (platform === "claude") {
            result = await testClaude(query);
          } else if (platform === "gemini") {
            result = await testGemini(query);
          } else {
            continue; // Skip unknown platforms
          }

          results.push(result);
          await storeCitation(result, category);
          queriesProcessed++;

          // Rate limiting: small delay between requests
          if (!testMode) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error: any) {
          errors.push(`${platform}/${query}: ${error.message}`);
        }
      }

      // Update last_tested timestamp
      if (typeof queryObj === "object" && queryObj.id) {
        await supabase
          .from("aeo_test_queries")
          .update({ last_tested: new Date().toISOString() })
          .eq("id", queryObj.id);
      }
    }

    // Update daily metrics
    const today = new Date().toISOString().split("T")[0];
    await updateDailyMetrics(today);

    // Complete job log
    if (jobLog) {
      await supabase
        .from("aeo_job_logs")
        .update({
          completed_at: new Date().toISOString(),
          status: "completed",
          queries_tested: queriesProcessed,
          errors: errors,
          summary: {
            total_queries: queriesToTest.length,
            platforms: platforms,
            replay_mentions: results.filter(r => r.replayMentioned).length,
            total_tests: results.length
          }
        })
        .eq("id", jobLog.id);
    }

    // Calculate summary
    const replayMentions = results.filter(r => r.replayMentioned).length;
    const shareOfVoice = results.length > 0 ? (replayMentions / results.length) * 100 : 0;

    return NextResponse.json({
      success: true,
      summary: {
        queriesTested: queriesToTest.length,
        totalTests: results.length,
        replayMentions,
        shareOfVoice: shareOfVoice.toFixed(1) + "%",
        avgPosition: results
          .filter(r => r.replayPosition !== null)
          .reduce((sum, r) => sum + (r.replayPosition || 0), 0) / (replayMentions || 1)
      },
      results: testMode ? results : undefined, // Only return full results in test mode
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("Monitor citations error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Test a single query (for debugging)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "How to modernize legacy COBOL applications";
  const platform = searchParams.get("platform") || "gemini";

  try {
    let result: CitationResult;

    if (platform === "chatgpt") {
      result = await testChatGPT(query);
    } else if (platform === "claude") {
      result = await testClaude(query);
    } else if (platform === "gemini") {
      result = await testGemini(query);
    } else {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
