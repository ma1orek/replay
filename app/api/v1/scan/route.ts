import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, spendCreditsForApi } from "@/lib/api-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const COST = 50;
const MODEL = "gemini-2.0-flash";

export const maxDuration = 120;

const SCAN_PROMPT = `Analyze this video recording of a UI. Extract structured data about pages, navigation, colors, typography, and components.

Output ONLY valid JSON:
{
  "pages": [
    { "id": "string", "title": "string", "path": "string", "components": ["string"], "description": "string" }
  ],
  "ui": {
    "navigation": { "type": "top-menu|sidebar|tabs", "items": [{ "label": "string", "href": "string" }] },
    "colors": { "primary": "#hex", "secondary": "#hex", "background": "#hex", "text": "#hex" },
    "typography": { "heading": "font-family", "body": "font-family" },
    "layout": { "type": "single-page|multi-page|dashboard", "columns": 1 }
  },
  "total_pages": number
}`;

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { video_url } = body;

    if (!video_url) {
      return NextResponse.json(
        { error: "video_url is required" },
        { status: 400 }
      );
    }

    const spend = await spendCreditsForApi(auth.user_id, COST, "api_scan");
    if (!spend.success) {
      return NextResponse.json(
        { error: spend.error || "Insufficient credits", credits_required: COST },
        { status: 402 }
      );
    }

    // Fetch video
    const videoResponse = await fetch(video_url);
    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch video from URL: ${videoResponse.status}` },
        { status: 400 }
      );
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString("base64");
    const contentType = videoResponse.headers.get("content-type") || "video/mp4";

    // Call Gemini
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
      { inlineData: { mimeType: contentType, data: videoBase64 } },
      { text: SCAN_PROMPT },
    ]);

    const text = result.response.text();

    // Parse JSON from response
    let scanData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      scanData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response", raw: text, credits_used: COST },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...scanData,
      credits_used: COST,
    });
  } catch (error: any) {
    console.error("[API v1/scan] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error?.message },
      { status: 500 }
    );
  }
}
