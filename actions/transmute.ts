"use server";

import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PASS PIPELINE v2.0 (Server Action Version)
// Phase 1: UNIFIED SCAN - Extract EVERYTHING from video
// Phase 2: ASSEMBLER - Generate code from JSON data ONLY
// ═══════════════════════════════════════════════════════════════════════════════

// ============================================================================
// INTERFACES
// ============================================================================

interface TransmuteOptions {
  videoUrl: string;
  styleDirective?: string;
  databaseContext?: string;
  styleReferenceImage?: { url: string; base64?: string };
}

interface TransmuteResult {
  success: boolean;
  code?: string;
  error?: string;
  scanData?: any;
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

interface EditResult {
  success: boolean;
  code?: string;
  error?: string;
  isChat?: boolean;
}

// ============================================================================
// UNIFIED SCAN PROMPT - Extract EVERYTHING from video
// ============================================================================

const UNIFIED_SCAN_PROMPT = `You are a VISUAL REVERSE ENGINEERING SYSTEM with pixel-perfect vision.

**YOUR MISSION:** Perform a COMPLETE forensic analysis of this legacy UI. Extract EVERY piece of data visible.

**CRITICAL RULES:**
1. EXACT TEXT: Copy all text character-for-character. "Customers" ≠ "Users".
2. COMPLETE MENU: Count every navigation item. If 15 items exist, list all 15.
3. EXACT NUMBERS: "$1,234.56" not "$1234". "+12.5%" not "12%".
4. ACCURATE COLORS: Sample hex values from actual pixels.
5. FULL TABLES: Capture all visible rows and columns.
6. CHART DATA: Estimate data points from axis scales.

**OUTPUT UNIFIED JSON:**
{
  "meta": {
    "confidence": 0.0-1.0,
    "screensAnalyzed": 1,
    "warnings": []
  },
  
  "ui": {
    "navigation": {
      "sidebar": {
        "exists": true,
        "position": "left",
        "width": "256px",
        "backgroundColor": "#0f172a",
        "logo": {
          "text": "EXACT logo text",
          "hasIcon": true
        },
        "items": [
          {
            "order": 1,
            "label": "EXACT menu label",
            "icon": "Home",
            "isActive": false,
            "href": "/path",
            "badge": null,
            "isSeparator": false,
            "isHeader": false,
            "indent": 0
          }
        ],
        "footer": {
          "hasUserSection": true,
          "userName": "name if visible",
          "userEmail": "email if visible"
        }
      },
      "topbar": {
        "exists": true,
        "height": "64px",
        "hasSearch": true,
        "hasNotifications": true,
        "hasUserMenu": true,
        "breadcrumbs": ["Home", "Dashboard"]
      }
    },
    "layout": {
      "type": "sidebar-main",
      "gridColumns": 12,
      "gap": "24px",
      "padding": "32px"
    },
    "colors": {
      "background": "#0a0a0a",
      "surface": "#18181b",
      "primary": "#6366f1",
      "secondary": "#8b5cf6",
      "text": "#fafafa",
      "textMuted": "#71717a",
      "border": "#27272a",
      "success": "#22c55e",
      "error": "#ef4444",
      "warning": "#f59e0b"
    },
    "typography": {
      "fontFamily": "Inter",
      "headingWeight": 600,
      "bodySize": "14px"
    }
  },
  
  "data": {
    "metrics": [
      {
        "id": "metric_001",
        "label": "EXACT label",
        "value": "EXACT formatted value",
        "rawValue": 12345.67,
        "change": "+12.5%",
        "changeDirection": "up",
        "icon": "DollarSign",
        "gridPosition": "col-span-3"
      }
    ],
    "tables": [
      {
        "id": "table_001",
        "title": "EXACT table title",
        "columns": [
          { "key": "col1", "header": "EXACT header", "type": "string", "align": "left" }
        ],
        "rows": [
          { "col1": "EXACT cell value" }
        ],
        "totalRows": 10,
        "hasFilters": true,
        "filterOptions": ["All", "Active", "Pending"],
        "currentFilter": "All",
        "hasSearch": true,
        "hasActions": true
      }
    ],
    "charts": [
      {
        "id": "chart_001",
        "title": "EXACT chart title",
        "type": "area",
        "gridPosition": "col-span-6",
        "xAxis": {
          "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          "type": "category"
        },
        "yAxis": {
          "min": 0,
          "max": 50000,
          "unit": "$"
        },
        "series": [
          {
            "name": "Revenue",
            "color": "#6366f1",
            "data": [12000, 15000, 18000, 22000, 19000, 25000]
          }
        ],
        "style": {
          "hasGradient": true,
          "showGrid": true,
          "showDots": false,
          "curveType": "monotone"
        }
      }
    ],
    "forms": [
      {
        "id": "form_001",
        "title": "Form title",
        "fields": [
          {
            "name": "fieldName",
            "label": "EXACT label",
            "type": "text",
            "placeholder": "placeholder text",
            "required": true
          }
        ],
        "submitButton": "EXACT button text"
      }
    ]
  },
  
  "behavior": {
    "currentPage": "/dashboard",
    "pageTitle": "EXACT page title",
    "userJourney": [],
    "loadingStates": [],
    "validations": []
  }
}

Analyze the video and extract EVERYTHING:`;

// ============================================================================
// ASSEMBLER PROMPT - Generate code from SCAN DATA ONLY (no video!)
// ============================================================================

const ASSEMBLER_PROMPT = `You are a CODE ASSEMBLER for the Replay.build system.

**YOUR ROLE:** Generate React code from STRUCTURED DATA. You do NOT see video - only JSON.

**MANDATORY TECH STACK (Pre-installed):**

1. **RECHARTS** - ALL charts MUST use Recharts:
   - AreaChart with gradient fill
   - BarChart with rounded corners
   - LineChart for line charts
   - PieChart for pie/donut

2. **LUCIDE ICONS** - via lucide global

3. **TAILWIND CSS** - ALL styling

**CODE TEMPLATE:**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="antialiased">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;
        const { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie,
                XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } = Recharts;

        // Icon helper
        const Icon = ({ name, className = "w-5 h-5" }) => {
            const ref = useRef(null);
            useEffect(() => {
                if (ref.current && lucide.icons[name]) {
                    ref.current.innerHTML = '';
                    const svg = lucide.createElement(lucide.icons[name]);
                    svg.setAttribute('class', className);
                    ref.current.appendChild(svg);
                }
            }, [name, className]);
            return <span ref={ref} className="inline-flex items-center justify-center" />;
        };

        // Components built from SCAN_DATA...
        
        const App = () => {
            return (
                <div>
                    {/* Build from scanData */}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
\`\`\`

**RULES:**
1. Use EXACT data from scanData
2. Charts MUST use Recharts (no SVG!)
3. All menu items from scanData

Generate complete HTML:`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || "";
}

async function fetchVideoAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    console.log("[transmute] Fetching video from URL:", url.substring(0, 100));
    
    const response = await fetch(url, {
      headers: { 'Accept': 'video/*,*/*' },
    });
    
    if (!response.ok) {
      console.error("[transmute] Video fetch failed:", response.status, response.statusText);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log("[transmute] Video fetched. Size:", arrayBuffer.byteLength, "Type:", contentType);
    
    let mimeType = 'video/mp4';
    if (contentType.includes('webm')) mimeType = 'video/webm';
    else if (contentType.includes('quicktime') || contentType.includes('mov')) mimeType = 'video/quicktime';
    
    return { base64, mimeType };
  } catch (error) {
    console.error("[transmute] Error fetching video:", error);
    return null;
  }
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    let mimeType = 'image/png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) mimeType = 'image/jpeg';
    else if (contentType.includes('webp')) mimeType = 'image/webp';
    
    return { base64, mimeType };
  } catch {
    return null;
  }
}

function extractCodeFromResponse(response: string): string | null {
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) return htmlMatch[1].trim();
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 100) return codeMatch[1].trim();
  
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.toLowerCase().startsWith('<html')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
  }
  
  return null;
}

function fixBrokenImageUrls(code: string): string {
  if (!code) return code;
  
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
  let imageCounter = 0;
  
  const getNextPicsumUrl = (width = 800, height = 600) => {
    const id = validPicsumIds[imageCounter % validPicsumIds.length];
    imageCounter++;
    return `https://picsum.photos/id/${id}/${width}/${height}`;
  };
  
  code = code.replace(/https?:\/\/[^"'\s)]*unsplash[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/[^"'\s)]*pexels[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/via\.placeholder\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/placehold\.co[^"'\s)]*/gi, () => getNextPicsumUrl());
  
  return code;
}

// ============================================================================
// MAIN TRANSMUTE FUNCTION - MULTI-PASS PIPELINE
// ============================================================================

export async function transmuteVideoToCode(options: TransmuteOptions): Promise<TransmuteResult> {
  const { videoUrl, styleDirective, databaseContext, styleReferenceImage } = options;
  
  console.log("[transmute] MULTI-PASS PIPELINE v2.0 - Starting...");
  console.log("[transmute] Video URL:", videoUrl?.substring(0, 100));
  
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }
  
  try {
    // Fetch video from URL
    const videoData = await fetchVideoAsBase64(videoUrl);
    if (!videoData) {
      return { success: false, error: "Failed to fetch video from storage" };
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const startTime = Date.now();
    
    // ════════════════════════════════════════════════════════════════
    // PHASE 1: UNIFIED SCAN - Extract everything from video
    // ════════════════════════════════════════════════════════════════
    console.log("[transmute] Phase 1: Starting unified scan...");
    
    const scannerModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 16384,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 8192 },
      },
    });
    
    const scanResult = await scannerModel.generateContent([
      { text: UNIFIED_SCAN_PROMPT },
      { inlineData: { mimeType: videoData.mimeType, data: videoData.base64 } },
    ]);
    
    const scanText = scanResult.response.text();
    console.log("[transmute] Phase 1 complete. Scan length:", scanText.length);
    
    // Parse scan data
    let scanData: any = null;
    try {
      const jsonMatch = scanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scanData = JSON.parse(jsonMatch[0]);
        console.log("[transmute] Scan data parsed. Menu items:", scanData?.ui?.navigation?.sidebar?.items?.length || 0);
      }
    } catch (e) {
      console.error("[transmute] Failed to parse scan JSON:", e);
    }
    
    if (!scanData) {
      return { success: false, error: "Failed to extract structured data from video" };
    }
    
    // ════════════════════════════════════════════════════════════════
    // PHASE 2: ASSEMBLER - Generate code from SCAN DATA ONLY
    // ════════════════════════════════════════════════════════════════
    console.log("[transmute] Phase 2: Starting code assembly (NO VIDEO)...");
    
    const assemblerModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 100000,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 16384 },
      },
    });
    
    // Build assembler prompt
    let assemblerPrompt = ASSEMBLER_PROMPT;
    
    if (styleDirective) {
      assemblerPrompt += `\n\n**STYLE DIRECTIVE:**\n${styleDirective}`;
    }
    
    if (databaseContext) {
      assemblerPrompt += `\n\n**DATABASE CONTEXT:**\n${databaseContext}`;
    }
    
    const menuCount = scanData?.ui?.navigation?.sidebar?.items?.length || 0;
    const metricCount = scanData?.data?.metrics?.length || 0;
    const chartCount = scanData?.data?.charts?.length || 0;
    const tableCount = scanData?.data?.tables?.length || 0;
    
    assemblerPrompt += `\n\n**═══════════════════════════════════════════════════════════════**
**SCAN DATA (Source of Truth - USE THIS DATA ONLY):**
**═══════════════════════════════════════════════════════════════**

\`\`\`json
${JSON.stringify(scanData, null, 2)}
\`\`\`

**ASSEMBLY INSTRUCTIONS:**
1. Build sidebar with EXACTLY ${menuCount} menu items
2. Create ${metricCount} metric cards with EXACT values
3. Create ${chartCount} charts using Recharts
4. Create ${tableCount} tables with all rows
5. Use colors from scanData.ui.colors

Generate the complete HTML file now:`;
    
    // CRITICAL: Only send TEXT to assembler - no video!
    const assemblyResult = await assemblerModel.generateContent([
      { text: assemblerPrompt }
    ]);
    
    const assemblyText = assemblyResult.response.text();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[transmute] Phase 2 complete in ${duration}s`);
    
    // Extract code
    let code = extractCodeFromResponse(assemblyText);
    if (!code) {
      return { success: false, error: "Failed to extract valid HTML code" };
    }
    
    code = fixBrokenImageUrls(code);
    
    // Get token usage
    const usageMetadata = assemblyResult.response.usageMetadata;
    const tokenUsage = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount || 0,
      candidatesTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : undefined;
    
    console.log("[transmute] Success! Code length:", code.length);
    
    return {
      success: true,
      code,
      scanData,
      tokenUsage,
    };
    
  } catch (error: any) {
    console.error("[transmute] Error:", error?.message || error);
    return { success: false, error: error?.message || "Generation failed" };
  }
}

// ============================================================================
// EDIT CODE FUNCTION
// ============================================================================

export async function editCode(
  currentCode: string,
  instruction: string,
  previousHistory: { role: string; content: string }[] = []
): Promise<EditResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 100000,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 4096 },
      },
    });

    const prompt = `You are a code editor. Apply the following instruction to the code.

INSTRUCTION: ${instruction}

CURRENT CODE:
\`\`\`html
${currentCode}
\`\`\`

Return the COMPLETE modified code wrapped in \`\`\`html blocks.
Make only the requested changes, preserve everything else.`;

    const result = await model.generateContent([{ text: prompt }]);
    const responseText = result.response.text();

    const code = extractCodeFromResponse(responseText);
    if (!code) {
      return { success: false, error: "Failed to extract modified code" };
    }

    return { success: true, code };
  } catch (error: any) {
    return { success: false, error: error?.message || "Edit failed" };
  }
}
