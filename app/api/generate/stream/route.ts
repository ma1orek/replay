import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VIDEO_TO_CODE_SYSTEM_PROMPT, buildStylePrompt } from "@/lib/prompts/system-prompt";
import { buildEnterprisePrompt, ENTERPRISE_SYSTEM_PROMPT } from "@/lib/enterprise-prompt";
import { ENTERPRISE_PRESETS } from "@/lib/enterprise-presets";

export const runtime = "nodejs";
export const maxDuration = 300;

// Get API key
function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// Fix broken image URLs - replace ALL external images with picsum
function fixBrokenImageUrls(code: string): string {
  if (!code) return code;
  
  // VERIFIED working picsum IDs
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 130, 131, 133, 134, 137, 139, 140, 141, 142, 143, 144, 145, 146, 147, 149, 152, 153, 154, 155, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 206, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 247, 248, 249, 250];
  const validIdSet = new Set(validPicsumIds);
  let imageCounter = 0;
  
  const getNextPicsumUrl = (width = 800, height = 600) => {
    const id = validPicsumIds[imageCounter % validPicsumIds.length];
    imageCounter++;
    return `https://picsum.photos/id/${id}/${width}/${height}`;
  };
  
  let replacedCount = 0;
  
  // AGGRESSIVE: Replace ANY unsplash URL (various formats)
  code = code.replace(/https?:\/\/[^"'\s)]*unsplash[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  
  // Replace Pexels
  code = code.replace(/https?:\/\/[^"'\s)]*pexels[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  
  // Replace all placeholder services
  code = code.replace(/https?:\/\/via\.placeholder\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placehold\.co[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placeholder\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/dummyimage\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placekitten\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/loremflickr\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/lorempixel\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placeimg\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  code = code.replace(/https?:\/\/placeholderimage[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  
  // Replace cloudinary (often broken)
  code = code.replace(/https?:\/\/res\.cloudinary\.com[^"'\s)]*/gi, () => { replacedCount++; return getNextPicsumUrl(); });
  
  // Fix picsum URLs with invalid IDs
  code = code.replace(/https?:\/\/picsum\.photos\/id\/(\d+)\/(\d+)(?:\/(\d+))?/gi, (match, idStr, w, h) => {
    const id = parseInt(idStr);
    if (validIdSet.has(id)) return match;
    replacedCount++;
    return getNextPicsumUrl(parseInt(w) || 800, parseInt(h) || parseInt(w) || 600);
  });
  
  // Fix picsum without /id/ format
  code = code.replace(/https?:\/\/picsum\.photos\/(\d+)(?:\/(\d+))?(?:\?[^"'\s)]*)?(?=["'\s)])/gi, (match, w, h) => {
    if (match.includes('/id/')) return match;
    replacedCount++;
    return getNextPicsumUrl(parseInt(w) || 800, parseInt(h) || parseInt(w) || 600);
  });
  
  // Fix empty/broken src attributes
  code = code.replace(/src\s*=\s*["'](?:\s*|#|about:blank|javascript:[^"']*)["']/gi, () => {
    replacedCount++;
    return `src="${getNextPicsumUrl()}"`;
  });
  
  // AGGRESSIVE: Find img tags without src or with empty src and add valid src
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
  
  // Remove common AI prefixes
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.trim();
  
  // Try code blocks first
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) {
    return htmlMatch[1].trim();
  }
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 100) {
    return codeMatch[1].trim();
  }
  
  // Try to find HTML directly
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  const htmlTagMatch = cleaned.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) return htmlTagMatch[1].trim();
  
  // If response starts with DOCTYPE or html
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.toLowerCase().startsWith('<html')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
    return cleaned;
  }
  
  // Last resort: find HTML anywhere
  const htmlStartIndex = cleaned.search(/<(!DOCTYPE|html)/i);
  if (htmlStartIndex >= 0) {
    const htmlContent = cleaned.substring(htmlStartIndex);
    const endIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return htmlContent.substring(0, endIndex + 7);
  }
  
  return null;
}

// ============================================================================
// PHASE 1: VIDEO ANALYSIS - Extract ALL text content before generation
// ============================================================================

const VIDEO_ANALYSIS_PROMPT = `
You are an OCR scanner. Your ONLY job is to extract ALL visible text from this video.

EXTRACT AND LIST:

1. **APP_NAME**: What is the name/logo text in the header? (top-left area)
   - Look at the logo area VERY carefully
   - Read the EXACT text character by character
   - If you see "Replay" write "Replay", if you see "Stripe" write "Stripe"
   - DO NOT guess or invent names like "PayDash", "NexusPay", "StripeClone"

2. **MENU_ITEMS**: List ALL sidebar/navigation menu items in EXACT order
   - Read each menu item text exactly as shown
   - Keep original language (don't translate)
   - Include the icon description if visible

3. **PAGE_TITLE**: Main heading/title on the current page

4. **CARD_TITLES**: All card/section titles visible

5. **DATA_LABELS**: All labels for data (e.g., "Gross volume", "Net volume")

6. **DATA_VALUES**: All numbers/amounts with exact formatting
   - Currency symbol and position (PLN 403.47 vs 403.47 PLN)
   - Percentage signs and values
   - Exact decimal places

7. **TABLE_HEADERS**: If there's a table, list all column headers

8. **BUTTON_TEXTS**: Text on all buttons

9. **OTHER_TEXT**: Any other visible text (dates, status labels, etc.)

10. **COLORS**: Describe the color scheme
    - Is the background DARK or LIGHT?
    - What is the primary accent color?
    - What color is the sidebar?

OUTPUT FORMAT (JSON):
{
  "app_name": "EXACT name from logo",
  "menu_items": ["Item 1", "Item 2", ...],
  "page_title": "...",
  "card_titles": ["...", "..."],
  "data_labels": ["...", "..."],
  "data_values": ["...", "..."],
  "table_headers": ["...", "..."],
  "button_texts": ["...", "..."],
  "other_text": ["...", "..."],
  "color_scheme": {
    "background": "dark/light",
    "sidebar": "...",
    "accent": "..."
  }
}

⚠️ CRITICAL:
- Read EXACTLY what you see, don't guess
- If you can't read something clearly, write "[unclear]"
- DO NOT invent names like "PayDash", "NexusPay", "FinanceHub"
- DO NOT add items that don't exist in the video
`;

// ============================================================================
// STREAMING VIDEO TO CODE GENERATION (2-PHASE)
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

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Phase 1 model - for video analysis (lower temp for accuracy)
    const analysisModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.1, // Very low for accurate extraction
        maxOutputTokens: 8000,
      },
    });
    
    // Phase 2 model - for code generation
    const generationModel = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: enterpriseMode ? 0.3 : 0.5,
        maxOutputTokens: 100000,
      },
    });

    console.log("[stream] Starting 2-phase generation...");
    const startTime = Date.now();

    // Create streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ============================================================
          // PHASE 1: Video Analysis - Extract all text
          // ============================================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "analyzing",
            message: "🔍 Phase 1: Scanning video for text content...",
            progress: 5
          })}\n\n`));
          
          const analysisResult = await analysisModel.generateContent([
            { text: VIDEO_ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType,
                data: videoBase64,
              },
            },
          ]);
          
          const analysisText = analysisResult.response.text();
          console.log("[stream] Phase 1 analysis complete:", analysisText.substring(0, 500));
          
          // Try to parse the analysis JSON
          let extractedData: any = {};
          try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              extractedData = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.log("[stream] Could not parse analysis JSON, using raw text");
            extractedData = { raw_analysis: analysisText };
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "analyzed",
            message: `✅ Found: "${extractedData.app_name || 'app'}" with ${extractedData.menu_items?.length || '?'} menu items`,
            progress: 15,
            extractedData
          })}\n\n`));
          
          // ============================================================
          // PHASE 2: Code Generation - Use extracted data
          // ============================================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "generating",
            message: "🧠 Phase 2: Generating code from extracted content...",
            progress: 20
          })}\n\n`));

          // Build the generation prompt with MANDATORY extracted data
          let fullPrompt: string;
          
          if (enterpriseMode && enterprisePresetId) {
            fullPrompt = buildEnterprisePrompt(enterprisePresetId, styleDirective, databaseContext);
          } else {
            fullPrompt = VIDEO_TO_CODE_SYSTEM_PROMPT;
            fullPrompt += buildStylePrompt(styleDirective);
          }
          
          // CRITICAL: Inject the extracted data
          fullPrompt += `

================================================================================
🔒 MANDATORY EXTRACTED DATA - USE ONLY THESE VALUES!
================================================================================

The following data was extracted directly from the video using OCR.
You MUST use these EXACT values. DO NOT change or "improve" them!

${JSON.stringify(extractedData, null, 2)}

================================================================================
⚠️ STRICT RULES FOR USING EXTRACTED DATA:
================================================================================

1. APP NAME: Use EXACTLY "${extractedData.app_name || '[from video]'}"
   - Put this in the logo/header
   - DO NOT change it to "PayDash", "NexusPay", or anything else!

2. MENU ITEMS: Use EXACTLY these items in this order:
   ${JSON.stringify(extractedData.menu_items || [])}
   - DO NOT add items that aren't in this list!
   - DO NOT remove any items!
   - DO NOT change the order!

3. DATA VALUES: Use EXACTLY these numbers/amounts:
   ${JSON.stringify(extractedData.data_values || [])}
   - Keep exact formatting (currency position, decimals)

4. COLOR SCHEME: ${JSON.stringify(extractedData.color_scheme || {})}
   - Use this to determine dark/light mode

================================================================================
`;

          if (databaseContext && !enterpriseMode) {
            fullPrompt += `\nDATABASE CONTEXT:\n${databaseContext}\n`;
          }
          
          fullPrompt += `

Now generate the complete HTML code using ONLY the extracted data above.
Return valid HTML wrapped in \`\`\`html code blocks.
`;

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
            parts.push({ text: "Use this image for COLOR SCHEME only, not content." });
          }

          // Stream the code generation
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
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "complete",
            code: cleanCode,
            extractedData,
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
