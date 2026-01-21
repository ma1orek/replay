import { NextRequest } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || "";
}

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
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
  
  // AGGRESSIVE: Replace ANY unsplash URL
  code = code.replace(/https?:\/\/[^"'\s)]*unsplash[^"'\s)]*/gi, () => getNextPicsumUrl());
  
  // Replace Pexels
  code = code.replace(/https?:\/\/[^"'\s)]*pexels[^"'\s)]*/gi, () => getNextPicsumUrl());
  
  // Replace all placeholder services
  code = code.replace(/https?:\/\/via\.placeholder\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/placehold\.co[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/placeholder\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/dummyimage\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/placekitten\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/loremflickr\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/lorempixel\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/placeimg\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  
  // Replace cloudinary
  code = code.replace(/https?:\/\/res\.cloudinary\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  
  // Fix picsum with invalid IDs
  code = code.replace(/https?:\/\/picsum\.photos\/id\/(\d+)\/(\d+)(?:\/(\d+))?/gi, (match, idStr, w, h) => {
    const id = parseInt(idStr);
    if (validIdSet.has(id)) return match;
    return getNextPicsumUrl(parseInt(w) || 800, parseInt(h) || parseInt(w) || 600);
  });
  
  // Fix picsum without /id/
  code = code.replace(/https?:\/\/picsum\.photos\/(\d+)(?:\/(\d+))?(?:\?[^"'\s)]*)?(?=["'\s)])/gi, (match, w, h) => {
    if (match.includes('/id/')) return match;
    return getNextPicsumUrl(parseInt(w) || 800, parseInt(h) || parseInt(w) || 600);
  });
  
  // Fix empty/broken src
  code = code.replace(/src\s*=\s*["'](?:\s*|#|about:blank|javascript:[^"']*)["']/gi, () => `src="${getNextPicsumUrl()}"`);
  
  // Fix img tags without src
  code = code.replace(/<img\s+(?![^>]*src=)[^>]*>/gi, (match) => {
    return match.replace(/<img/, `<img src="${getNextPicsumUrl()}"`);
  });
  
  return code;
}

// =============================================================================
// REPLAY AI SYSTEM PROMPT - Inspired by Lovable/Bolt architecture
// =============================================================================
function buildSystemPrompt(chatHistory?: any[]): string {
  // Extract recent context and detect language
  let conversationContext = '';
  let userLanguage = 'en';
  
  if (chatHistory && chatHistory.length > 0) {
    const recent = chatHistory.slice(-4).map(m => 
      `${m.role === 'user' ? 'USER' : 'AI'}: ${(m.content || '').substring(0, 200)}`
    ).join('\n');
    conversationContext = `\n\nRECENT CONVERSATION:\n${recent}`;
    
    // Detect if user writes in Polish
    const lastUserMsg = chatHistory.filter(m => m.role === 'user').pop()?.content || '';
    if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|zmień|dodaj|usuń|popraw|zrób/i.test(lastUserMsg)) {
      userLanguage = 'pl';
    }
  }

  const languageInstructions = userLanguage === 'pl' 
    ? `LANGUAGE: Respond in Polish. Be concise and professional.
Examples of good responses:
- "Gotowe! Zmieniłem kolor przycisku na zielony."
- "Gotowe! Dodałem nową sekcję."
- "Gotowe! Przetłumaczyłem teksty na turecki."`
    : `LANGUAGE: Respond in English. Be concise and professional.
Examples of good responses:
- "Done! Changed button color to green."
- "Done! Added new section."
- "Done! Translated all text to Turkish."`;

  return `REPLAY AI - Code Editor

MISSION: Transform user requests into immediate, visible code changes.

CAPABILITIES:
- Edit HTML/CSS/JavaScript/Alpine.js
- Translate text to any language
- Change styles, colors, layouts
- Add/remove components
- Apply styles from reference images

RULES:

1. ALWAYS MAKE CHANGES
   - Unchanged code = FAILURE
   - Make visible modifications
   
2. UNDERSTAND CONTEXT${conversationContext}
   - "yes" / "do it" / "fix it" = apply the change
   - "no" / "undo" = try different approach
   - "translate to X" = translate ALL text
   - "change logo to this" + image = replace logo with uploaded image URL

3. OUTPUT FORMAT
   - Return COMPLETE HTML (<!DOCTYPE to </html>)
   - Wrap in html code blocks
   - Preserve Alpine.js directives

4. IMAGE HANDLING
   - When user uploads an image to change logo/asset:
   - Use the image URL directly from the upload
   - Do NOT use external services like imgur
   - Replace the src attribute with the provided URL

${languageInstructions}

FORBIDDEN:
- Using emojis in responses (NO emoji!)
- Mixing languages (pick one based on user input)
- Returning identical code
- Using external image services (imgur, etc.)
- Verbose explanations

RESPONSE FORMAT:
1. Brief confirmation (1 line, no emoji)
2. Complete HTML code in code block
3. Nothing else

Example good response:
"Done! Changed the button color.

\`\`\`html
<!DOCTYPE html>
...
\`\`\`"`;
}

// Server-Sent Events streaming for Edit with AI - Using OpenAI GPT-5.2
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const body = await request.json();
        const { currentCode, editRequest, images, databaseContext, isPlanMode, chatHistory } = body;

        if (!currentCode || !editRequest) {
          send("error", { error: "Missing required fields" });
          controller.close();
          return;
        }

        const apiKey = getOpenAIKey();
        if (!apiKey) {
          send("error", { error: "OpenAI API key not configured" });
          controller.close();
          return;
        }

        // Send initial status
        send("status", { message: "Analyzing your request...", phase: "init" });

        const openai = new OpenAI({ apiKey });
        
        // PLAN MODE - Quick conversational response using Gemini
        if (isPlanMode) {
          send("status", { message: "Thinking...", phase: "plan" });
          
          const geminiKey = getGeminiKey();
          if (!geminiKey) {
            send("error", { error: "Gemini API key not configured" });
            controller.close();
            return;
          }
          
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          });
          
          const pageCount = (currentCode.match(/x-show=["']currentPage/gi) || []).length || 1;
          const planPrompt = `Jesteś Replay - przyjaznym asystentem.

ZASADY:
- Mów PROSTO, jak do kumpla
- Krótko (1-2 zdania max)
- Po polsku jeśli user pisze po polsku
- Bez technicznego żargonu
- Bądź pomocny i konkretny

PROJEKT: ${pageCount} strona/y, ~${Math.round(currentCode.length/1000)}KB
PYTANIE: ${editRequest}

Odpowiedz krótko i przyjaźnie:`;

          try {
            const result = await model.generateContentStream(planPrompt);
            
            let fullText = "";
            for await (const chunk of result.stream) {
              const text = chunk.text() || "";
              fullText += text;
              if (text) {
                send("chunk", { text, fullText });
              }
            }

            send("complete", { code: fullText, isChat: true });
          } catch (err: any) {
            console.error("[Plan Mode] Gemini error:", err);
            send("error", { error: err?.message || "Failed to get response" });
          }
          controller.close();
          return;
        }

        // EDIT MODE - Full code generation with GPT-5.2
        send("status", { message: "Understanding your code structure...", phase: "analyze" });
        await delay(200);

        // Check for new page request
        const newPageMatch = editRequest.match(/^@(\w+)\s*(.*)/i);
        const isNewPageRequest = newPageMatch !== null;
        const newPageName = newPageMatch ? newPageMatch[1] : null;

        if (isNewPageRequest) {
          send("status", { message: `Creating new page: ${newPageName}...`, phase: "generate" });
        } else {
          send("status", { message: "Preparing code changes...", phase: "generate" });
        }
        await delay(200);

        // Process images if any - OpenAI vision support
        const validImages = images?.filter((img: any) => (img.base64 && img.base64.length > 100) || img.url) || [];
        const imageContents: any[] = [];

        if (validImages.length > 0) {
          send("status", { message: `Processing ${validImages.length} image(s)...`, phase: "images" });
          
          for (const img of validImages) {
            if (img.url && !img.base64) {
              imageContents.push({
                type: "image_url",
                image_url: { url: img.url }
              });
            } else if (img.base64) {
              const mimeType = img.mimeType || "image/png";
              imageContents.push({
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${img.base64}` }
              });
            }
          }
        }

        // Build prompt with chat history for context (like Lovable/Bolt)
        const prompt = buildEditPrompt(currentCode, editRequest, databaseContext, validImages.length > 0, chatHistory);

        // Use Gemini for images (better multimodal support), OpenAI for text-only
        const hasImages = validImages.length > 0;
        
        if (hasImages) {
          // Use Gemini for image processing - MUST use the image as reference!
          send("status", { message: "Analyzing reference image...", phase: "ai" });
          
          const geminiKey = getGeminiKey();
          if (!geminiKey) {
            send("error", { error: "Gemini API key not configured for image processing" });
            controller.close();
            return;
          }
          
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: { temperature: 0.8, maxOutputTokens: 100000 },
          });
          
          // Check if user wants to replace an asset (logo, image, etc.)
          const isAssetReplacement = /zmień.*logo|change.*logo|podmień.*logo|replace.*logo|zamień.*logo|wstaw.*logo|zamień.*obraz|change.*image|replace.*image|na to|to this|podmień|logo/i.test(editRequest);
          
          // Get uploaded image URLs for direct replacement
          const uploadedImageUrls = validImages.filter((img: { url?: string }) => img.url && img.url.startsWith('http')).map((img: { url?: string }) => img.url);
          
          console.log('[Stream Edit] isAssetReplacement:', isAssetReplacement, 'uploadedImageUrls:', uploadedImageUrls);
          
          // Enhanced prompt for image-based editing
          const imagePrompt = isAssetReplacement && uploadedImageUrls.length > 0
            ? `ASSET REPLACEMENT TASK - CRITICAL URL INSTRUCTION

=== THE URL YOU MUST USE (COPY EXACTLY) ===
${uploadedImageUrls[0]}
===========================================

USER REQUEST: ${editRequest}

INSTRUCTION: Replace the logo/image with the URL above.

CURRENT CODE:
\`\`\`html
${currentCode}
\`\`\`

DO THIS:
1. Find: <img> tag with logo, brand, or similar in class/id/alt
2. Change: src="${uploadedImageUrls[0]}"
3. Return: Complete HTML

BANNED URLS (DO NOT USE):
- imgur.com - BANNED
- placeholder.com - BANNED
- picsum.photos - BANNED  
- any URL you invent - BANNED

ONLY ALLOWED URL: ${uploadedImageUrls[0]}

Example change:
BEFORE: <img src="old-logo.png" class="logo">
AFTER: <img src="${uploadedImageUrls[0]}" class="logo">

Return complete HTML with the logo src changed to:
${uploadedImageUrls[0]}`
            : `# REPLAY AI - Image-Based Code Editor

REFERENCE IMAGE PROVIDED - analyze and apply its style to the code.

HOW TO USE THE IMAGE:
1. Design mockup -> Match the layout, colors, typography, spacing
2. Screenshot -> Recreate/improve what you see  
3. Style reference -> Apply that visual style to existing content

CURRENT CODE:
\`\`\`html
${currentCode}
\`\`\`

USER REQUEST: ${editRequest}

YOUR TASK:
1. ANALYZE the reference image carefully
2. IDENTIFY colors, fonts, layouts, spacing, effects
3. APPLY those visual elements to the code
4. RETURN complete modified HTML

WHAT TO CHANGE (based on image):
- Colors: Extract and apply color palette from image
- Typography: Match font sizes, weights, styles
- Layout: Replicate grid, flex, spacing patterns
- Effects: Add shadows, gradients, borders as shown
- Components: Style cards, buttons, inputs to match

OUTPUT FORMAT:
Return ONLY the complete HTML wrapped in html code blocks.

CRITICAL RULES:
- You MUST make visible changes based on the image
- Returning unchanged code = FAILURE
- NO explanations - just the code
- Preserve Alpine.js functionality
- Keep all existing content, just RESTYLE it`;
          
          // Build Gemini parts with images FIRST for better attention
          const parts: any[] = [];
          
          // Add images first so Gemini pays attention to them
          for (const img of validImages) {
            if (img.base64) {
              // Already have base64
              parts.push({
                inlineData: {
                  mimeType: img.mimeType || 'image/png',
                  data: img.base64,
                },
              });
            } else if (img.url && img.url.startsWith('http')) {
              // URL-based image (from Supabase) - fetch and convert to base64
              try {
                const response = await fetch(img.url);
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const mimeType = response.headers.get('content-type') || 'image/png';
                parts.push({
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                });
                console.log('[Stream Edit] Fetched image from URL:', img.url.substring(0, 50) + '...');
              } catch (fetchErr) {
                console.error('[Stream Edit] Failed to fetch image from URL:', img.url, fetchErr);
              }
            }
          }
          
          // Then add the prompt
          parts.push({ text: imagePrompt });
          
          send("status", { message: isAssetReplacement ? "Replacing asset..." : "Applying style from image...", phase: "writing" });
          
          try {
            const result = await model.generateContent(parts);
            let fullCode = result.response.text();
            
            // Send the full code as chunks for UI update
            const lines = fullCode.split('\n').length;
            send("progress", { lines, chars: fullCode.length, preview: fullCode.slice(-300) });
            send("chunk", { text: fullCode, fullText: fullCode });
            
            send("status", { message: "Finalizing...", phase: "finalize" });
            
            let extractedCode = extractCode(fullCode);
            
            // FORCE FIX: If this was an asset replacement and AI didn't use our URL, do it manually
            if (extractedCode && isAssetReplacement && uploadedImageUrls.length > 0) {
              const targetUrl = uploadedImageUrls[0];
              const hasOurUrl = extractedCode.includes(targetUrl as string);
              
              if (!hasOurUrl) {
                console.warn("[Stream Edit] AI ignored our URL! Forcing replacement...");
                
                // Find and replace first logo/brand image
                // Try multiple patterns
                const logoPatterns = [
                  /(<img[^>]*(?:class|id|alt)\s*=\s*["'][^"']*(?:logo|brand|icon)[^"']*["'][^>]*src\s*=\s*["'])([^"']+)(["'])/i,
                  /(<img[^>]*src\s*=\s*["'])([^"']+)(["'][^>]*(?:class|id|alt)\s*=\s*["'][^"']*(?:logo|brand|icon)[^"']*["'])/i,
                  /(<img[^>]*class\s*=\s*["'][^"']*(?:logo|brand)[^"']*["'][^>]*src\s*=\s*["'])([^"']+)(["'])/i,
                  /(<img[^>]*src\s*=\s*["'])([^"']+)(["'][^>]*class\s*=\s*["'][^"']*logo)/i,
                ];
                
                let replaced = false;
                for (const pattern of logoPatterns) {
                  if (pattern.test(extractedCode)) {
                    extractedCode = extractedCode.replace(pattern, `$1${targetUrl}$3`);
                    replaced = true;
                    console.log("[Stream Edit] Force-replaced logo using pattern");
                    break;
                  }
                }
                
                // If no logo pattern matched, try replacing first img in header/nav
                if (!replaced) {
                  const headerImgPattern = /(<(?:header|nav)[^>]*>[\s\S]*?<img[^>]*src\s*=\s*["'])([^"']+)(["'])/i;
                  if (headerImgPattern.test(extractedCode)) {
                    extractedCode = extractedCode.replace(headerImgPattern, `$1${targetUrl}$3`);
                    replaced = true;
                    console.log("[Stream Edit] Force-replaced first header/nav img");
                  }
                }
                
                // Last resort: replace first img that's not picsum/pravatar
                if (!replaced) {
                  const firstImgPattern = /(<img[^>]*src\s*=\s*["'])(?!https?:\/\/(?:picsum\.photos|i\.pravatar\.cc))([^"']+)(["'])/i;
                  if (firstImgPattern.test(extractedCode)) {
                    extractedCode = extractedCode.replace(firstImgPattern, `$1${targetUrl}$3`);
                    console.log("[Stream Edit] Force-replaced first non-picsum img");
                  }
                }
              }
            }
            
            if (extractedCode) {
              // Check if code actually changed
              const codeChanged = extractedCode.trim() !== currentCode.trim();
              if (!codeChanged) {
                console.warn("[Stream Edit] Code unchanged after image edit - forcing retry");
                send("error", { error: "AI didn't make changes. Please describe what specific changes you want from the image." });
                controller.close();
                return;
              }
              
              const summary = isAssetReplacement ? "Logo replaced" : generateChangeSummary(currentCode, extractedCode, editRequest);
              send("complete", { 
                code: extractedCode, 
                summary,
                stats: {
                  originalLines: currentCode.split('\n').length,
                  newLines: extractedCode.split('\n').length,
                  originalSize: currentCode.length,
                  newSize: extractedCode.length,
                }
              });
            } else {
              const fallbackCode = tryFallbackExtraction(fullCode);
              if (fallbackCode) {
                send("complete", { code: fallbackCode, summary: isAssetReplacement ? "Logo replaced" : "Style applied from image" });
              } else {
                send("error", { error: "Failed to extract code. Please try with a clearer request." });
              }
            }
          } catch (geminiError: any) {
            console.error("[Stream Edit] Gemini error:", geminiError);
            send("error", { error: geminiError?.message || "Failed to process image. Please try with a smaller image." });
          }
        } else {
          // Use Gemini for text-only edits (consistent with generation)
          send("status", { message: "Generating code with Gemini 3 Pro...", phase: "ai" });
          
          const geminiKey = getGeminiKey();
          if (!geminiKey) {
            send("error", { error: "Gemini API key not configured" });
            controller.close();
            return;
          }
          
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: { temperature: 0.7, maxOutputTokens: 100000 },
          });

          send("status", { message: "Writing code...", phase: "writing" });

          try {
            const systemPrompt = buildSystemPrompt(chatHistory);
            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            
            const result = await model.generateContentStream(fullPrompt);
            
            let fullCode = "";
            let chunkCount = 0;
            
            for await (const chunk of result.stream) {
              const text = chunk.text() || "";
              fullCode += text;
              chunkCount++;
              
              if (text.length > 0) {
                send("chunk", { text, fullText: fullCode });
              }
              
              if (chunkCount % 5 === 0) {
                const lines = fullCode.split('\n').length;
                send("progress", { lines, chars: fullCode.length, preview: fullCode.slice(-300) });
              }
            }

            send("status", { message: "Finalizing...", phase: "finalize" });
            await delay(50);

            const extractedCode = extractCode(fullCode);
            
            if (extractedCode) {
              // Validate that code actually changed
              const normalizeCode = (code: string) => code.replace(/\s+/g, ' ').trim();
              const codeChanged = normalizeCode(extractedCode) !== normalizeCode(currentCode);
              
              if (!codeChanged) {
                console.warn("[Stream Edit] Code unchanged - AI didn't make modifications");
                // Return an error so user knows to be more specific
                send("complete", { 
                  code: "I understood your request but couldn't determine what specific changes to make. Please be more specific, like:\n- 'Change the header background to blue'\n- 'Translate all text to Spanish'\n- 'Make the buttons rounded'\n- 'Add a footer section'", 
                  isChat: true,
                  needsClarification: true
                });
              } else {
                const summary = generateChangeSummary(currentCode, extractedCode, editRequest);
                send("complete", { 
                  code: extractedCode, 
                  summary,
                  stats: {
                    originalLines: currentCode.split('\n').length,
                    newLines: extractedCode.split('\n').length,
                    originalSize: currentCode.length,
                    newSize: extractedCode.length,
                  }
                });
              }
            } else {
              const fallbackCode = tryFallbackExtraction(fullCode);
              if (fallbackCode) {
                send("complete", { code: fallbackCode, summary: "Changes applied" });
              } else {
                const looksLikeExplanation = fullCode.length < 2000 && 
                  !fullCode.includes('<!DOCTYPE') && 
                  !fullCode.includes('<html');
                
                if (looksLikeExplanation) {
                  send("complete", { code: fullCode.trim(), isChat: true, needsClarification: false });
                } else {
                  const clarifyResponse = generateClarifyingQuestion(editRequest, currentCode);
                  send("complete", { code: clarifyResponse, isChat: true, needsClarification: true });
                }
              }
            }
          } catch (streamError: any) {
            console.error("[Stream Edit] Gemini error:", streamError);
            send("error", { error: streamError?.message || "AI generation failed. Please try again." });
          }
        }

        controller.close();

      } catch (error) {
        console.error("[Stream Edit] Error:", error);
        send("error", { error: error instanceof Error ? error.message : "Unknown error" });
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
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractCode(response: string): string | null {
  let cleaned = response.trim();
  
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.trim();
  
  let result: string | null = null;
  
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 50) {
    result = htmlMatch[1].trim();
  } else {
    const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
    if (codeMatch && codeMatch[1].trim().length > 50) {
      result = codeMatch[1].trim();
    } else {
      const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
      if (doctypeMatch) {
        result = doctypeMatch[1].trim();
      } else {
        const htmlTagMatch = cleaned.match(/(<html[\s\S]*<\/html>)/i);
        if (htmlTagMatch) {
          result = htmlTagMatch[1].trim();
        } else if (cleaned.startsWith('<!DOCTYPE') || cleaned.startsWith('<html') || cleaned.startsWith('<HTML')) {
          const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
          if (endIndex > 0) {
            result = cleaned.substring(0, endIndex + 7);
          } else {
            result = cleaned;
          }
        } else {
          const htmlStartIndex = cleaned.search(/<(!DOCTYPE|html)/i);
          if (htmlStartIndex >= 0) {
            const htmlContent = cleaned.substring(htmlStartIndex);
            const endIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
            if (endIndex > 0) {
              result = htmlContent.substring(0, endIndex + 7);
            }
          }
        }
      }
    }
  }
  
  // Fix broken image URLs before returning
  if (result) {
    result = fixBrokenImageUrls(result);
  }
  
  return result;
}

function tryFallbackExtraction(response: string): string | null {
  let cleaned = response
    .replace(/```html?\s*/gi, '')
    .replace(/```tsx?\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  const lines = cleaned.split('\n');
  let htmlStart = -1;
  let htmlEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    if (htmlStart === -1 && (line.startsWith('<!doctype') || line.startsWith('<html'))) {
      htmlStart = i;
    }
    if (line.includes('</html>')) {
      htmlEnd = i;
    }
  }
  
  if (htmlStart >= 0 && htmlEnd > htmlStart) {
    return lines.slice(htmlStart, htmlEnd + 1).join('\n');
  }
  
  const doctypeIndex = cleaned.toLowerCase().indexOf('<!doctype');
  const htmlIndex = cleaned.toLowerCase().indexOf('<html');
  const startIndex = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;
  
  if (startIndex >= 0) {
    const fromStart = cleaned.substring(startIndex);
    const endIndex = fromStart.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) {
      return fromStart.substring(0, endIndex + 7);
    }
    if (fromStart.length > 500 && fromStart.includes('<body')) {
      return fromStart;
    }
  }
  
  return null;
}

function generateChangeSummary(oldCode: string, newCode: string, request: string): string {
  const oldLines = oldCode.split('\n').length;
  const newLines = newCode.split('\n').length;
  const lineDiff = newLines - oldLines;
  
  const summaryParts: string[] = [];
  
  const oldPages = (oldCode.match(/x-show=["']currentPage\s*===?\s*["'][^"']+["']/gi) || []).length;
  const newPages = (newCode.match(/x-show=["']currentPage\s*===?\s*["'][^"']+["']/gi) || []).length;
  if (newPages > oldPages) {
    summaryParts.push(`Added ${newPages - oldPages} page(s)`);
  }
  
  const oldSections = (oldCode.match(/<section/gi) || []).length;
  const newSections = (newCode.match(/<section/gi) || []).length;
  if (newSections > oldSections) {
    summaryParts.push(`Added ${newSections - oldSections} section(s)`);
  }
  
  if (lineDiff > 10) {
    summaryParts.push(`+${lineDiff} lines`);
  } else if (lineDiff < -10) {
    summaryParts.push(`${lineDiff} lines`);
  }
  
  if (summaryParts.length === 0) {
    summaryParts.push("Done!");
  }
  
  return summaryParts.join(" • ");
}

function generateClarifyingQuestion(request: string, code: string): string {
  const hasElementRef = request.includes('@') || request.includes('div') || request.includes('button');
  const hasColorRef = /color|kolor|czerwon|niebiesk|zielon|biał|czarn/i.test(request);
  const hasTextRef = /text|tekst|tytuł|nagłówek|title|heading/i.test(request);
  const hasSizeRef = /bigger|smaller|większ|mniejsz|size|rozmiar/i.test(request);
  
  let question = "Hey, could you clarify? ";
  
  if (hasColorRef && !hasElementRef) {
    question += "Which element should I change? Try 'main button' or 'header'.";
  } else if (hasTextRef && !hasElementRef) {
    question += "Which text? Give me a snippet of the current text.";
  } else if (hasSizeRef && !hasElementRef) {
    question += "What should be resized? Tell me which element.";
  } else {
    question += "Be more specific - like 'green button' or 'text in header'.";
  }
  
  return question;
}

function buildEditPrompt(code: string, request: string, dbContext?: string, hasImages?: boolean, chatHistory?: any[]): string {
  const imageContext = hasImages 
    ? `\n\nThe user has attached image(s). Use them as visual reference for the changes.`
    : '';
    
  const dbContextStr = dbContext 
    ? `\n\nDATABASE CONTEXT:\n${dbContext}`
    : '';

  // Build chat history context for continuity (like Lovable/Bolt)
  let conversationContext = '';
  if (chatHistory && chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-6); // Last 6 messages for context
    const historyLines = recentHistory.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'AI';
      const content = msg.content?.substring(0, 300) || '';
      return `${role}: ${content}`;
    }).join('\n');
    
    conversationContext = `
CONVERSATION CONTEXT:
${historyLines}

⚠️ IMPORTANT: The user's current request may reference previous messages!
- If user says "fix it", "do it", "yes" → apply the change discussed above
- If user says "no", "undo", "revert" → don't make that change, try different approach
- If user says "translate" → translate ALL visible text to target language
- ALWAYS make actual changes to the code based on the conversation!
`;
  }

  // Detect if this is a "Create/Add new page" request
  const isCreatePageRequest = /ADD\s+a?\s*new\s+page|create\s+.*page|add\s+.*page|reconstruct|generate\s+.*page|@[a-zA-Z0-9-_]+\s+(create|add|make|build|reconstruct|generate)/i.test(request.trim());
  
  // Extract page name from various formats
  const pageNameMatch = request.match(/(?:for|page)\s*["']([^"']+)["']|@([a-zA-Z0-9-_]+)|route:\s*\/([a-z0-9-]+)/i);
  const pageName = pageNameMatch ? (pageNameMatch[1] || pageNameMatch[2] || pageNameMatch[3])?.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;

  // Special instructions for adding new pages - CRITICAL: PRESERVE EXISTING CODE
  const pageCreationInstructions = isCreatePageRequest && pageName ? `
⚠️⚠️⚠️ CRITICAL: ADDING NEW PAGE "${pageName}" ⚠️⚠️⚠️

YOU MUST DO EXACTLY THIS:
1. KEEP 100% OF EXISTING CODE - DO NOT DELETE OR MODIFY ANY EXISTING PAGES
2. ADD a new x-show section with x-show="currentPage === '${pageName}'"
3. ADD "${pageName}" to navigation menu alongside existing items
4. CREATE content for "${pageName}" page matching the existing design/style

FORBIDDEN ACTIONS:
❌ DO NOT remove existing pages
❌ DO NOT replace the entire HTML with just the new page
❌ DO NOT modify existing page content
❌ DO NOT change the existing navigation structure

REQUIRED STRUCTURE:
The code must have MULTIPLE x-show sections (existing ones + the new "${pageName}"):
- x-show="currentPage === 'home'" (KEEP)
- x-show="currentPage === 'existing1'" (KEEP) 
- x-show="currentPage === 'existing2'" (KEEP)
- x-show="currentPage === '${pageName}'" (ADD NEW)

Count existing x-show sections BEFORE. After your edit, there must be MORE x-show sections, not fewer!
` : '';

  // Detect translation requests
  const isTranslationRequest = /translat|tłumacz|przetłumacz|język|language|turkish|polski|english|german|french|spanish/i.test(request);
  const translationInstructions = isTranslationRequest ? `
TRANSLATION REQUEST DETECTED
You MUST translate ALL visible text content in the HTML to the target language:
- Headlines, titles, subtitles
- Button text, labels, placeholders
- Navigation items, menu items
- Descriptions, paragraphs
- Alt text for images
- Form labels and error messages

DO NOT translate:
- HTML tags, attributes, class names
- JavaScript/Alpine.js code
- CSS properties
- URLs, IDs
` : '';

  return `You are Replay, an Elite AI Code Editor (like Lovable, Bolt, Cursor).

MISSION: Make the exact changes the user requested. ALWAYS modify the code!
${conversationContext}

CURRENT CODE:
\`\`\`html
${code}
\`\`\`

USER REQUEST:
${request}${imageContext}${dbContextStr}
${pageCreationInstructions}${translationInstructions}

OUTPUT RULES:
1. Return COMPLETE HTML document (<!DOCTYPE html> to </html>)
2. Wrap code in html code blocks
3. ⚠️ PRESERVE ALL EXISTING CODE - only ADD/MODIFY what was specifically requested
4. ⚠️ If adding a page: KEEP all existing x-show sections, ADD the new one
5. Preserve Alpine.js x-data, x-show, x-on directives exactly
6. Keep all existing pages, navigation, and multi-page structure
7. NEVER return partial code or explanations instead of code
8. NEVER reduce the amount of content - only add or modify

TECHNICAL STANDARDS:
- Use Tailwind CSS for all styling
- Use Alpine.js for interactivity
- Mobile-first responsive design
- IMAGES: ONLY use https://picsum.photos/WxH?random=N
- AVATARS: ONLY use https://i.pravatar.cc/150?img=N

Return ONLY the complete modified HTML code wrapped in html code blocks.
No explanations before or after the code block.`;
}
