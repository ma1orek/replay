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
// GEMINI 3 PRO - VIBE ANALYSIS PROMPT
// Native Vision for Visual Essence Extraction
// ============================================================================

const GEMINI3_PRO_ANALYSIS_PROMPT = `
**GEMINI 3 PRO - VISUAL ESSENCE EXTRACTION**

You are a Visual Compiler. Look at this video and extract its essence.

**VIBE CHECK:**
1. What is the overall "feel"? (Dense dashboard? Airy marketing? Professional SaaS?)
2. Is it dark mode or light mode?
3. What's the color temperature? (Cool blues? Warm oranges? Neutral grays?)

**DATA EXTRACTION (Copy exactly, character-for-character):**
1. app_name: The logo/brand text (top-left corner usually)
2. menu_items: All navigation items in exact order
3. data_values: All numbers, prices, percentages with exact formatting
4. page_title: Main heading
5. card_titles: Section/card headers
6. button_texts: All button labels

**VISUAL COMPONENTS:**
1. chart_types: What charts are visible? (area, bar, line, pie, donut)
2. has_sidebar: true/false
3. has_table: true/false
4. color_scheme: dark/light
5. primary_color: Main accent color (approximate hex)

**OUTPUT (JSON):**
{
  "vibe": "dense-financial" | "modern-saas" | "marketing" | "admin-panel" | "e-commerce",
  "colors": {
    "is_dark_mode": true/false,
    "background": "#hex",
    "primary": "#hex"
  },
  "text": {
    "app_name": "EXACT text",
    "menu_items": ["Item1", "Item2"],
    "page_title": "...",
    "card_titles": ["..."],
    "data_values": ["$1,234.56", "+12.5%", "..."],
    "button_texts": ["..."]
  },
  "components": {
    "chart_types": ["area"],
    "has_sidebar": true,
    "has_table": false
  }
}

**RULES:**
- Copy text EXACTLY as you see it (don't invent names!)
- Preserve original language (don't translate!)
- If unclear, write "[unclear]" - don't guess!
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

    // Initialize Gemini 3 Pro with VIBE CODING configuration
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Phase 1: GEMINI 3 PRO - Vision Analysis Model
    // Uses high thinking level for deep visual reasoning
    const analysisModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.2, // Slightly higher for vibe understanding
        maxOutputTokens: 8192,
        // @ts-ignore - Gemini 3 Pro specific parameters
        thinkingConfig: { thinkingBudget: 8192 }, // Enable deep reasoning
      },
    });
    
    // Phase 2: GEMINI 3 PRO - Code Generation Model (VIBE CODING)
    // temperature 0.4 = perfect balance for creative yet accurate code
    const generationModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.4, // Vibe Coding needs some creative flexibility
        maxOutputTokens: 100000,
        // @ts-ignore - Gemini 3 Pro specific parameters  
        thinkingConfig: { thinkingBudget: 24576 }, // Maximum deep reasoning for architecture
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
          
          // Inject extracted data for the generation phase
          fullPrompt += `

**EXTRACTED VISUAL DATA (from Phase 1):**
${JSON.stringify(extractedData, null, 2)}

**VIBE: ${extractedData.vibe || 'professional-dashboard'}**
${extractedData.colors?.is_dark_mode ? '→ Dark mode detected: Use bg-zinc-950, bg-zinc-900, text-white' : '→ Light mode detected: Use bg-white, bg-gray-50, text-gray-900'}

**DATA TO USE (copy exactly):**
- App Name: "${extractedData.text?.app_name || '[read from video]'}"
- Menu Items: ${JSON.stringify(extractedData.text?.menu_items || [])}
- Data Values: ${JSON.stringify(extractedData.text?.data_values || [])}

**THE ONE RULE:** Copy data exactly. Interpret design freely.

Generate the code now. Return valid HTML wrapped in \`\`\`html blocks.
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
