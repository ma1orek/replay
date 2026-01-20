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
// STREAMING VIDEO TO CODE GENERATION
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
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: enterpriseMode ? 0.5 : 0.7, // Lower temp for enterprise accuracy
        maxOutputTokens: 100000,
      },
    });

    // Build full prompt - use enterprise mode if preset selected
    let fullPrompt: string;
    
    if (enterpriseMode && enterprisePresetId) {
      // Enterprise mode: use new accuracy-focused prompt
      fullPrompt = buildEnterprisePrompt(
        enterprisePresetId,
        styleDirective, // Additional context
        databaseContext
      );
    } else {
      // Legacy mode: use original creative prompt
      fullPrompt = VIDEO_TO_CODE_SYSTEM_PROMPT;
      fullPrompt += buildStylePrompt(styleDirective);
    }
    
    // Add database context for legacy mode (enterprise mode includes it in buildEnterprisePrompt)
    if (databaseContext && !enterpriseMode) {
      fullPrompt += `

DATABASE CONTEXT (use this data in appropriate places):
${databaseContext}
`;
    }
    
    fullPrompt += `

================================================================================
🚨 FINAL OUTPUT INSTRUCTIONS - READ CAREFULLY! 🚨
================================================================================

Now analyze the video and generate the complete HTML code.

⚠️ CRITICAL OUTPUT FORMAT:
1. Return ONLY valid HTML code wrapped in \`\`\`html code blocks
2. The code must start with <!DOCTYPE html> and end with </html>
3. DO NOT output any JavaScript code as page TEXT CONTENT
4. DO NOT put code examples, variables, or function calls as visible text on the page
5. All JavaScript must be inside <script> tags, NOT as paragraph text
6. All page content must be readable text, images, buttons - NOT raw code

❌ WRONG (code as content):
<p>this.page = 'home'; Math.floor(Math.random() * 100);</p>

✅ CORRECT (actual content):
<p>Welcome to our amazing website with great features.</p>

Return clean, valid HTML that renders as a VISUAL webpage, not a code dump.
`;

    // Build parts array
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
      parts.push({ text: `
STYLE REFERENCE IMAGE INSTRUCTIONS:
Use this image ONLY as a visual style reference for:
- Color palette (extract dominant colors for backgrounds, text, accents)
- Typography style (font weights, sizes feel)
- Visual mood and aesthetic

⚠️ CRITICAL: 
- DO NOT put this image's content into the page
- DO NOT describe or reference this image in the output
- Generate the same HTML structure as the VIDEO shows
- Only apply the COLOR SCHEME and VISUAL STYLE from this reference image
- The page CONTENT must come from the VIDEO, not this style image
` });
    }

    console.log("[stream] Starting streaming generation...");
    const startTime = Date.now();

    // Create streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status - video analysis
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "analyzing",
            message: "🎬 Analyzing video frames...",
            progress: 5
          })}\n\n`));
          
          // Start streaming generation
          const result = await model.generateContentStream(parts);
          
          let fullText = "";
          let chunkCount = 0;
          let codeStarted = false;
          let lastProgressUpdate = Date.now();
          
          // Send status update - AI is thinking
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "thinking",
            message: "🧠 AI is reconstructing the design...",
            progress: 15
          })}\n\n`));
          
          // Stream chunks as they arrive from Gemini
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            chunkCount++;
            
            // Detect when code generation starts
            if (!codeStarted && (fullText.includes("```html") || fullText.includes("<!DOCTYPE"))) {
              codeStarted = true;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: "status", 
                phase: "generating",
                message: "✨ Generating production code...",
                progress: 25
              })}\n\n`));
            }
            
            // Calculate progress based on typical code length (~30KB average)
            const estimatedProgress = codeStarted 
              ? Math.min(25 + Math.floor((fullText.length / 30000) * 65), 90)
              : 20;
            
            // Send chunk with line count info
            const lineCount = (fullText.match(/\n/g) || []).length;
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: "chunk", 
              content: chunkText,
              chunkIndex: chunkCount,
              totalLength: fullText.length,
              lineCount: lineCount,
              progress: estimatedProgress
            })}\n\n`));
            
            // Send periodic status updates during long generations
            const now = Date.now();
            if (now - lastProgressUpdate > 3000 && codeStarted) {
              lastProgressUpdate = now;
              const sections = (fullText.match(/<section/gi) || []).length;
              const components = (fullText.match(/<div class/gi) || []).length;
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: "progress",
                message: `Building: ${sections} sections, ${components} components...`,
                lineCount: lineCount,
                progress: estimatedProgress
              })}\n\n`));
            }
          }
          
          // Get final response for metadata
          const finalResponse = await result.response;
          const usageMetadata = finalResponse.usageMetadata;
          
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`[stream] Completed in ${duration}s. Chunks: ${chunkCount}, Total length: ${fullText.length}`);
          
          // Extract clean code from response
          let cleanCode = extractCodeFromResponse(fullText);
          
          if (!cleanCode) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: "error", 
              error: "Failed to extract valid HTML code from AI response" 
            })}\n\n`));
            controller.close();
            return;
          }
          
          // Fix any broken image URLs (Unsplash, Pexels, etc. -> picsum)
          cleanCode = fixBrokenImageUrls(cleanCode);
          
          // Send completion with token usage and final code
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "complete",
            code: cleanCode,
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
