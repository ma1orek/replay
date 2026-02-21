import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, spendCreditsForApi } from "@/lib/api-auth";
import { transmuteVideoToCode } from "@/actions/transmute";

const COST = 150;

export async function POST(request: NextRequest) {
  try {
    // Auth
    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key. Use Authorization: Bearer rk_live_..." },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const { video_url, style, design_system_id, use_surveyor = true } = body;

    if (!video_url) {
      return NextResponse.json(
        { error: "video_url is required. Provide a public URL to an MP4/WebM/MOV video." },
        { status: 400 }
      );
    }

    // Spend credits
    const spend = await spendCreditsForApi(auth.user_id, COST, "api_generate");
    if (!spend.success) {
      return NextResponse.json(
        { error: spend.error || "Insufficient credits", credits_required: COST },
        { status: 402 }
      );
    }

    // Generate
    const result = await transmuteVideoToCode({
      videoUrl: video_url,
      styleDirective: style || "",
      useSurveyor: use_surveyor,
    });

    if (!result || !result.success) {
      return NextResponse.json(
        { success: false, error: result?.error || "Generation failed", credits_used: COST },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: result.code,
      scan_data: result.scanData || null,
      token_usage: result.tokenUsage
        ? {
            prompt: result.tokenUsage.promptTokens,
            completion: result.tokenUsage.candidatesTokens,
            total: result.tokenUsage.totalTokens,
          }
        : null,
      credits_used: COST,
    });
  } catch (error: any) {
    console.error("[API v1/generate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error?.message },
      { status: 500 }
    );
  }
}
