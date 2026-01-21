import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildEnterprisePrompt } from "@/lib/enterprise-prompt";

export const runtime = "nodejs";
export const maxDuration = 300;

// Get API key
function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// Fix broken image URLs - replace ALL external images with picsum
function fixBrokenImageUrls(code: string): string {
  if (!code) return code;
  
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 130, 131, 133, 134, 137, 139, 140, 141, 142, 143, 144, 145, 146, 147, 149, 152, 153, 154, 155, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 206, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 247, 248, 249, 250];
  let imageCounter = 0;
  
  const getNextPicsumUrl = (width = 800, height = 600) => {
    const id = validPicsumIds[imageCounter % validPicsumIds.length];
    imageCounter++;
    return `https://picsum.photos/id/${id}/${width}/${height}`;
  };
  
  let replacedCount = 0;
  
  code = code.replace(/https?:\/\/[^"'\s)]*unsplash[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/[^"'\s)]*pexels[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/via\.placeholder\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placehold\.co[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placeholder\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/dummyimage\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  
  console.log(`[fixBrokenImageUrls] Replaced ${replacedCount} image URLs`);
  return code;
}

// Extract code from Gemini response
function extractCodeFromResponse(response: string): string | null {
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.trim();
  
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) return htmlMatch[1].trim();
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 100) return codeMatch[1].trim();
  
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  const htmlTagMatch = cleaned.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) return htmlTagMatch[1].trim();
  
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.toLowerCase().startsWith('<html')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
    return cleaned;
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PASS PIPELINE v2.0
// Phase 1: UNIFIED SCAN - Extract EVERYTHING from video (UI, Data, Behavior)
// Phase 2: ASSEMBLER - Generate code from JSON data ONLY (no video!)
// ═══════════════════════════════════════════════════════════════════════════════

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
    "userJourney": [
      {
        "timestamp": "00:05",
        "action": "click",
        "target": "element clicked",
        "result": "what happened"
      }
    ],
    "loadingStates": [
      {
        "component": "table",
        "indicator": "skeleton",
        "duration": "2s"
      }
    ],
    "validations": [
      {
        "field": "email",
        "rule": "email format",
        "errorMessage": "Invalid email"
      }
    ]
  }
}

**VALIDATION CHECKLIST:**
- Every menu item counted and listed
- Every metric card captured with exact values
- Every table column and row extracted
- Chart data estimated from visual axis reading
- All colors sampled as hex values

Analyze the video and extract EVERYTHING:`;

// ═══════════════════════════════════════════════════════════════════════════════
// ASSEMBLER PROMPT - Generates code from SCAN DATA ONLY (no video!)
// ═══════════════════════════════════════════════════════════════════════════════

const ASSEMBLER_PROMPT = `You are a CODE ASSEMBLER for the Replay.build system.

**YOUR ROLE:** Generate React code from STRUCTURED DATA. You do NOT see video - only JSON.

**MANDATORY TECH STACK (Pre-installed):**

1. **RECHARTS** - ALL charts MUST use Recharts components:
   - AreaChart with gradient fill for area charts
   - BarChart with rounded corners for bar charts
   - LineChart for line charts
   - PieChart for pie/donut charts

2. **LUCIDE ICONS** - ALL icons via lucide global:
   - Use the Icon component helper provided

3. **TAILWIND CSS** - ALL styling via Tailwind:
   - Use exact colors from scanData.ui.colors
   - Use grid-cols-12 for layout

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
        // React hooks
        const { useState, useEffect, useRef } = React;
        
        // CRITICAL: Recharts is loaded via UMD, MUST access via window.Recharts
        const RechartsLib = window.Recharts;
        const { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie,
                XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } = RechartsLib;

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

        // YOUR COMPONENTS HERE - Use SCAN_DATA to populate

        const App = () => {
            // Build UI from SCAN_DATA
            return (
                <div>
                    {/* Sidebar with EXACT menu items from scanData.ui.navigation.sidebar.items */}
                    {/* Metric cards with EXACT values from scanData.data.metrics */}
                    {/* Charts using Recharts with data from scanData.data.charts */}
                    {/* Tables with data from scanData.data.tables */}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
\`\`\`

**CRITICAL RULES:**
1. Use EXACT menu items from scanData - do not invent!
2. Use EXACT values from metrics - do not round or change!
3. Use EXACT colors from scanData.ui.colors
4. Charts MUST use Recharts (no manual SVG!)
5. Tables must have all rows from scanData

Generate complete HTML using the provided SCAN_DATA:`;

export async function POST(request: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { videoBase64, mimeType, styleDirective, databaseContext, styleReferenceImage, enterprisePresetId, enterpriseMode } = body;

    if (!videoBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing video data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Phase 1: SCANNER - Extract everything from video
    const scannerModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.1, // Low for accuracy
        maxOutputTokens: 16384,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 8192 },
      },
    });
    
    // Phase 2: ASSEMBLER - Generate code from data (no video!)
    const assemblerModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.3, // Slightly higher for code creativity
        maxOutputTokens: 100000,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 16384 },
      },
    });
    
    // Timeout helper
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs/1000}s`)), timeoutMs)
        )
      ]);
    };

    console.log("[stream] MULTI-PASS PIPELINE v2.0 - Starting...");
    const startTime = Date.now();
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ════════════════════════════════════════════════════════════════
          // PHASE 1: UNIFIED SCAN - Extract everything from video
          // ════════════════════════════════════════════════════════════════
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "scanning",
            message: "🔍 Phase 1: Scanning UI structure, data, and behavior...",
            progress: 5
          })}\n\n`));
          
          console.log("[stream] Phase 1: Starting unified scan...");
          
          const scanResult = await withTimeout(
            scannerModel.generateContent([
              { text: UNIFIED_SCAN_PROMPT },
              { inlineData: { mimeType, data: videoBase64 } },
            ]),
            150000, // 150 second timeout
            "Phase 1 Unified Scan"
          );
          
          const scanText = scanResult.response.text();
          console.log("[stream] Phase 1 complete. Scan length:", scanText.length);
          
          // Parse scan data
          let scanData: any = null;
          try {
            const jsonMatch = scanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              scanData = JSON.parse(jsonMatch[0]);
              console.log("[stream] Parsed scan data successfully");
              console.log("[stream] Menu items found:", scanData?.ui?.navigation?.sidebar?.items?.length || 0);
              console.log("[stream] Metrics found:", scanData?.data?.metrics?.length || 0);
              console.log("[stream] Tables found:", scanData?.data?.tables?.length || 0);
              console.log("[stream] Charts found:", scanData?.data?.charts?.length || 0);
            }
          } catch (e) {
            console.error("[stream] Failed to parse scan JSON:", e);
          }
          
          if (!scanData) {
            throw new Error("Failed to extract structured data from video");
          }
          
          // Send scan summary
          const menuCount = scanData?.ui?.navigation?.sidebar?.items?.length || 0;
          const metricCount = scanData?.data?.metrics?.length || 0;
          const tableCount = scanData?.data?.tables?.length || 0;
          const chartCount = scanData?.data?.charts?.length || 0;
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "scanned",
            message: `✅ Extracted: ${menuCount} menu items | ${metricCount} metrics | ${chartCount} charts | ${tableCount} tables`,
            progress: 30,
            scanData: {
              menuItems: menuCount,
              metrics: metricCount,
              charts: chartCount,
              tables: tableCount,
              colors: scanData?.ui?.colors,
              logo: scanData?.ui?.navigation?.sidebar?.logo?.text
            }
          })}\n\n`));
          
          // ════════════════════════════════════════════════════════════════
          // PHASE 2: ASSEMBLER - Generate code from SCAN DATA ONLY
          // KEY: We do NOT send the video again! Only the JSON data.
          // ════════════════════════════════════════════════════════════════
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "assembling",
            message: "🛠️ Phase 2: Assembling code from extracted data...",
            progress: 35
          })}\n\n`));

          // Build assembler prompt with scan data
          let assemblerPrompt = ASSEMBLER_PROMPT;
          
          // Add enterprise styling if applicable
          if (enterpriseMode && enterprisePresetId) {
            const enterprisePrompt = buildEnterprisePrompt(enterprisePresetId, styleDirective, databaseContext);
            assemblerPrompt += `\n\n**ENTERPRISE STYLING:**\n${enterprisePrompt}`;
          } else if (styleDirective) {
            assemblerPrompt += `\n\n**STYLE DIRECTIVE:**\n${styleDirective}`;
          }
          
          if (databaseContext) {
            assemblerPrompt += `\n\n**DATABASE CONTEXT:**\n${databaseContext}`;
          }
          
          // Inject the scan data
          assemblerPrompt += `\n\n**═══════════════════════════════════════════════════════════════**
**SCAN DATA (Source of Truth - USE THIS DATA ONLY):**
**═══════════════════════════════════════════════════════════════**

\`\`\`json
${JSON.stringify(scanData, null, 2)}
\`\`\`

**ASSEMBLY INSTRUCTIONS:**
1. Build sidebar with EXACTLY ${menuCount} menu items from scanData.ui.navigation.sidebar.items
2. Create ${metricCount} metric cards with EXACT values from scanData.data.metrics
3. Create ${chartCount} charts using Recharts with data from scanData.data.charts
4. Create ${tableCount} tables with all rows from scanData.data.tables
5. Use colors from scanData.ui.colors (background: ${scanData?.ui?.colors?.background || '#0a0a0a'})

Generate the complete HTML file now. Return it wrapped in \`\`\`html blocks.`;

          console.log("[stream] Phase 2: Starting code assembly (NO VIDEO - only scan data)...");
          
          // CRITICAL: We only send TEXT to the assembler - no video!
          const assemblyResult = await withTimeout(
            assemblerModel.generateContentStream([
              { text: assemblerPrompt }
            ]),
            180000, // 180 second timeout
            "Phase 2 Code Assembly"
          );
          
          let fullText = "";
          let chunkCount = 0;
          let codeStarted = false;
          
          for await (const chunk of assemblyResult.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            chunkCount++;
            
            if (!codeStarted && (fullText.includes("```html") || fullText.includes("<!DOCTYPE"))) {
              codeStarted = true;
            }
            
            const estimatedProgress = codeStarted 
              ? Math.min(35 + Math.floor((fullText.length / 40000) * 55), 90)
              : 40;
            
            const lineCount = (fullText.match(/\n/g) || []).length;
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: "chunk", 
              content: chunkText,
              chunkIndex: chunkCount,
              totalLength: fullText.length,
              lineCount: lineCount,
              progress: estimatedProgress
            })}\n\n`));
          }
          
          const finalResponse = await assemblyResult.response;
          const usageMetadata = finalResponse.usageMetadata;
          
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`[stream] Completed in ${duration}s`);
          
          let cleanCode = extractCodeFromResponse(fullText);
          
          if (!cleanCode) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: "error", 
              error: "Failed to extract valid HTML code from AI response" 
            })}\n\n`));
            controller.close();
            return;
          }
          
          cleanCode = fixBrokenImageUrls(cleanCode);
          
          // Validation: Check if menu items are present
          const menuItemsInCode = scanData?.ui?.navigation?.sidebar?.items?.filter((item: any) => 
            item.label && cleanCode.includes(item.label)
          ).length || 0;
          
          const validationWarning = menuItemsInCode < menuCount * 0.8 
            ? `Warning: Only ${menuItemsInCode}/${menuCount} menu items found in output`
            : null;
          
          if (validationWarning) {
            console.log(`[stream] VALIDATION WARNING: ${validationWarning}`);
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "complete",
            code: cleanCode,
            scanData,
            validationWarning,
            validation: {
              menuItemsExpected: menuCount,
              menuItemsFound: menuItemsInCode,
              metricsExpected: metricCount,
              chartsExpected: chartCount,
              tablesExpected: tableCount
            },
            tokenUsage: usageMetadata ? {
              promptTokens: usageMetadata.promptTokenCount || 0,
              candidatesTokens: usageMetadata.candidatesTokenCount || 0,
              totalTokens: usageMetadata.totalTokenCount || 0,
            } : null,
            duration: parseFloat(duration),
            totalLength: cleanCode.length,
            progress: 100
          })}\n\n`));
          
          controller.close();
          
        } catch (error: any) {
          console.error("[stream] Error during streaming:", error?.message || error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "error", 
            error: error?.message || "Streaming failed" 
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[stream] Setup error:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to start generation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
