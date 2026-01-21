import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VIDEO_TO_CODE_SYSTEM_PROMPT, buildStylePrompt } from "@/lib/prompts/system-prompt";
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
  const validIdSet = new Set(validPicsumIds);
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
  code = code.replace(/https?:\/\/placekitten\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/loremflickr\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/lorempixel\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placeimg\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placeholderimage[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/res\.cloudinary\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  
  code = code.replace(/https?:\/\/picsum\.photos\/id\/(\d+)\/(\d+)(?:\/(\d+))?/gi, (match, idStr, w, h) => {
    const id = parseInt(idStr);
    if (validIdSet.has(id)) return match;
    replacedCount++;
    return getNextPicsumUrl(parseInt(w) || 800, parseInt(h) || parseInt(w) || 600);
  });
  
  code = code.replace(/https?:\/\/picsum\.photos\/(\d+)(?:\/(\d+))?(?:\?[^"'\s)]*)?(?=["'\s)])/gi, (match, w, h) => {
    if (match.includes('/id/')) return match;
    replacedCount++;
    return getNextPicsumUrl(parseInt(w) || 800, parseInt(h) || parseInt(w) || 600);
  });
  
  code = code.replace(/src\s*=\s*["'](?:\s*|#|about:blank|javascript:[^"']*)["']/gi, () => {
    replacedCount++;
    return `src="${getNextPicsumUrl()}"`;
  });
  
  code = code.replace(/<img\s+(?![^>]*src=)[^>]*>/gi, (match) => {
    replacedCount++;
    return match.replace(/<img/, `<img src="${getNextPicsumUrl()}"`);
  });
  
  console.log(`[fixBrokenImageUrls] Replaced ${replacedCount} image URLs`);
  
  return code;
}

// Extract code from Gemini response
function extractCodeFromResponse(response: string): string | null {
  let cleaned = response.trim();
  
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.trim();
  
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) {
    return htmlMatch[1].trim();
  }
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 100) {
    return codeMatch[1].trim();
  }
  
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  const htmlTagMatch = cleaned.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) return htmlTagMatch[1].trim();
  
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.toLowerCase().startsWith('<html')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
    return cleaned;
  }
  
  const htmlStartIndex = cleaned.search(/<(!DOCTYPE|html)/i);
  if (htmlStartIndex >= 0) {
    const htmlContent = cleaned.substring(htmlStartIndex);
    const endIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return htmlContent.substring(0, endIndex + 7);
  }
  
  return null;
}

// ============================================================================
// GEMINI 3 PRO - 5-PHASE VIDEO ANALYSIS PROMPT
// Native Multimodal Vision for Pixel-Perfect Reconstruction
// ============================================================================

const GEMINI3_PRO_ANALYSIS_PROMPT = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  GEMINI 3 PRO - NATIVE VISION ANALYSIS PROTOCOL                             ║
║  Extract ALL visual data with PIXEL-PERFECT accuracy                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

**YOU ARE GEMINI 3 PRO.**
Your native multimodal vision can perceive:
- Exact HEX color values from pixels
- Text character by character
- Layout measurements
- UI component types

You do NOT guess. You do NOT approximate. You EXTRACT.

═══════════════════════════════════════════════════════════════════════════════
EXECUTE 5-PHASE ANALYSIS:
═══════════════════════════════════════════════════════════════════════════════

🔴 PHASE 1: COLOR TELEMETRY
─────────────────────────────
Sample pixels and report EXACT colors:
- background_color: What is the main background? (sample center)
- sidebar_color: What color is the sidebar?
- card_color: What color are the cards/panels?
- primary_color: What is the accent/brand color?
- text_primary: Main text color
- text_secondary: Secondary/muted text color
- is_dark_mode: true/false (is background dark?)

⚠️ CRITICAL: If background looks dark, DO NOT report #ffffff!
Dark backgrounds are typically: #0B1120, #09090b, #0a0a0a, #18181b, #1f2937
Light backgrounds are typically: #ffffff, #f9fafb, #f3f4f6

🟠 PHASE 2: TEXT EXTRACTION (OCR)
─────────────────────────────────
Read EVERY visible text:

1. app_name: EXACT logo/brand text (top-left)
   - Read letter by letter
   - ⚠️ DO NOT output: "PayDash", "NexusPay", "StripeClone", "FinanceHub"
   - These are HALLUCINATIONS! Read EXACTLY what you see!

2. menu_items: Array of EVERY navigation item in EXACT order
   - Include all sidebar/header menu items
   - Preserve original language (don't translate)
   - Preserve exact case

3. page_title: Main heading on current view

4. card_titles: All card/section titles

5. data_labels: All labels for metrics (e.g., "Gross volume", "Net revenue")

6. data_values: ALL numbers with EXACT formatting
   - Currency symbols and positions: "PLN 403.47" vs "403.47 PLN" vs "$403.47"
   - Percentages with signs: "+81%" vs "81%"
   - Exact decimal places

7. table_headers: Column headers if table present

8. button_texts: All button labels

9. other_texts: Any other visible text

🟡 PHASE 3: LAYOUT STRUCTURE
─────────────────────────────────
Map the spatial arrangement:

1. sidebar_width: Estimated width in pixels (240/256/280/320)
2. header_height: Top header height in pixels
3. grid_columns: How many columns in main content (typically 12-col grid)
4. card_grid: Card arrangement (e.g., "4 cards in row" = col-span-3)
5. spacing: Padding/gap estimation (tight=p-4, normal=p-6, generous=p-8)

🟢 PHASE 4: COMPONENT IDENTIFICATION
─────────────────────────────────
List UI components present:

1. chart_types: What chart types? ("area chart", "bar chart", "line chart", "donut")
2. table_present: Is there a data table?
3. stat_cards: How many stat/metric cards?
4. input_fields: Any form inputs?
5. avatars: User avatars present?
6. badges: Status badges/tags?

🔵 PHASE 5: VERIFICATION
─────────────────────────────────
Confirm accuracy:

1. confidence_app_name: How confident are you about the app name? (high/medium/low)
2. unclear_elements: List anything you couldn't read clearly

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON):
═══════════════════════════════════════════════════════════════════════════════

{
  "colors": {
    "background": "#hex",
    "sidebar": "#hex",
    "card": "#hex",
    "primary": "#hex",
    "text_primary": "#hex",
    "text_secondary": "#hex",
    "is_dark_mode": true/false
  },
  "text": {
    "app_name": "EXACT text from logo",
    "menu_items": ["Item1", "Item2", ...],
    "page_title": "...",
    "card_titles": ["...", "..."],
    "data_labels": ["...", "..."],
    "data_values": ["...", "..."],
    "table_headers": ["...", "..."],
    "button_texts": ["...", "..."],
    "other_texts": ["...", "..."]
  },
  "layout": {
    "sidebar_width": 256,
    "header_height": 64,
    "grid_columns": 12,
    "card_grid": "col-span-3",
    "spacing": "p-6"
  },
  "components": {
    "chart_types": ["area chart"],
    "table_present": false,
    "stat_cards": 4,
    "input_fields": [],
    "avatars": true,
    "badges": ["active", "pending"]
  },
  "verification": {
    "confidence_app_name": "high",
    "unclear_elements": []
  }
}

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL REMINDERS:
═══════════════════════════════════════════════════════════════════════════════

1. Read EXACTLY what you see - no interpretation!
2. If app_name is unclear, mark it as "[unclear]" - DO NOT GUESS!
3. NEVER output: PayDash, NexusPay, StripeClone, FinanceHub, MyApp, DashboardApp
4. These names DO NOT EXIST in any video - they are HALLUCINATIONS!
5. Preserve original language - DO NOT translate menu items!

EXECUTE ANALYSIS NOW.
`;

// ============================================================================
// STREAMING VIDEO TO CODE GENERATION (2-PHASE)
// Phase 1: Gemini 3 Pro Vision Analysis
// Phase 2: Code Generation with Extracted Data
// ============================================================================

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

    // Initialize Gemini 3 Pro
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Phase 1: GEMINI 3 PRO - Vision Analysis Model (low temperature for precision)
    const analysisModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.1, // Very low for accurate OCR
        maxOutputTokens: 8192,
      },
    });
    
    // Phase 2: GEMINI 3 PRO - Code Generation Model
    const generationModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: enterpriseMode ? 0.2 : 0.4, // Lower for enterprise precision
        maxOutputTokens: 100000,
      },
    });

    console.log("[stream] GEMINI 3 PRO - Starting 2-phase visual compilation...");
    const startTime = Date.now();

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ============================================================
          // PHASE 1: Gemini 3 Pro Native Vision Analysis
          // ============================================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "analyzing",
            message: "🔍 Phase 1: GEMINI 3 PRO Native Vision Analysis...",
            progress: 5
          })}\n\n`));
          
          console.log("[stream] Phase 1: Starting 5-phase visual analysis...");
          
          const analysisResult = await analysisModel.generateContent([
            { text: GEMINI3_PRO_ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType,
                data: videoBase64,
              },
            },
          ]);
          
          const analysisText = analysisResult.response.text();
          console.log("[stream] Phase 1 complete. Raw analysis:", analysisText.substring(0, 1000));
          
          // Parse the analysis JSON
          let extractedData: any = {
            colors: { is_dark_mode: false },
            text: { app_name: "", menu_items: [] },
            layout: {},
            components: {},
            verification: {}
          };
          
          try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              extractedData = JSON.parse(jsonMatch[0]);
              console.log("[stream] Parsed analysis data:", JSON.stringify(extractedData, null, 2).substring(0, 500));
            }
          } catch (e) {
            console.log("[stream] JSON parse failed, extracting manually...");
            // Try to extract key data manually from the text
            const appNameMatch = analysisText.match(/app_name["\s:]+([^",\n]+)/i);
            if (appNameMatch) extractedData.text.app_name = appNameMatch[1].trim();
            
            const menuMatch = analysisText.match(/menu_items["\s:\[]+([^\]]+)/i);
            if (menuMatch) {
              extractedData.text.menu_items = menuMatch[1]
                .split(',')
                .map((s: string) => s.replace(/["\s]/g, '').trim())
                .filter((s: string) => s.length > 0);
            }
          }
          
          // Validate app_name - reject known hallucinations
          const hallucinations = ['paydash', 'nexuspay', 'stripeclone', 'financehub', 'dashboardapp', 'myapp'];
          if (extractedData.text?.app_name && hallucinations.includes(extractedData.text.app_name.toLowerCase())) {
            console.log(`[stream] HALLUCINATION DETECTED: "${extractedData.text.app_name}" - clearing!`);
            extractedData.text.app_name = "[from video]";
            extractedData.verification = { ...extractedData.verification, hallucination_detected: true };
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "analyzed",
            message: `✅ Extracted: "${extractedData.text?.app_name || 'app'}" | ${extractedData.text?.menu_items?.length || 0} menu items | ${extractedData.colors?.is_dark_mode ? 'Dark' : 'Light'} mode`,
            progress: 15,
            extractedData
          })}\n\n`));
          
          // ============================================================
          // PHASE 2: Code Generation with MANDATORY extracted data
          // ============================================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "generating",
            message: "🧠 Phase 2: Generating pixel-perfect code...",
            progress: 20
          })}\n\n`));

          // Build the generation prompt
          let fullPrompt: string;
          
          if (enterpriseMode && enterprisePresetId) {
            fullPrompt = buildEnterprisePrompt(enterprisePresetId, styleDirective, databaseContext);
          } else {
            fullPrompt = VIDEO_TO_CODE_SYSTEM_PROMPT;
            fullPrompt += buildStylePrompt(styleDirective);
          }
          
          // CRITICAL: Inject the extracted data as MANDATORY constraints
          fullPrompt += `

╔══════════════════════════════════════════════════════════════════════════════╗
║  🔒 MANDATORY EXTRACTED DATA - USE THESE VALUES EXACTLY!                     ║
║  This data was extracted by GEMINI 3 PRO Native Vision                       ║
║  DO NOT CHANGE, DO NOT "IMPROVE", DO NOT HALLUCINATE!                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

${JSON.stringify(extractedData, null, 2)}

═══════════════════════════════════════════════════════════════════════════════
⚠️ STRICT USAGE RULES:
═══════════════════════════════════════════════════════════════════════════════

1. APP NAME: Use EXACTLY "${extractedData.text?.app_name || '[from video]'}"
   - Put this in the logo/header area
   - DO NOT change it to PayDash, NexusPay, StripeClone, etc.!
   - If it says "[from video]" or "[unclear]", leave a placeholder: "App"

2. MENU ITEMS: Use EXACTLY these items in EXACT order:
   ${JSON.stringify(extractedData.text?.menu_items || [], null, 2)}
   - DO NOT add items that aren't in this list!
   - DO NOT remove any items!
   - DO NOT change the order!
   - DO NOT translate!

3. COLOR SCHEME: ${extractedData.colors?.is_dark_mode ? 'DARK MODE' : 'LIGHT MODE'}
   - Background: ${extractedData.colors?.background || (extractedData.colors?.is_dark_mode ? '#0a0a0a' : '#ffffff')}
   - Sidebar: ${extractedData.colors?.sidebar || extractedData.colors?.background || '#18181b'}
   - Primary: ${extractedData.colors?.primary || '#6366f1'}
   - ${extractedData.colors?.is_dark_mode ? 'USE: bg-zinc-950, bg-zinc-900, text-white' : 'USE: bg-white, bg-gray-50, text-gray-900'}

4. DATA VALUES: Use EXACTLY these numbers/amounts:
   ${JSON.stringify(extractedData.text?.data_values || [], null, 2)}
   - Keep EXACT formatting (currency position, decimals, signs)

5. LAYOUT:
   - Sidebar width: ${extractedData.layout?.sidebar_width || 256}px (use w-64 for 256px)
   - Card grid: ${extractedData.layout?.card_grid || 'col-span-3'} (4 cards per row)
   - Spacing: ${extractedData.layout?.spacing || 'p-6'}

═══════════════════════════════════════════════════════════════════════════════
🚨 FINAL REMINDER - DO NOT HALLUCINATE!
═══════════════════════════════════════════════════════════════════════════════

The extracted data above is your ONLY source of truth.
If something is not in the extracted data → DO NOT ADD IT!

❌ Do NOT add "TEST MODE" badge
❌ Do NOT add menu items that weren't extracted
❌ Do NOT change the app name
❌ Do NOT invent data values
❌ Do NOT import from recharts or lucide-react

GENERATE THE CODE NOW using ONLY the extracted data above.
Return valid HTML wrapped in \`\`\`html code blocks.
`;

          if (databaseContext && !enterpriseMode) {
            fullPrompt += `\n\n📊 ADDITIONAL DATABASE CONTEXT:\n${databaseContext}\n`;
          }

          // Build parts array for generation
          const parts: any[] = [
            { text: fullPrompt },
            {
              inlineData: {
                mimeType,
                data: videoBase64,
              },
            },
          ];

          // Add style reference image if provided
          if (styleReferenceImage?.base64) {
            parts.push({
              inlineData: {
                mimeType: styleReferenceImage.mimeType || "image/png",
                data: styleReferenceImage.base64,
              },
            });
            parts.push({ text: "Use this image for COLOR PALETTE reference only, not content." });
          }

          // Stream the code generation
          console.log("[stream] Phase 2: Starting code generation stream...");
          const result = await generationModel.generateContentStream(parts);
          
          let fullText = "";
          let chunkCount = 0;
          let codeStarted = false;
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            chunkCount++;
            
            if (!codeStarted && (fullText.includes("```html") || fullText.includes("<!DOCTYPE"))) {
              codeStarted = true;
            }
            
            const estimatedProgress = codeStarted 
              ? Math.min(20 + Math.floor((fullText.length / 30000) * 70), 90)
              : 25;
            
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
          
          const finalResponse = await result.response;
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
          
          // Final hallucination check
          const finalHallucinationCheck = ['PayDash', 'NexusPay', 'StripeClone', 'FinanceHub'];
          let hallucinationWarning = null;
          for (const h of finalHallucinationCheck) {
            if (cleanCode.includes(h)) {
              hallucinationWarning = `Warning: Output contains "${h}" which may be a hallucination`;
              console.log(`[stream] HALLUCINATION WARNING: ${h} found in output!`);
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "complete",
            code: cleanCode,
            extractedData,
            hallucinationWarning,
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
