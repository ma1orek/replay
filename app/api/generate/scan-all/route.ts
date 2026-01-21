import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for all passes

const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PASS ORCHESTRATOR
// Runs all 3 scanning passes and combines into unified "Source of Truth" JSON
// ═══════════════════════════════════════════════════════════════════════════════

// Simplified combined prompt for efficiency (single API call with structured output)
const UNIFIED_SCAN_PROMPT = `You are a VISUAL REVERSE ENGINEERING SYSTEM. Your job is to perform a COMPLETE analysis of this legacy UI.

Perform THREE analysis passes and output a UNIFIED JSON:

**PASS 1 - UI STRUCTURE:**
- Extract EXACT navigation (every menu item, in order)
- Map layout grid (sidebar width, column spans)
- Identify component types (cards, tables, charts)
- Sample colors accurately

**PASS 2 - DATA EXTRACTION:**
- Transcribe ALL visible text/numbers EXACTLY
- Extract table columns and rows (every cell)
- Extract chart data points (estimate from axes)
- Capture form fields and their types

**PASS 3 - BEHAVIOR MAPPING:**
- Track click sequences shown in video
- Note loading states and durations
- Document validation errors
- Map navigation flows

**OUTPUT UNIFIED JSON:**
{
  "meta": {
    "analysisTimestamp": "ISO date",
    "videoFramesAnalyzed": "estimate",
    "overallConfidence": 0.0-1.0
  },
  
  "ui": {
    "navigation": {
      "sidebar": {
        "position": "left",
        "width": "256px",
        "backgroundColor": "#hex",
        "items": [
          {
            "order": 1,
            "label": "EXACT TEXT",
            "icon": "lucide-icon-name",
            "isActive": false,
            "href": "/path",
            "badge": null
          }
        ]
      },
      "topbar": {
        "height": "64px",
        "logo": "text or null",
        "hasSearch": true,
        "hasNotifications": true,
        "hasUserMenu": true
      }
    },
    "layout": {
      "type": "sidebar-main",
      "mainBackground": "#hex",
      "gridColumns": 12,
      "gap": "24px"
    },
    "components": [
      {
        "id": "comp_001",
        "type": "stat-card|chart|table|form",
        "gridPosition": "col-span-4",
        "title": "EXACT title"
      }
    ],
    "colors": {
      "background": "#hex",
      "surface": "#hex",
      "primary": "#hex",
      "text": "#hex",
      "border": "#hex"
    }
  },
  
  "data": {
    "metrics": [
      {
        "id": "metric_001",
        "label": "Total Revenue",
        "value": "$45,231.89",
        "change": "+20.1%",
        "changeDirection": "up",
        "icon": "DollarSign"
      }
    ],
    "tables": [
      {
        "id": "table_001",
        "title": "Table title",
        "columns": ["Column1", "Column2"],
        "columnTypes": ["string", "currency"],
        "rows": [
          {"Column1": "value", "Column2": "$100"}
        ],
        "totalRows": 10,
        "hasFilters": true,
        "filterOptions": ["All", "Active"]
      }
    ],
    "charts": [
      {
        "id": "chart_001",
        "title": "Chart title",
        "type": "area|bar|line|pie",
        "xAxisLabels": ["Jan", "Feb", "Mar"],
        "series": [
          {
            "name": "Revenue",
            "color": "#6366f1",
            "data": [1000, 1500, 1200]
          }
        ],
        "hasGradient": true,
        "showGrid": true
      }
    ],
    "forms": [
      {
        "id": "form_001",
        "title": "Form title",
        "fields": [
          {
            "name": "email",
            "label": "Email",
            "type": "email",
            "required": true
          }
        ],
        "submitLabel": "Save"
      }
    ]
  },
  
  "behavior": {
    "userJourney": [
      {
        "step": 1,
        "timestamp": "00:05",
        "action": "click",
        "target": "Payments menu item",
        "result": "navigate to /payments"
      }
    ],
    "stateTransitions": [
      {
        "from": "idle",
        "to": "loading",
        "trigger": "page load",
        "indicator": "skeleton",
        "duration": "2s"
      }
    ],
    "validations": [
      {
        "field": "email",
        "rule": "email format",
        "errorMessage": "Invalid email address"
      }
    ],
    "apiEndpoints": [
      {
        "method": "GET",
        "path": "/api/transactions",
        "trigger": "page load",
        "response": "table data"
      }
    ]
  },
  
  "businessRules": [
    {
      "id": "br_001",
      "name": "Rule name",
      "description": "Plain English description",
      "evidence": "What in the video shows this rule"
    }
  ]
}

**CRITICAL:**
1. EXACT text transcription - no paraphrasing
2. COMPLETE menu listing - count every item
3. ACCURATE color sampling - sample from actual pixels
4. ESTIMATED data for charts - use axis labels to estimate values

Analyze the video completely:`;

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

    console.log("[Scan-All] Starting unified multi-pass analysis...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 32768, // Large output for comprehensive analysis
        // @ts-ignore - Gemini 3 Pro requires thinking mode
        thinkingConfig: { thinkingBudget: 16384 }, // Maximum thinking for complex analysis
      },
    });

    // Build content parts
    const parts: any[] = [{ text: UNIFIED_SCAN_PROMPT }];
    
    if (videoBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "video/mp4",
          data: videoBase64,
        },
      });
    }

    console.log("[Scan-All] Sending to Gemini 3 Pro...");
    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Extract JSON from response
    let unifiedData: any;
    try {
      unifiedData = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        unifiedData = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          unifiedData = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Scan-All] Completed in ${duration}ms`);

    // Add metadata
    unifiedData.meta = {
      ...unifiedData.meta,
      scanDuration: duration,
      scanCompletedAt: new Date().toISOString(),
      model: MODEL_NAME,
    };

    return NextResponse.json({
      success: true,
      pass: "unified-scan",
      data: unifiedData,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[Scan-All] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete unified scan" },
      { status: 500 }
    );
  }
}
