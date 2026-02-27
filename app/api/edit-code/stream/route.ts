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

// Helper: Delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: User-friendly error messages
function getUserFriendlyError(error: any): string {
  const message = error?.message || String(error);
  
  // 503 Service Unavailable - model overloaded
  if (message.includes('503') || message.includes('overloaded') || message.includes('Service Unavailable')) {
    return "Serwer AI jest obecnie przeciążony. Spróbuj ponownie za chwilę - automatycznie ponawiamy...";
  }
  
  // 429 Rate limit
  if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
    return "Osiągnięto limit zapytań. Poczekaj chwilę i spróbuj ponownie.";
  }
  
  // 500 Internal server error
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return "Wystąpił błąd serwera AI. Spróbuj ponownie.";
  }
  
  // Timeout
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return "Zapytanie trwało zbyt długo. Spróbuj ponownie z krótszym żądaniem.";
  }
  
  // Network error
  if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
    return "Problem z połączeniem. Sprawdź internet i spróbuj ponownie.";
  }
  
  // Generic fallback
  return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
}

// Helper: Execute Gemini with retry logic
async function executeGeminiWithRetry(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string | any[],
  config: any,
  maxRetries: number = 3,
  onRetry?: (attempt: number, error: any) => void
): Promise<any> {
  let lastError: any;
  
  // Try different models in order of preference
  const modelsToTry = [
    modelName,
    "gemini-3.1-pro-preview",
  ].filter((m, i, arr) => arr.indexOf(m) === i); // Remove duplicates
  
  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: currentModel,
          generationConfig: config,
        });
        
        const result = await model.generateContentStream(prompt);
        return { result, modelUsed: currentModel };
        
      } catch (error: any) {
        lastError = error;
        const isOverloaded = error?.message?.includes('503') || error?.message?.includes('overloaded');
        const isRateLimit = error?.message?.includes('429');

        console.error(`[Gemini] ${currentModel} attempt ${attempt}/${maxRetries} failed:`, error?.message);

        // Notify about retry
        if (onRetry && (isOverloaded || isRateLimit)) {
          onRetry(attempt, error);
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries && (isOverloaded || isRateLimit)) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          await delay(waitTime);
        } else if (!isOverloaded && !isRateLimit) {
          // Non-retryable error, try next model
          break;
        }
      }
    }
    console.log(`[Gemini] Trying fallback model after ${modelName} failed`);
  }
  
  throw lastError;
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
// JSX → HTML SANITIZER — safety net if AI outputs React/JSX despite prompt
// =============================================================================
function sanitizeJsxToHtml(code: string): string {
  // STEP 1: Strip React component wrapper (export default function ... return (<>...</>))
  if (/export\s+default\s+function|function\s+\w+Page\s*\(|function\s+\w+Component\s*\(|function\s+Home\s*\(/.test(code)) {
    // Try multiple extraction patterns, most specific first
    // Pattern 1: return ( <> ... </> )
    let inner = code.replace(/^[\s\S]*?return\s*\(\s*<>\s*/m, '').replace(/\s*<\/>\s*\)\s*;?\s*\}\s*$/, '');
    // Pattern 2: return ( <React.Fragment> ... </React.Fragment> )
    if (inner === code) {
      inner = code.replace(/^[\s\S]*?return\s*\(\s*<React\.Fragment>\s*/m, '').replace(/\s*<\/React\.Fragment>\s*\)\s*;?\s*\}\s*$/, '');
    }
    // Pattern 3: return ( <div ... > ... </div> ) — outer wrapper div
    if (inner === code) {
      const retMatch = code.match(/return\s*\(\s*(<div[\s\S]*)\)\s*;?\s*\}\s*$/);
      if (retMatch) inner = retMatch[1].trim();
    }
    // Pattern 4: return ( <section/html/anything ) — just strip wrapper
    if (inner === code) {
      const retMatch = code.match(/return\s*\(\s*([\s\S]+?)\s*\)\s*;?\s*\}\s*$/);
      if (retMatch) inner = retMatch[1].trim();
    }
    if (inner !== code) code = inner;
  }

  // STEP 2: Strip React imports and directives
  code = code.replace(/^import\s+(?:React|{[^}]*})\s+from\s+['"][^'"]+['"];?\s*\n/gm, '');
  code = code.replace(/^import\s+.*?\s+from\s+['"]react['"];?\s*\n/gm, '');
  code = code.replace(/^['"]use client['"];?\s*\n/gm, '');
  code = code.replace(/^\/\/\s*Next\.js App Router.*\n/gm, '');
  code = code.replace(/^\/\/\s*Generated by Replay.*\n/gm, '');

  // STEP 3: Extract and protect <script> blocks from further transformations
  const scriptBlocks: string[] = [];
  let sanitized = code.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
    scriptBlocks.push(match);
    return `__SCRIPT_PLACEHOLDER_${scriptBlocks.length - 1}__`;
  });

  // STEP 4: className → class (outside scripts)
  sanitized = sanitized.replace(/\bclassName=/g, 'class=');

  // STEP 5: JSX style={{ ... }} → HTML style="..." (outside scripts)
  // Handle both single-line and multi-line style objects
  sanitized = sanitized.replace(/style=\{\{([\s\S]*?)\}\}/g, (_match, inner: string) => {
    const cssStr = inner
      .replace(/\/\/[^\n]*/g, '') // strip JS comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // strip block comments
      .split(/,\s*(?=[a-zA-Z])/) // split on comma followed by property name
      .map((pair: string) => {
        pair = pair.trim();
        if (!pair) return '';
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) return '';
        const key = pair.slice(0, colonIdx).trim();
        let val = pair.slice(colonIdx + 1).trim();
        // Convert camelCase to kebab-case
        const cssKey = key.replace(/^['"\s]+|['"\s]+$/g, '').replace(/([A-Z])/g, '-$1').toLowerCase();
        // Clean value: strip quotes, trailing comma
        val = val.replace(/,\s*$/, '').replace(/^['"]|['"]$/g, '').trim();
        if (!cssKey || !val) return '';
        return `${cssKey}: ${val}`;
      })
      .filter(Boolean)
      .join('; ');
    return `style="${cssStr}"`;
  });

  // STEP 6: JSX comments {/* ... */} → HTML comments <!-- ... -->
  sanitized = sanitized.replace(/\{\/\*\s*([\s\S]*?)\s*\*\/\}/g, '<!-- $1 -->');

  // STEP 7: JSX self-closing tags → HTML (br, hr, img)
  sanitized = sanitized.replace(/<br\s*\/>/g, '<br>');
  sanitized = sanitized.replace(/<hr\s*\/>/g, '<hr>');

  // STEP 8: Restore script blocks
  scriptBlocks.forEach((block, i) => {
    sanitized = sanitized.replace(`__SCRIPT_PLACEHOLDER_${i}__`, block);
  });

  // STEP 9: If the result doesn't start with <!DOCTYPE or <html, check if it's just body content
  // and the original had a full document structure
  const trimmed = sanitized.trim();
  if (!trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html') && !trimmed.startsWith('<HTML')) {
    // The wrapper stripping removed the document structure — this is just body content
    // It will be handled by the caller (the iframe template wraps it)
  }

  return sanitized;
}

// =============================================================================
// REPLAY AI SYSTEM PROMPT - Inspired by Lovable/Bolt architecture
// =============================================================================
function buildSystemPrompt(chatHistory?: any[], inputCode?: string): string {
  // Extract recent conversation context
  let conversationContext = '';

  if (chatHistory && chatHistory.length > 0) {
    const recent = chatHistory.slice(-4).map(m =>
      `${m.role === 'user' ? 'USER' : 'AI'}: ${(m.content || '').substring(0, 200)}`
    ).join('\n');
    conversationContext = `\n\nRECENT CONVERSATION:\n${recent}`;
  }

  // Detect input format to reinforce correct output format
  let formatWarning = '';
  if (inputCode) {
    const hasClass = /\bclass=/.test(inputCode) && !/\bclassName=/.test(inputCode);
    const hasDoctype = /<!DOCTYPE/i.test(inputCode);
    const hasStyleStr = /style="/.test(inputCode) && !/style=\{\{/.test(inputCode);
    if (hasClass || hasDoctype || hasStyleStr) {
      formatWarning = `\n\n⚠️ FORMAT LOCK: The input is PLAIN HTML (class=, style="...", <!DOCTYPE>). Your output MUST use IDENTICAL format. NEVER convert to className, style={{}}, or React/JSX. Match the input format EXACTLY.`;
    }
  }

  return `REPLAY AI - Precision Code Editor

MISSION: Make SURGICAL, TARGETED edits. Change ONLY what the user asked. Keep everything else BYTE-FOR-BYTE IDENTICAL.

CORE PRINCIPLE - MINIMAL DIFF:
- You are a DIFF engine, NOT a code generator
- Think: "What is the SMALLEST change needed?"
- "make header blue" → change ONLY the header background class/style
- "add a button" → insert ONLY the button element, touch NOTHING else
- "fix the chart" → fix ONLY the chart code
- NEVER rewrite, reorganize, or "improve" untouched sections
- NEVER remove content, sections, or pages unless explicitly asked
- NEVER change formatting, indentation, or whitespace of untouched code

CONTEXT${conversationContext}${formatWarning}
- "yes" / "do it" / "fix it" = apply the discussed change (minimal)
- "translate to X" = translate ALL visible text (keep structure identical)
- "change logo" + image = replace logo src attribute only

OUTPUT FORMAT:
- Return COMPLETE HTML document (<!DOCTYPE to </html>)
- Wrap in html code blocks
- The output must be IDENTICAL to input EXCEPT for the specific requested changes

PRESERVATION RULES (MANDATORY):
1. Every x-show section in input MUST exist in output (same count or more)
2. Every navigation item MUST be preserved
3. Every <script> block MUST be preserved exactly
4. All <style> blocks, CSS variables, animations MUST be preserved
5. Page count MUST stay the same (unless adding/removing pages)
6. All Alpine.js x-data, x-show, x-on, @click directives MUST be preserved
7. All content text MUST be preserved (unless user asked to change it)
8. NEVER delete sections, cards, testimonials, features, or any content blocks

ICONS: Use Lucide only: <i data-lucide="icon-name" class="w-5 h-5"></i>
IMAGES: https://picsum.photos/WxH?random=N | AVATARS: https://i.pravatar.cc/150?img=N

RESPONSE: Start with a brief 1-2 sentence summary describing what YOU changed (not repeating the user's request). Write it as a confident confirmation in English, e.g. "Reduced the footer text size from text-lg to text-xs and lowered its opacity." Then output the complete HTML code block.
NEVER add explanations after the code block. NEVER parrot or echo the user's message — describe the actual changes you made.

FORBIDDEN:
- Rewriting/regenerating sections the user didn't ask to change
- Removing existing content, sections, pages, or functionality
- Changing code formatting or structure of untouched parts
- Using external image services (imgur, etc.)
- Inline SVG icons (use Lucide data-lucide instead)

🚨 CRITICAL — OUTPUT FORMAT IS PURE HTML, NEVER JSX/REACT:
- Use "class" NOT "className" — NEVER write className anywhere!
- Use style="display: none" NOT style={{ display: 'none' }} — NEVER use double-brace style objects!
- NEVER wrap code in React components: no "export default function", no "function HomePage()", no "return (<>...</>)"
- NEVER add React imports: no "import React", no "'use client'", no "import { useState }"
- The output is a STATIC HTML PAGE served in an iframe — it is NOT a React/Next.js component!
- If the input uses "class=", your output MUST also use "class=" — NEVER convert to className!
- NEVER abbreviate or shorten Tailwind class names! Write COMPLETE names: "flex-col" NOT "fle", "max-w-[1400px]" NOT "ma[1400px]", "mx-auto" NOT "m", "flex-none" NOT "fle"
- NEVER remove Alpine.js directives: x-data, x-show, x-collapse, x-transition, @click MUST stay!

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
            // Use retry logic with fallback models
            const { result } = await executeGeminiWithRetry(
              genAI,
              "gemini-3.1-pro-preview", // Use Gemini 3 Pro
              planPrompt,
              { temperature: 0.7, maxOutputTokens: 1000 },
              3,
              (attempt, error) => {
                const friendlyMsg = getUserFriendlyError(error);
                send("status", { message: `${friendlyMsg} (próba ${attempt}/3)`, phase: "retry" });
              }
            );
            
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
            console.error("[Plan Mode] Gemini error after retries:", err);
            const friendlyError = getUserFriendlyError(err);
            send("error", { error: friendlyError, technical: err?.message });
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
          const imageModelNames = ["gemini-3.1-pro-preview"];
          let model = genAI.getGenerativeModel({
            model: imageModelNames[0],
            generationConfig: { temperature: 0.4, maxOutputTokens: 65536 },
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
            let result;
            for (const imgModelName of imageModelNames) {
              try {
                model = genAI.getGenerativeModel({
                  model: imgModelName,
                  generationConfig: { temperature: 0.4, maxOutputTokens: 65536 },
                });
                result = await model.generateContent(parts);
                break;
              } catch (modelErr: any) {
                console.error(`[Stream Edit] ${imgModelName} failed:`, modelErr?.message);
                if (imgModelName === imageModelNames[imageModelNames.length - 1]) throw modelErr;
              }
            }
            let fullCode = result!.response.text();

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
              
              const summary = isAssetReplacement ? "Logo replaced" : generateChangeSummary(currentCode, extractedCode, editRequest, fullCode);
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
            console.error("[Stream Edit] Gemini image error:", geminiError);
            const friendlyError = getUserFriendlyError(geminiError);
            send("error", { 
              error: friendlyError + " Spróbuj z mniejszym obrazkiem lub bez obrazka.", 
              technical: geminiError?.message 
            });
          }
        } else {
          // DUAL MODE: SEARCH/REPLACE (default) or Full HTML (fallback)
          const editMode = selectEditMode(editRequest, currentCode, false);
          console.log(`[Stream Edit] Using mode: ${editMode}`);

          if (editMode === 'search-replace') {
            // ===== SEARCH/REPLACE MODE (NEW) =====
            send("status", { message: "Making targeted edits...", phase: "ai" });

            const geminiKey = getGeminiKey();
            if (!geminiKey) {
              send("error", { error: "Gemini API key not configured" });
              controller.close();
              return;
            }

            const genAI = new GoogleGenerativeAI(geminiKey);
            send("status", { message: "Analyzing code...", phase: "writing" });

            try {
              const searchReplacePrompt = buildSearchReplacePrompt(editRequest, currentCode, undefined);

              // Lower temperature for precision, lower maxOutputTokens (blocks are tiny)
              const { result, modelUsed } = await executeGeminiWithRetry(
                genAI,
                "gemini-3.1-pro-preview",
                searchReplacePrompt,
                { temperature: 0.2, maxOutputTokens: 8192 }, // Precise + small output
                3,
                (attempt, error) => {
                  const friendlyMsg = getUserFriendlyError(error);
                  send("status", { message: `${friendlyMsg} (próba ${attempt}/3)`, phase: "retry" });
                }
              );

              console.log(`[Stream Edit] SEARCH/REPLACE using model: ${modelUsed}`);

              let fullResponse = "";
              for await (const chunk of result.stream) {
                const text = chunk.text() || "";
                fullResponse += text;
              }

              send("status", { message: "Applying changes...", phase: "finalize" });
              await delay(50);

              // Parse SEARCH/REPLACE blocks
              const parsed = parseSearchReplaceResponse(fullResponse);

              if (parsed.isSearchReplace && parsed.blocks.length > 0) {
                // Apply blocks
                const applyResult = applySearchReplace(currentCode, parsed.blocks);

                if (applyResult.failedCount > 0) {
                  console.warn(`[Stream Edit] S/R: ${applyResult.failedCount}/${parsed.blocks.length} blocks failed`);

                  // If ALL blocks failed, fallback to full HTML mode
                  if (applyResult.appliedCount === 0) {
                    console.log("[Stream Edit] S/R: ALL blocks failed, falling back to full HTML");
                    await runFullHtmlEdit(prompt, currentCode, editRequest, chatHistory, send);
                    return;
                  }
                }

                // Success: return edited code
                const summary = parsed.summary || (applyResult.appliedCount > 1 ? `Made ${applyResult.appliedCount} changes to the code.` : "Made the requested changes.");
                send("complete", {
                  code: applyResult.code,
                  summary,
                  stats: {
                    originalLines: currentCode.split('\n').length,
                    newLines: applyResult.code.split('\n').length,
                    originalSize: currentCode.length,
                    newSize: applyResult.code.length,
                    mode: 'search-replace',
                    blocksApplied: applyResult.appliedCount,
                    blocksFailed: applyResult.failedCount
                  }
                });
              } else {
                // AI returned full HTML despite S/R prompt - validate before accepting
                console.log("[Stream Edit] AI returned full HTML in S/R mode, validating...");
                let extractedCode = parsed.fullHtml || extractCode(fullResponse) || currentCode;
                // JSX safety net (with multi-pass)
                if (/\bclassName=/.test(extractedCode) || /style=\{\{/.test(extractedCode) || /export\s+default\s+function/.test(extractedCode)) {
                  console.warn('[Stream Edit] JSX DETECTED in S/R fallback — sanitizing');
                  extractedCode = sanitizeJsxToHtml(extractedCode);
                  if (/\bclassName=/.test(extractedCode) || /style=\{\{/.test(extractedCode)) {
                    extractedCode = sanitizeJsxToHtml(extractedCode);
                  }
                }
                const srSizeDrop = extractedCode.length / currentCode.length;

                // TRUNCATION DETECTION: Check for abbreviated Tailwind classes
                const srTruncated = /\bclass="[^"]*\b(fle|ma\[|m"|flexcol|fle-col)\b/;
                if (srTruncated.test(extractedCode) && !srTruncated.test(currentCode)) {
                  console.error('[Stream Edit] S/R fallback REJECTED: truncated class names detected');
                  send("complete", {
                    code: `The AI corrupted the page by abbreviating CSS class names. Your original code has been preserved.\n\nPlease try your edit again.`,
                    isChat: true,
                    needsClarification: true
                  });
                } else if (srSizeDrop < 0.4 && currentCode.length > 5000) {
                  console.error(`[Stream Edit] S/R fallback REJECTED: code destroyed ${currentCode.length} → ${extractedCode.length}`);
                  send("complete", {
                    code: `The AI tried to rewrite the entire page instead of making the small change you requested. Your original code has been preserved.\n\nTry being more specific with your edit request.`,
                    isChat: true,
                    needsClarification: true
                  });
                } else {
                  const summary = parsed.summary || "Changes applied";
                  send("complete", {
                    code: extractedCode,
                    summary,
                    stats: {
                      originalLines: currentCode.split('\n').length,
                      newLines: extractedCode.split('\n').length,
                      originalSize: currentCode.length,
                      newSize: extractedCode.length,
                      mode: 'search-replace-fallback-full'
                    }
                  });
                }
              }
            } catch (error: any) {
              console.error("[Stream Edit] SEARCH/REPLACE error:", error);
              // Fallback to full HTML on error
              console.log("[Stream Edit] S/R error, falling back to full HTML");
              await runFullHtmlEdit(prompt, currentCode, editRequest, chatHistory, send);
            }
          } else {
            // ===== FULL HTML MODE (LEGACY) =====
            await runFullHtmlEdit(prompt, currentCode, editRequest, chatHistory, send);
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

function generateChangeSummary(oldCode: string, newCode: string, request: string, fullResponse?: string): string {
  // First, try to extract summary from AI response (text before code block)
  if (fullResponse) {
    const codeBlockStart = fullResponse.indexOf('```');
    if (codeBlockStart > 0) {
      const aiSummary = fullResponse.substring(0, codeBlockStart).trim();
      // Clean up the summary - remove "Done!" prefix if followed by actual description
      const cleanSummary = aiSummary
        .replace(/^(Done!|Gotowe!)\s*/i, '')
        .replace(/\*\*/g, '') // Remove markdown bold
        .trim();
      
      // If AI gave a meaningful summary (more than just "Done"), use it
      if (cleanSummary.length > 10 && !cleanSummary.match(/^(done|gotowe|ok|changes applied|zmiany zastosowane)\.?$/i)) {
        return cleanSummary;
      }
    }
  }
  
  // Fallback: generate summary based on code analysis
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
  
  // Generate a meaningful fallback based on code diff
  if (summaryParts.length === 0) {
    const lineDiffStr = lineDiff > 0 ? `Added ${lineDiff} lines.` : lineDiff < 0 ? `Removed ${Math.abs(lineDiff)} lines.` : '';
    const sizeDiff = newCode.length - oldCode.length;
    if (Math.abs(sizeDiff) < 50) {
      return "Made the requested changes.";
    }
    return lineDiffStr || "Changes applied to the code.";
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

  // Count existing structural elements for validation context
  const xShowCount = (code.match(/x-show\s*=\s*["']/g) || []).length;
  const sectionCount = (code.match(/<section[\s>]/g) || []).length;
  const navItemCount = (code.match(/<(?:a|button)[^>]*(?:@click|x-on:click)[^>]*currentPage/g) || []).length;
  const scriptCount = (code.match(/<script[\s>]/g) || []).length;

  return `SURGICAL CODE EDIT — MINIMAL CHANGES ONLY
${conversationContext}

STRUCTURAL FINGERPRINT (your output MUST match or exceed these counts):
- x-show sections: ${xShowCount}
- <section> tags: ${sectionCount}
- Navigation items: ${navItemCount}
- <script> blocks: ${scriptCount}

CURRENT CODE (${code.length} chars, ${code.split('\\n').length} lines):
\`\`\`html
${code}
\`\`\`

USER REQUEST: ${request}${imageContext}${dbContextStr}
${pageCreationInstructions}${translationInstructions}

EDIT STRATEGY:
1. LOCATE the specific part of the code the user wants changed
2. Make ONLY the requested change to that specific part
3. Copy ALL other code EXACTLY as-is (byte-for-byte identical)
4. Return the COMPLETE HTML document with the minimal edit applied

HARD RULES:
- x-show sections in output >= ${xShowCount} (NEVER fewer)
- <section> tags in output >= ${sectionCount} (NEVER fewer)
- Navigation items MUST all be preserved
- ALL <script> blocks preserved exactly (${scriptCount} blocks)
- Alpine.js directives (x-data, x-show, x-on, @click) MUST NOT be removed
- Content text outside the edited area MUST NOT change
- If you're unsure what to change, change LESS not MORE

Return brief summary (what you changed), then complete HTML in code block.`;
}

// ============================================================================
// SEARCH/REPLACE BLOCK MODE - Helper functions
// ============================================================================

function countOccurrences(str: string, substring: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(substring, pos)) !== -1) {
    count++;
    pos += substring.length;
  }
  return count;
}

function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) { // FIXED: was "i <= a.length" (infinite loop bug)
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function lineSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance / maxLen;
}

function fuzzyLineMatch(codeLines: string[], searchLines: string[], startIdx: number, threshold: number = 0.85): { match: boolean; endIdx: number } {
  if (startIdx + searchLines.length > codeLines.length) {
    return { match: false, endIdx: -1 };
  }

  let totalSimilarity = 0;
  for (let i = 0; i < searchLines.length; i++) {
    const sim = lineSimilarity(
      normalizeWhitespace(codeLines[startIdx + i]),
      normalizeWhitespace(searchLines[i])
    );
    totalSimilarity += sim;
  }

  const avgSimilarity = totalSimilarity / searchLines.length;
  if (avgSimilarity >= threshold) {
    return { match: true, endIdx: startIdx + searchLines.length - 1 };
  }

  return { match: false, endIdx: -1 };
}

function anchorMatch(codeLines: string[], searchLines: string[]): { startIdx: number; endIdx: number } | null {
  if (searchLines.length < 2) return null;

  const firstSearch = normalizeWhitespace(searchLines[0]);
  const lastSearch = normalizeWhitespace(searchLines[searchLines.length - 1]);

  // Find matching first line
  let firstIdx = -1;
  for (let i = 0; i < codeLines.length; i++) {
    if (lineSimilarity(normalizeWhitespace(codeLines[i]), firstSearch) >= 0.85) {
      firstIdx = i;
      break;
    }
  }

  if (firstIdx === -1) return null;

  // Find matching last line after first
  const searchRange = Math.min(firstIdx + searchLines.length + 10, codeLines.length);
  for (let i = firstIdx + 1; i < searchRange; i++) {
    if (lineSimilarity(normalizeWhitespace(codeLines[i]), lastSearch) >= 0.85) {
      return { startIdx: firstIdx, endIdx: i };
    }
  }

  return null;
}

function findOriginalRange(code: string, search: string): { start: number; end: number } | null {
  const codeLines = code.split('\n');
  const searchLines = search.split('\n');

  // Strategy 1: Exact match
  const exactIdx = code.indexOf(search);
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + search.length };
  }

  // Strategy 2: Normalized whitespace
  const normalizedCode = normalizeWhitespace(code);
  const normalizedSearch = normalizeWhitespace(search);
  const normIdx = normalizedCode.indexOf(normalizedSearch);
  if (normIdx !== -1) {
    // Map back to original indices (approximate)
    let charCount = 0;
    let normalCount = 0;
    let startIdx = -1;
    for (let i = 0; i < code.length; i++) {
      if (!/\s/.test(code[i])) {
        if (normalCount === normIdx && startIdx === -1) {
          startIdx = i;
        }
        normalCount++;
        if (normalCount === normIdx + normalizedSearch.length) {
          return { start: startIdx, end: i + 1 };
        }
      }
    }
  }

  // Strategy 3: DISABLED - Fuzzy matching was causing wrong matches and breaking pages
  // Use Full HTML mode instead for complex edits

  // Strategy 4: DISABLED - Anchor matching also unreliable
  // If exact/normalized fails, fallback to Full HTML mode

  return null;
}

// ============================================================================
// SEARCH/REPLACE BLOCK MODE - Core functions
// ============================================================================

interface SearchReplaceBlock {
  search: string;
  replace: string;
}

interface ParsedSearchReplace {
  summary: string;
  blocks: SearchReplaceBlock[];
  isSearchReplace: boolean;
  fullHtml?: string;
}

function parseSearchReplaceResponse(response: string): ParsedSearchReplace {
  // Check if response contains SEARCH/REPLACE markers
  if (!response.includes('<<<SEARCH') || !response.includes('>>>REPLACE') || !response.includes('<<<END')) {
    // Fallback: extract full HTML from code block
    const codeBlockMatch = response.match(/```html?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return {
        summary: response.split('```')[0].trim(),
        blocks: [],
        isSearchReplace: false,
        fullHtml: codeBlockMatch[1]
      };
    }
    return {
      summary: response,
      blocks: [],
      isSearchReplace: false,
      fullHtml: response
    };
  }

  // Extract summary (text before first <<<SEARCH)
  const summaryMatch = response.match(/^([\s\S]*?)<<<SEARCH/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';

  // Extract all SEARCH/REPLACE blocks
  const blocks: SearchReplaceBlock[] = [];
  const blockPattern = /<<<SEARCH\n([\s\S]*?)\n>>>REPLACE\n([\s\S]*?)\n<<<END/g;
  let match;

  while ((match = blockPattern.exec(response)) !== null) {
    blocks.push({
      search: match[1],
      replace: match[2]
    });
  }

  return {
    summary,
    blocks,
    isSearchReplace: true
  };
}

interface ApplyResult {
  code: string;
  appliedCount: number;
  failedCount: number;
  failures: string[];
}

function applySearchReplace(originalCode: string, blocks: SearchReplaceBlock[]): ApplyResult {
  let code = originalCode;
  let appliedCount = 0;
  let failedCount = 0;
  const failures: string[] = [];

  for (const block of blocks) {
    const range = findOriginalRange(code, block.search);

    if (range) {
      // Apply replacement
      code = code.slice(0, range.start) + block.replace + code.slice(range.end);
      appliedCount++;
    } else {
      failedCount++;
      const preview = block.search.slice(0, 100).replace(/\n/g, '\\n');
      failures.push(preview);
    }
  }

  return {
    code,
    appliedCount,
    failedCount,
    failures
  };
}

// ============================================================================
// SEARCH/REPLACE BLOCK MODE - Prompt builder
// ============================================================================

function buildSearchReplacePrompt(editRequest: string, currentCode: string, selectedElement?: string): string {
  const elementContext = selectedElement
    ? `\n\nSELECTED ELEMENT (user clicked this specific element to edit):\n${selectedElement}\n`
    : '';

  return `You are a SURGICAL code editor. Output ONLY the changed lines using SEARCH/REPLACE blocks.

CURRENT CODE:
${currentCode}
${elementContext}
USER REQUEST: ${editRequest}

INSTRUCTIONS:
1. Output a brief SUMMARY line describing what YOU did (not what the user asked). Write it as a confident confirmation in English, e.g. "Reduced the footer email text from text-lg to text-sm." or "Changed the hero background from blue to dark gradient." NEVER parrot/repeat the user's message — describe the actual code change you made.
2. Output one or more SEARCH/REPLACE blocks with this EXACT format:

<<<SEARCH
[exact text to find - must match current code EXACTLY]
>>>REPLACE
[new text to replace with]
<<<END

3. Rules for SEARCH blocks:
   - Must be EXACT substring of current code (copy-paste, not paraphrase)
   - Include enough context for uniqueness (2-3 lines around the change)
   - Multiple blocks if changes are scattered
   - Only include the CHANGED part + surrounding context

4. DO NOT output full HTML page
5. DO NOT change anything except what user requested
6. Preserve all Alpine.js directives (x-show, x-data, x-on)
7. Preserve all navigation, scripts, and sections
8. Output PURE HTML only — NEVER use className (use class), NEVER use style={{}} (use style=""), NEVER wrap in React/JSX components
9. The input is PLAIN HTML (class=, style="..."). Match the EXACT format. NEVER convert class to className.
10. NEVER abbreviate Tailwind class names! Write COMPLETE names: "flex-col" NOT "fle", "max-w-[1400px]" NOT "ma[1400px]", "mx-auto" NOT "m"
11. NEVER remove Alpine.js directives (x-data, x-show, x-collapse, @click) — they control page interactivity!

Example:
Swapped the Contact button from red to blue (bg-red-500 → bg-blue-600).

<<<SEARCH
<button class="bg-red-500 px-4 py-2">
  Contact
</button>
>>>REPLACE
<button class="bg-blue-600 px-4 py-2">
  Contact
</button>
<<<END`;
}

// ============================================================================
// SEARCH/REPLACE BLOCK MODE - Mode selector
// ============================================================================

type EditMode = 'search-replace' | 'full-html';

function selectEditMode(editRequest: string, currentCode: string, isImageEdit: boolean): EditMode {
  const requestLower = editRequest.toLowerCase();

  // Full HTML mode for these cases:
  if (isImageEdit) return 'full-html';
  if (requestLower.includes('translate') || requestLower.includes('tłumacz')) return 'full-html';
  if (requestLower.includes('add') && (requestLower.includes('page') || requestLower.includes('section'))) return 'full-html';
  if (requestLower.includes('new page') || requestLower.includes('nowa strona')) return 'full-html';
  if (requestLower.includes('global') || requestLower.includes('całkowit') || requestLower.includes('everywhere')) return 'full-html';
  if (currentCode.length < 2000) return 'full-html'; // Short code = easier to regenerate

  // Large/complex changes → Full HTML (fuzzy matching disabled, safer to regenerate)
  if (requestLower.includes('replace') && requestLower.includes('animation')) return 'full-html';
  // Only full-html for removing ENTIRE sections/pages, not individual elements
  const isRemovingSection = (requestLower.includes('remove') || requestLower.includes('delete') || requestLower.includes('usuń'))
    && (requestLower.includes('section') || requestLower.includes('page') || requestLower.includes('sekcj') || requestLower.includes('stron'));
  if (isRemovingSection) return 'full-html';
  if (requestLower.includes('redesign') || requestLower.includes('rebuild') || requestLower.includes('recreate')
    || requestLower.includes('przebuduj') || requestLower.includes('od nowa')) return 'full-html';
  if (editRequest.split(' ').length > 20) return 'full-html'; // Very long request = complex change

  // Default: SEARCH/REPLACE mode (safer, faster, more precise)
  return 'search-replace';
}

// ============================================================================
// Full HTML edit mode (fallback/legacy)
// ============================================================================

async function runFullHtmlEdit(
  prompt: string,
  currentCode: string,
  editRequest: string,
  chatHistory: any[],
  send: (event: string, data: any) => void
): Promise<void> {
  send("status", { message: "Generating code with AI...", phase: "ai" });

  const geminiKey = getGeminiKey();
  if (!geminiKey) {
    send("error", { error: "Gemini API key not configured" });
    return;
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  send("status", { message: "Writing code...", phase: "writing" });

  try {
    const systemPrompt = buildSystemPrompt(chatHistory, currentCode);
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    // Use retry logic with fallback models
    const { result, modelUsed } = await executeGeminiWithRetry(
      genAI,
      "gemini-3.1-pro-preview",
      fullPrompt,
      { temperature: 0.3, maxOutputTokens: 65536 },
      3,
      (attempt, error) => {
        const friendlyMsg = getUserFriendlyError(error);
        send("status", { message: `${friendlyMsg} (próba ${attempt}/3)`, phase: "retry" });
      }
    );

    console.log(`[Stream Edit] Using model: ${modelUsed}`);

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

    let extractedCode = extractCode(fullCode);

    // JSX SAFETY NET: sanitize className/style={{}}/React wrappers
    if (extractedCode) {
      const hadJsx = /\bclassName=/.test(extractedCode) || /style=\{\{/.test(extractedCode) || /export\s+default\s+function/.test(extractedCode);
      if (hadJsx) {
        console.warn('[Stream Edit] JSX DETECTED in AI output — sanitizing to HTML');
        extractedCode = sanitizeJsxToHtml(extractedCode);
        // Post-validation: if className still present after first pass, run again
        if (/\bclassName=/.test(extractedCode) || /style=\{\{/.test(extractedCode)) {
          console.warn('[Stream Edit] JSX remnants after sanitization — running second pass');
          extractedCode = sanitizeJsxToHtml(extractedCode);
        }
        // FINAL CHECK: if STILL has className outside <script>, force-replace
        const outsideScripts = extractedCode.replace(/<script[\s\S]*?<\/script>/gi, '');
        if (/\bclassName=/.test(outsideScripts)) {
          console.error('[Stream Edit] className persists after 2 sanitization passes — force-replacing');
          // Protect scripts, force replace className → class everywhere else
          const scripts: string[] = [];
          extractedCode = extractedCode.replace(/<script[\s\S]*?<\/script>/gi, m => { scripts.push(m); return `__FORCE_SCRIPT_${scripts.length-1}__`; });
          extractedCode = extractedCode.replace(/\bclassName=/g, 'class=');
          scripts.forEach((s, i) => { extractedCode = extractedCode!.replace(`__FORCE_SCRIPT_${i}__`, s); });
        }
      }

      // TRUNCATION DETECTION: Check for common abbreviated Tailwind class names
      const truncatedPatterns = /\bclass="[^"]*\b(fle|ma\[|m"|flexcol|fle-col)\b/;
      if (truncatedPatterns.test(extractedCode) && !truncatedPatterns.test(currentCode)) {
        console.error('[Stream Edit] TRUNCATED CLASS NAMES detected — AI abbreviated Tailwind classes. Preserving original.');
        send("complete", {
          code: `The AI corrupted the page by abbreviating CSS class names. Your original code has been preserved.\n\nPlease try your edit again.`,
          isChat: true,
          needsClarification: true
        });
        return;
      }
    }

    if (extractedCode) {
      // Validate that code actually changed
      const normalizeCode = (code: string) => code.replace(/\s+/g, ' ').trim();
      const codeChanged = normalizeCode(extractedCode) !== normalizeCode(currentCode);

      if (!codeChanged) {
        console.warn("[Stream Edit] Code unchanged - AI didn't make modifications");
        send("complete", {
          code: "I understood your request but couldn't determine what specific changes to make. Please be more specific, like:\n- 'Change the header background to blue'\n- 'Translate all text to Spanish'\n- 'Make the buttons rounded'\n- 'Add a footer section'",
          isChat: true,
          needsClarification: true
        });
      } else {
        // STRUCTURAL VALIDATION: Check AI didn't destroy the page
        const origXShow = (currentCode.match(/x-show\s*=\s*["']/g) || []).length;
        const newXShow = (extractedCode.match(/x-show\s*=\s*["']/g) || []).length;
        const origSections = (currentCode.match(/<section[\s>]/g) || []).length;
        const newSections = (extractedCode.match(/<section[\s>]/g) || []).length;
        const sizeDrop = extractedCode.length / currentCode.length;

        // STRUCTURAL PROTECTION: Reject edits that destroy the page
        if (sizeDrop < 0.4 && currentCode.length > 5000) {
          console.error(`[Stream Edit] REJECTED: Code destroyed ${currentCode.length} → ${extractedCode.length} (${Math.round(sizeDrop * 100)}%)`);
          send("complete", {
            code: `The AI tried to rewrite the entire page instead of making the small change you requested. Your original code has been preserved.\n\nTry being more specific, e.g.:\n- "Change the chart type from bar to line"\n- "Update the chart colors to blue and green"\n- "Replace the monthly chart with a pie chart"`,
            isChat: true,
            needsClarification: true
          });
        } else if (origXShow > 2 && newXShow < Math.ceil(origXShow * 0.5)) {
          console.error(`[Stream Edit] REJECTED: Pages lost x-show ${origXShow} → ${newXShow}`);
          send("complete", {
            code: `The AI removed most of your page sections (${origXShow} → ${newXShow}). Your original code has been preserved.\n\nTry a more specific edit request.`,
            isChat: true,
            needsClarification: true
          });
        } else {
          let warning = '';
          if (origXShow > 1 && newXShow < origXShow) {
            warning = ` Warning: ${origXShow - newXShow} page(s) may have been removed.`;
            console.warn(`[Stream Edit] STRUCTURAL WARNING: x-show dropped from ${origXShow} to ${newXShow}`);
          }
          if (sizeDrop < 0.6 && currentCode.length > 5000) {
            warning += ' Warning: Code size dropped - some content may have been lost.';
            console.warn(`[Stream Edit] SIZE WARNING: ${currentCode.length} → ${extractedCode.length} (${Math.round(sizeDrop * 100)}%)`);
          }

          const summary = generateChangeSummary(currentCode, extractedCode, editRequest, fullCode) + warning;
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
      }
    } else {
      let fallbackCode = tryFallbackExtraction(fullCode);
      if (fallbackCode) {
        // JSX safety net for fallback path
        if (/\bclassName=/.test(fallbackCode) || /style=\{\{/.test(fallbackCode)) {
          fallbackCode = sanitizeJsxToHtml(fallbackCode);
        }
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
    console.error("[Stream Edit] Gemini error after retries:", streamError);
    const friendlyError = getUserFriendlyError(streamError);
    send("error", { error: friendlyError, technical: streamError?.message });
  }
}
