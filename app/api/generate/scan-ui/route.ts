import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASS 1: UI STRUCTURE SCANNER
// Purpose: Extract EXACT structure from video - NO CODE, ONLY DATA
// ═══════════════════════════════════════════════════════════════════════════════

const UI_SCAN_PROMPT = `You are a UI FORENSICS ANALYST with pixel-perfect vision.

**YOUR ONLY JOB:** Extract the EXACT UI structure from the video. DO NOT generate code. DO NOT interpret. Just OBSERVE and LIST.

**CRITICAL RULES:**
1. COUNT every menu item. If there are 15 items, list all 15. Missing one = FAILURE.
2. Use EXACT labels. "Customers" is NOT "Users". "Payouts" is NOT "Payments".
3. Note separators, dividers, and groupings in navigation.
4. Identify which item is currently ACTIVE/SELECTED (highlighted state).
5. For icons, describe the SHAPE you see (e.g., "house shape", "gear/cog", "chart bars").
6. Measure layout proportions (sidebar width, grid columns).

**OUTPUT JSON SCHEMA:**
{
  "timestamp": "ISO timestamp of analysis",
  "confidence": 0.0-1.0,
  
  "navigation": {
    "sidebar": {
      "exists": true,
      "position": "left|right",
      "widthEstimate": "64px|200px|256px|etc",
      "backgroundColor": "#hex sampled from video",
      "sections": [
        {
          "name": "Main Navigation|Settings|User|etc",
          "items": [
            {
              "order": 1,
              "label": "EXACT text visible",
              "iconShape": "house|gear|chart-bars|users|credit-card|etc",
              "lucideIconGuess": "Home|Settings|BarChart3|Users|CreditCard",
              "isActive": false,
              "hasChevron": false,
              "hasBadge": false,
              "badgeValue": null,
              "indent": 0,
              "isHeader": false,
              "isSeparator": false
            }
          ]
        }
      ],
      "footer": {
        "hasUserAvatar": false,
        "hasSettingsLink": false,
        "hasLogout": false,
        "userName": null
      }
    },
    "topbar": {
      "exists": true,
      "heightEstimate": "48px|64px|etc",
      "hasLogo": true,
      "logoText": "Brand name if visible",
      "hasSearch": false,
      "hasNotifications": false,
      "hasUserMenu": false,
      "breadcrumbs": []
    }
  },
  
  "layout": {
    "type": "sidebar-main|topbar-main|fullscreen|split",
    "gridSystem": "12-column|flex|custom",
    "backgroundColor": "#hex of main content area",
    "regions": [
      {
        "name": "header|stats-row|main-chart|data-table|etc",
        "gridPosition": "row-1 col-1-12|row-2 col-1-4|etc",
        "estimatedHeight": "64px|200px|auto",
        "componentCount": 1
      }
    ]
  },
  
  "components": [
    {
      "id": "comp_001",
      "type": "stat-card|chart-card|data-table|form|modal|tabs|etc",
      "position": {
        "gridRow": 1,
        "gridCol": 1,
        "colSpan": 4
      },
      "title": "EXACT title text",
      "subtitle": "subtitle if visible",
      "hasIcon": true,
      "iconShape": "dollar-sign|trending-up|etc",
      "borderStyle": "rounded|sharp|none",
      "hasShadow": true,
      "backgroundColor": "#hex"
    }
  ],
  
  "colorPalette": {
    "background": "#hex - main page background",
    "surface": "#hex - card/panel background", 
    "primary": "#hex - main accent color",
    "secondary": "#hex - secondary accent",
    "text": "#hex - main text color",
    "textMuted": "#hex - secondary text",
    "border": "#hex - border color",
    "success": "#hex if visible",
    "error": "#hex if visible"
  },
  
  "typography": {
    "fontFamily": "Inter|Roboto|System|etc - best guess",
    "headingSize": "text-2xl|text-xl|etc",
    "bodySize": "text-sm|text-base|etc"
  }
}

**IMPORTANT:** 
- If you cannot see something clearly, set confidence lower and note it.
- Empty strings are better than guesses.
- This JSON will be used to generate code, so accuracy is critical.

Analyze the video and extract the UI structure:`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { videoBase64, mimeType, videoUrl } = body;

    if (!videoBase64 && !videoUrl) {
      return NextResponse.json({ error: "Video data required" }, { status: 400 });
    }

    console.log("[Scan-UI] Starting UI structure extraction...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.1, // Low temperature for accuracy
        maxOutputTokens: 8192,
        // @ts-ignore - Gemini 3 Pro requires thinking mode
        thinkingConfig: { thinkingBudget: 4096 },
      },
    });

    // Build content parts
    const parts: any[] = [{ text: UI_SCAN_PROMPT }];
    
    if (videoBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "video/mp4",
          data: videoBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Extract JSON from response
    let uiStructure: any;
    try {
      // Try direct parse first
      uiStructure = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        uiStructure = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in text
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          uiStructure = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Scan-UI] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      pass: "ui-structure",
      data: uiStructure,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[Scan-UI] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan UI structure" },
      { status: 500 }
    );
  }
}
