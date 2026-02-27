import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for all passes

const MODELS_TO_TRY = ["gemini-3.1-pro-preview"];

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PASS ORCHESTRATOR
// Runs all 3 scanning passes and combines into unified "Source of Truth" JSON
// ═══════════════════════════════════════════════════════════════════════════════

// Simplified combined prompt for efficiency (single API call with structured output)
const UNIFIED_SCAN_PROMPT = `You are a VISUAL REVERSE ENGINEERING SYSTEM. Your job is to perform a COMPLETE analysis of this legacy UI.

Perform FOUR analysis passes and output a UNIFIED JSON:

**PASS 1 - UI STRUCTURE:**
- Extract EXACT navigation (every menu item, in order)
- Map layout grid (sidebar width, column spans)
- Identify component types (cards, tables, charts)
- Sample colors accurately

**PASS 2 - DATA EXTRACTION (CONTENT 1:1):**
- Transcribe ALL visible text/numbers EXACTLY — verbatim, no paraphrasing, no shortening
- Every headline, paragraph, nav label, button text, list item, FAQ, footer line → include in full
- Extract table columns and rows (every cell) — do not drop rows or "first 3"
- Extract chart data points (estimate from axes)
- Capture form fields and their types
- Do NOT skip sections (hero, partners, certyfikaty, FAQ, newsletter, footer — all must be present)

**PASS 3 - BEHAVIOR MAPPING:**
- Track click sequences shown in video
- Note loading states and durations
- Document validation errors
- Map navigation flows

**═══════════════════════════════════════════════════════════════════════════════
PASS 4 - PAGE/SCREEN DETECTION (MOST CRITICAL!!!)
═══════════════════════════════════════════════════════════════════════════════**

THIS IS THE MOST IMPORTANT PASS! You MUST identify ALL unique pages/screens/views:

⚠️⚠️⚠️ **CRITICAL MULTI-PAGE DETECTION** ⚠️⚠️⚠️

1. **WATCH THE ENTIRE VIDEO** from start to end - FRAME BY FRAME!
2. **COUNT EVERY SCREEN CHANGE** - anytime URL, content, or view changes significantly
3. **EACH NAVIGATION CLICK = POTENTIAL NEW PAGE**

**HOW TO DETECT PAGES:**
- Look at the URL bar (if visible) - each unique path = separate page
- Look at sidebar/menu highlights - each highlighted item when clicked = page
- Look at tabs at top - each tab = separate page
- Look at main content area - significant change = NEW PAGE
- Look at breadcrumbs - each level = potentially different page

**PAGE DETECTION RULES (MANDATORY):**
- Navigation click that changes main content = NEW PAGE ✓
- Tab switch showing different content = NEW PAGE ✓
- Sidebar item click = NEW PAGE ✓
- If you see 2 different screens = MINIMUM 2 PAGES
- If you see 3 different screens = MINIMUM 3 PAGES
- NEVER merge multiple visible screens into 1 page!
- Modal/dialog = NOT a page (mark separately)
- Scroll = same page

**EXAMPLES:**
- Video shows: "Strona główna" then "Oferty" = 2 PAGES!
- Video shows: Dashboard, Users list, User detail = 3 PAGES!
- Video shows: Home tab, About tab, Contact tab = 3 PAGES!
- Sidebar has: Home, Products, Orders, Settings = 4 PAGES (minimum!)

**EXTRACT FOR EACH PAGE:**
- id: unique identifier (home, listings, detail, settings)
- title: "EXACT TEXT from header/breadcrumb"
- path: logical route ("/", "/listings", "/listings/123", "/settings")
- timestamp: "MM:SS" when first visible
- components: what's visible on this page
- seenInVideo: true if shown, false if only in nav
- description: what this page does

**COMMON PAGES TO DETECT:**
- Landing page / Home / Strona główna
- List views (Products, Users, Orders, Offers/Oferty)
- Detail views (Product detail, User profile)
- Dashboard / Panel
- Settings / Ustawienia
- Contact / Kontakt
- About / O nas
- ANY menu/tab item visible = potential page!

⚠️ **ABSOLUTE REQUIREMENT - DO NOT IGNORE:**
- If video shows 2 different screens → pages array MUST have ≥2 items
- If video shows homepage THEN listings → pages = [{home}, {listings}]
- NEVER return only 1 page if multiple screens are visible in video!
- Return EVERY page visible in navigation, even if not clicked

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
  ],
  
  "pages": [
    {
      "id": "home",
      "title": "Home / Dashboard",
      "path": "/",
      "isDefault": true,
      "seenInVideo": true,
      "timestamp": "00:00",
      "components": ["sidebar", "header", "metrics-grid", "chart-area"],
      "description": "Main dashboard view with key metrics"
    },
    {
      "id": "transactions",
      "title": "Transactions",
      "path": "/transactions",
      "isDefault": false,
      "seenInVideo": true,
      "timestamp": "00:15",
      "components": ["sidebar", "header", "transactions-table", "filters"],
      "description": "List of all transactions with filtering"
    },
    {
      "id": "settings",
      "title": "Settings",
      "path": "/settings",
      "isDefault": false,
      "seenInVideo": false,
      "timestamp": null,
      "components": ["sidebar", "header", "settings-form"],
      "description": "User and app settings - visible in nav but not shown"
    }
  ]
}

**⚠️⚠️⚠️ PAGES ARRAY IS ABSOLUTELY REQUIRED! ⚠️⚠️⚠️**

**RULES FOR PAGES ARRAY:**
- Count EVERY distinct screen/view shown in video
- If video shows screen A, then screen B = pages array MUST have 2+ items!
- NEVER combine multiple screens into 1 page!
- If sidebar has N menu items = N potential pages (add all with seenInVideo: true/false)

**MINIMUM PAGES:**
- Video shows 1 screen → 1 page minimum
- Video shows 2 screens → 2 pages minimum
- Video shows 3 screens → 3 pages minimum
- Navigation has 5 items → 5 pages (some seenInVideo: false)

**MULTI-PAGE DETECTION TECHNIQUE (FRAME-BY-FRAME):**
- Scan video at 0.5-second intervals looking for CONTENT CHANGES in the main area
- A page change is: different headline, different data table, different form, different list
- Watch for: URL bar changes, breadcrumb changes, active sidebar item changes, tab switches
- Even SUBTLE changes (e.g., sidebar highlight moving from "Home" to "Products") = NEW PAGE
- Scrolling within same content = SAME page (NOT a new page)
- Loading/skeleton then content = SAME page (loading state, not new page)
- Modal/popup overlay = NOT a new page (mark as modal in behavior)

**3-SUBPAGE PATTERN (VERY COMMON):**
Many recordings show exactly 3 pages (e.g., Home → List → Detail).
If user navigates to 2nd screen, KEEP WATCHING - there's often a 3rd screen!
Common 3-page patterns:
- Landing → Features → Pricing
- Dashboard → List/Table → Detail/Edit
- Home → Category → Product
- Overview → Settings → Profile

**VALIDATION:**
- pages.length MUST match number of distinct screens + nav items!
- If result has only 1 page but video shows multiple screens = WRONG!
- If video is longer than 10 seconds, it LIKELY has multiple pages - look harder!

**CRITICAL INSTRUCTIONS:**
1. EXACT text transcription - no paraphrasing or translating (CONTENT 1:1 verbatim)
2. COMPLETE menu listing - count every single item; include every nav label exactly
3. ACCURATE color sampling - sample from actual pixels  
4. ESTIMATED data for charts - use axis labels to estimate values
5. MULTIPLE PAGES - detect ALL screens shown in video!
6. CONTENT 1:1 - every headline, paragraph, button, FAQ, footer text must appear in full; do not skip or shorten sections

Now analyze the video completely and return the unified JSON:`;

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

    // Try models with fallback
    let responseText = "";
    let usedModel = MODELS_TO_TRY[0];
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[Scan-All] Trying ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 32768,
          },
        });
        const result = await model.generateContent(parts);
        responseText = result.response.text();
        usedModel = modelName;
        console.log(`[Scan-All] Success with ${modelName}`);
        break;
      } catch (err: any) {
        console.error(`[Scan-All] ${modelName} failed:`, err?.message);
        if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) throw err;
      }
    }
    
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
      model: usedModel,
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
