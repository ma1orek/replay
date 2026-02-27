import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { REPLAY_SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";
// Agentic Vision - The Sandwich Architecture
import { 
  runParallelSurveyor, 
  validateMeasurements,
  formatSurveyorDataForPrompt 
} from "@/lib/agentic-vision";

export const runtime = "nodejs";
export const maxDuration = 300;

// Get API key
function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// Fix broken image URLs - replace deprecated sources with Pollinations.ai contextual images
function fixBrokenImageUrls(code: string, context?: string): string {
  if (!code) return code;
  
  // Detect context from code content for contextual image generation
  const lowerCode = code.toLowerCase();
  const lowerContext = (context || '').toLowerCase();
  
  // Determine image context based on code content
  type ImageCategory = 'realestate' | 'tech' | 'food' | 'travel' | 'business' | 'nature' | 'fitness' | 'cruise' | 'abstract';
  let primaryCategory: ImageCategory = 'abstract';
  
  // Detect category from code/context
  if (lowerCode.includes('cruise') || lowerCode.includes('ship') || lowerCode.includes('serenity') || lowerCode.includes('voyage') || lowerCode.includes('ocean')) {
    primaryCategory = 'cruise';
  } else if (lowerCode.includes('real estate') || lowerCode.includes('property') || lowerCode.includes('house') || lowerCode.includes('apartment')) {
    primaryCategory = 'realestate';
  } else if (lowerCode.includes('dashboard') || lowerCode.includes('analytics') || lowerCode.includes('saas') || lowerCode.includes('tech')) {
    primaryCategory = 'tech';
  } else if (lowerCode.includes('restaurant') || lowerCode.includes('food') || lowerCode.includes('menu') || lowerCode.includes('recipe') || lowerCode.includes('cafe')) {
    primaryCategory = 'food';
  } else if (lowerCode.includes('travel') || lowerCode.includes('hotel') || lowerCode.includes('vacation') || lowerCode.includes('destination')) {
    primaryCategory = 'travel';
  } else if (lowerCode.includes('finance') || lowerCode.includes('bank') || lowerCode.includes('capital') || lowerCode.includes('wealth')) {
    primaryCategory = 'business';
  } else if (lowerCode.includes('gym') || lowerCode.includes('fitness') || lowerCode.includes('workout') || lowerCode.includes('yoga')) {
    primaryCategory = 'fitness';
  } else if (lowerCode.includes('nature') || lowerCode.includes('outdoor') || lowerCode.includes('landscape')) {
    primaryCategory = 'nature';
  }
  
  // Contextual Pollinations prompts for each category
  const categoryPrompts: Record<ImageCategory, string[]> = {
    cruise: [
      'luxury%20cruise%20ship%20ocean%20sunset%20aerial%20view%20cinematic%204k',
      'elegant%20ship%20deck%20lounge%20sunset%20luxury%20travel',
      'tropical%20island%20destination%20cruise%20turquoise%20water%204k',
      'luxury%20suite%20cabin%20ocean%20view%20modern%20interior',
      'fine%20dining%20cruise%20restaurant%20elegant%20evening',
    ],
    realestate: [
      'modern%20luxury%20apartment%20interior%20minimalist%20design%20natural%20light',
      'contemporary%20house%20exterior%20architecture%20blue%20sky',
      'penthouse%20living%20room%20city%20skyline%20view%20premium',
      'modern%20kitchen%20interior%20design%20marble%20countertop',
    ],
    tech: [
      'abstract%203d%20technology%20shapes%20glowing%20blue%20neon%20futuristic',
      'data%20visualization%20holographic%20interface%20dark%20background',
      'modern%20office%20workspace%20tech%20startup%20minimal',
    ],
    food: [
      'gourmet%20dish%20fine%20dining%20plating%20cinematic%20dark%20moody',
      'cozy%20cafe%20interior%20warm%20lighting%20coffee%20aesthetic',
      'fresh%20ingredients%20cooking%20professional%20kitchen',
    ],
    travel: [
      'exotic%20destination%20sunset%20beach%20palm%20trees%20paradise',
      'mountain%20landscape%20adventure%20travel%20scenic%20view',
      'luxury%20hotel%20lobby%20modern%20architecture%20elegant',
    ],
    business: [
      'corporate%20office%20skyline%20view%20professional%20modern',
      'business%20meeting%20conference%20room%20professional',
      'financial%20district%20skyscrapers%20dramatic%20lighting',
    ],
    fitness: [
      'athletic%20woman%20gym%20workout%20dramatic%20lighting',
      'modern%20gym%20interior%20equipment%20professional',
      'yoga%20studio%20peaceful%20minimalist%20natural%20light',
    ],
    nature: [
      'beautiful%20landscape%20mountains%20sunrise%20dramatic%20sky',
      'forest%20path%20sunlight%20through%20trees%20peaceful',
      'ocean%20waves%20dramatic%20coastline%20sunset',
    ],
    abstract: [
      'abstract%20gradient%20shapes%20modern%20art%20minimal',
      'geometric%20patterns%20colorful%20contemporary%20design',
      'liquid%20marble%20texture%20elegant%20premium%20background',
    ],
  };
  
  const prompts = categoryPrompts[primaryCategory];
  let imageCounter = 0;
  
  // Generate Picsum URL with seed for consistency
  const getPicsumUrl = (width = 800, height = 600) => {
    const seedName = prompts[imageCounter % prompts.length].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    imageCounter++;
    return `https://picsum.photos/seed/${seedName}/${width}/${height}`;
  };
  
  let replacedCount = 0;
  
  // Replace broken/unusable image sources with Picsum (stable, no rate limits)
  // ALLOWED: picsum.photos, pravatar.cc, dicebear.com
  code = code.replace(/https?:\/\/[^"'\s)]*unsplash[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/[^"'\s)]*pexels[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/via\.placeholder\.com[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/placeholder\.com[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/placehold\.co[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/dummyimage\.com[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/loremflickr\.com[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/placekitten\.com[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/placeimg\.com[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  // Replace Pollinations (has rate limits) with Picsum
  code = code.replace(/https?:\/\/image\.pollinations\.ai[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  
  console.log(`[fixBrokenImageUrls] Replaced ${replacedCount} image URLs with Picsum (category: ${primaryCategory})`);
  return code;
}

// Fix template literal syntax errors (missing closing backticks) - ULTRA AGGRESSIVE VERSION
function fixTemplateLiteralErrors(code: string): string {
  if (!code) return code;
  
  let fixedCode = code;
  let fixCount = 0;
  
  // NUCLEAR OPTION: Find ANY src={` that doesn't have `} on same line or next few chars
  // This is the pattern from the error:
  // src={`https://picsum.photos/id/10/800/600 
  //                             alt="Property"
  
  // Pattern 1: MULTILINE - src={`URL followed by newline then alt/className (with = or ")
  fixedCode = fixedCode.replace(
    /src=\{\`(https?:\/\/[^\s`"'<>\n]+)\s*\n\s*(alt|className|style|onClick|onError|width|height|loading)/gi,
    (match, url, attr) => {
      fixCount++;
      console.log(`[fixTemplate] Fixed multiline: ${url.substring(0, 40)}...`);
      return `src={\`${url.trim()}\`}\n                                    ${attr}`;
    }
  );
  
  // Pattern 2: SAME LINE - src={`URL followed by space then attribute (catches alt="...")
  fixedCode = fixedCode.replace(
    /src=\{\`(https?:\/\/[^`\s"'<>\n]+)\s+(alt|className|style|onClick|onError|width|height|loading)/gi,
    (match, url, attr) => {
      fixCount++;
      console.log(`[fixTemplate] Fixed same-line: ${url.substring(0, 40)}...`);
      return `src={\`${url.trim()}\`} ${attr}`;
    }
  );
  
  // Pattern 3: src={`url /> - missing `} before />
  fixedCode = fixedCode.replace(
    /src=\{\`(https?:\/\/[^`"'\s>\n]+)\s*\/>/gi,
    (match, url) => {
      fixCount++;
      return `src={\`${url.trim()}\`} />`;
    }
  );
  
  // Pattern 4: src={`url > - missing `} before >
  fixedCode = fixedCode.replace(
    /src=\{\`(https?:\/\/[^`"'\s>\n]+)\s*>/gi,
    (match, url) => {
      fixCount++;
      return `src={\`${url.trim()}\`}>`;
    }
  );
  
  // Pattern 5: href={`url without closing
  fixedCode = fixedCode.replace(
    /href=\{\`(https?:\/\/[^`\s"'<>\n]+)\s+(className|target|rel|onClick|alt)/gi,
    (match, url, attr) => {
      fixCount++;
      return `href={\`${url.trim()}\`} ${attr}`;
    }
  );
  
  // Pattern 6: ULTIMATE FALLBACK - any src={` followed by any chars until we see alt/class/style
  // Use lazy matching to find the URL
  fixedCode = fixedCode.replace(
    /src=\{\`(https?:\/\/[^\s`]+?)(\s+)(alt|className|style|width|height|loading|onError)(?=[="])/gi,
    (match, url, space, attr) => {
      // Only fix if url doesn't already end with `}
      if (!url.endsWith('`}') && !url.includes('`}')) {
        fixCount++;
        console.log(`[fixTemplate] Fixed fallback: ${url.substring(0, 40)}...`);
        return `src={\`${url.trim()}\`}${space}${attr}`;
      }
      return match;
    }
  );
  
  // Pattern 7: Fix img tags specifically - most common issue
  // <img src={`URL alt="..." or className=
  fixedCode = fixedCode.replace(
    /<img([^>]*?)src=\{\`(https?:\/\/[^`\s"'<>\n]+)([^`}]*?)(alt|className|style|\/?>)/gi,
    (match, before, url, junk, after) => {
      // Check if already properly closed
      if (junk.includes('`}')) return match;
      fixCount++;
      console.log(`[fixTemplate] Fixed img tag: ${url.substring(0, 40)}...`);
      return `<img${before}src={\`${url.trim()}\`} ${after}`;
    }
  );
  
  if (fixCount > 0) {
    console.log(`[fixTemplateLiteralErrors] Fixed ${fixCount} broken template literals`);
  }
  
  return fixedCode;
}

/**
 * Fix broken HTML tags where the opening tag name is missing but attributes remain visible.
 * Common AI generation bug: "<span class="foo">bar</span>" becomes "class="foo">bar</span>"
 * Also ensures glitch elements have required data-text attribute.
 */
function fixBrokenHtmlTags(code: string): string {
  if (!code) return code;
  let fixed = code;
  let fixCount = 0;

  // Pattern 1: Orphaned class/className attributes NOT inside a tag opening
  // Matches: `text class="something">content` or `text className="something">content`
  // But NOT: `<div class="something">` (correctly inside a tag)
  fixed = fixed.replace(
    /([^<\w\-])(class(?:Name)?="[^"]*")(\s*>)/g,
    (match, before, classAttr, closing) => {
      // Only fix if the character before is NOT part of a tag attribute list
      // i.e., if "before" is whitespace, newline, or text content (not = or ")
      if (before.match(/[='"\/\w\-]/)) return match; // Part of a valid tag, skip
      fixCount++;
      return `${before}<span ${classAttr}${closing}`;
    }
  );

  // Pattern 2: Orphaned style="..." attributes outside tags
  fixed = fixed.replace(
    /([^<\w\-])(style="[^"]*")(\s*>)/g,
    (match, before, styleAttr, closing) => {
      if (before.match(/[='"\/\w\-]/)) return match;
      fixCount++;
      return `${before}<span ${styleAttr}${closing}`;
    }
  );

  // Pattern 3: Ensure .glitch elements have data-text attribute
  // <ANY class="...glitch..." ...>TEXT</ANY> → add data-text="TEXT" if missing
  fixed = fixed.replace(
    /<(\w+)([^>]*class="[^"]*glitch[^"]*"[^>]*)>([^<]{1,200})<\/\1>/gi,
    (match, tag, attrs, text) => {
      if (attrs.includes('data-text')) return match; // Already has it
      fixCount++;
      return `<${tag}${attrs} data-text="${text.replace(/"/g, '&quot;')}">${text}</${tag}>`;
    }
  );

  if (fixCount > 0) {
    console.log(`[fixBrokenHtmlTags] Fixed ${fixCount} broken/incomplete HTML tags`);
  }
  return fixed;
}

// Fix malformed double-tag patterns like <div <span className="..."> → <div className="...">
// AI sometimes outputs nested opening tags which is invalid HTML/JSX
function fixMalformedDoubleTags(code: string): string {
  if (!code) return code;
  let fixed = code;
  let fixCount = 0;
  // Repeatedly fix <tag1 [attrs] <tag2 ... patterns until none remain
  // Handles both <div <span class> AND <span key={i} <span class>
  let prev = "";
  while (prev !== fixed) {
    prev = fixed;
    fixed = fixed.replace(/<(\w+)(\s[^<>]*)<\w+(\s+)/g, (match, firstTag, attrs, trailing) => {
      fixCount++;
      return `<${firstTag}${attrs}${trailing}`;
    });
  }
  if (fixCount > 0) {
    console.log(`[fixMalformedDoubleTags] Fixed ${fixCount} malformed double-tag patterns`);
  }
  return fixed;
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
// DIRECT VISION PIPELINE - Gemini 3 Pro sees video and generates code
// NO intermediate JSON, NO templates, NO code examples in prompt
// ═══════════════════════════════════════════════════════════════════════════════

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
    let { videoBase64, mimeType, styleDirective, databaseContext, styleReferenceImage } = body;
    const { videoUrl, generationMode } = body;

    // If videoUrl provided but no base64, fetch video server-side (for large videos that exceed body size limit)
    if (!videoBase64 && videoUrl) {
      try {
        console.log("[stream] Fetching video from URL server-side:", videoUrl.substring(0, 80));
        const videoResponse = await fetch(videoUrl, { headers: { 'Accept': 'video/*,*/*' } });
        if (!videoResponse.ok) {
          return new Response(
            JSON.stringify({ error: `Failed to fetch video: ${videoResponse.status}` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
        const arrayBuffer = await videoResponse.arrayBuffer();
        videoBase64 = Buffer.from(arrayBuffer).toString('base64');
        if (!mimeType) {
          mimeType = contentType.includes('webm') ? 'video/webm' : contentType.includes('quicktime') ? 'video/quicktime' : 'video/mp4';
        }
        console.log("[stream] Video fetched server-side. Size:", arrayBuffer.byteLength, "Type:", mimeType);
      } catch (fetchErr) {
        console.error("[stream] Failed to fetch video URL:", fetchErr);
        return new Response(
          JSON.stringify({ error: "Failed to fetch video from URL" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!videoBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing video data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // SINGLE MODEL: Gemini 3.1 Pro with VISION
    // Pro SEES the video directly and generates code - NO intermediate JSON!
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-pro-preview",
      generationConfig: {
        temperature: 0.85, // High for creative Awwwards-level designs
        maxOutputTokens: 65000, // Gemini 3.1 Pro limit is 65,536
      },
      safetySettings: [
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any, threshold: "BLOCK_LOW_AND_ABOVE" as any },
        { category: "HARM_CATEGORY_HATE_SPEECH" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
        { category: "HARM_CATEGORY_HARASSMENT" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
      ],
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

    console.log("[stream] DIRECT VISION PIPELINE v2.0 - With Agentic Vision Surveyor!");
    const startTime = Date.now();
    const encoder = new TextEncoder();
    
    // Check if Surveyor is enabled (can be passed in body)
    const useSurveyor = body.useSurveyor !== false; // Default: enabled
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ════════════════════════════════════════════════════════════════
          // PHASE 0: THE SURVEYOR - Measure layout with Agentic Vision
          // "Measure twice, cut once"
          // ════════════════════════════════════════════════════════════════
          let surveyorPromptData = '';
          
          if (useSurveyor) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: "status", 
              phase: "surveying",
              message: "📐 Surveyor measuring layout with Agentic Vision...",
              progress: 5
            })}\n\n`));
            
            try {
              console.log("[stream] Running Surveyor before code generation...");
              const surveyorResult = await withTimeout(
                runParallelSurveyor(videoBase64, mimeType),
                45000, // 45s timeout for Surveyor
                "Surveyor Measurement"
              );
              
              if (surveyorResult.success && surveyorResult.measurements) {
                const measurements = validateMeasurements(surveyorResult.measurements);
                surveyorPromptData = formatSurveyorDataForPrompt(measurements);
                
                console.log("[stream] Surveyor SUCCESS! Confidence:", Math.round(measurements.confidence * 100) + "%");
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: "status", 
                  phase: "surveyed",
                  message: `✅ Layout measured: ${measurements.spacing.sidebarWidth} sidebar, ${measurements.spacing.cardPadding} padding`,
                  progress: 8,
                  surveyorData: {
                    confidence: measurements.confidence,
                    spacing: measurements.spacing,
                    colors: measurements.colors
                  }
                })}\n\n`));
              } else {
                console.warn("[stream] Surveyor returned no measurements");
              }
            } catch (surveyorError: any) {
              console.warn("[stream] Surveyor failed (non-fatal):", surveyorError?.message);
              // Continue without Surveyor data
            }
          }
          
          // ════════════════════════════════════════════════════════════════
          // MAIN PHASE: Gemini 3 Pro LOOKS at video and generates code!
          // Now enhanced with Surveyor measurements if available
          // ════════════════════════════════════════════════════════════════
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            phase: "generating",
            message: surveyorPromptData 
              ? "👀 Generating code with pixel-perfect measurements..."
              : "👀 Gemini 3 Pro analyzing video and generating code...",
            progress: 10
          })}\n\n`));
          
          console.log("[stream] Starting direct vision code generation...");
          
          // Build prompt - ONLY system-prompt.ts (no enterprise presets!)
          let prompt = REPLAY_SYSTEM_PROMPT;
          
          // Inject Surveyor measurements if available
          if (surveyorPromptData) {
            prompt += surveyorPromptData;
            console.log("[stream] Injected Surveyor measurements into prompt");
          }
          
          // Add user's style directive — DS needs special handling
          const isDSStyle = styleDirective?.startsWith("DESIGN SYSTEM STYLE GUIDE:");

          if (isDSStyle) {
            prompt += `\n\n🚨🚨🚨 MANDATORY DESIGN SYSTEM — OVERRIDES VIDEO COLORS! 🚨🚨🚨
═══════════════════════════════════════════════════════════════
The user has selected a DESIGN SYSTEM. This means:

🔴 IGNORE ALL COLORS YOU SEE IN THE VIDEO! Do NOT use the video's color palette!
🔴 USE ONLY the Design System token colors listed below for buttons, backgrounds, accents, text, borders!
🔴 The video provides CONTENT and LAYOUT — the Design System provides ALL VISUAL STYLING!

RULES:
1. BUTTONS: Use DS primary/accent color — NOT the color from the video's buttons
2. BACKGROUNDS: Use DS background tokens — NOT the video's background colors
3. TEXT: Use DS text color tokens — NOT whatever colors appear in the video
4. ACCENTS/HIGHLIGHTS: Use DS accent/secondary colors
5. THEME: If video is LIGHT → use DS colors with light backgrounds. If DARK → DS colors with dark backgrounds.
6. Content, text, layout, structure, navigation — copy from the video EXACTLY
7. Colors, typography, spacing, borders — use ONLY from the DS tokens below

${styleDirective}

REPEAT: Do NOT use colors from the video. ALL colors must come from the Design System tokens above.`;
          } else if (styleDirective && styleDirective.trim()) {
            prompt += `\n\n═══════════════════════════════════════════════════════════════
🎨 USER STYLE REQUEST
═══════════════════════════════════════════════════════════════
${styleDirective}`;
          } else {
            // AUTO-DETECT MODE — no style selected, MATCH THE VIDEO EXACTLY
            prompt += `\n\n🚨🚨🚨 AUTO-DETECT MODE — MATCH THE VIDEO'S THEME EXACTLY! 🚨🚨🚨
═══════════════════════════════════════════════════════════════
No custom style was selected. You MUST faithfully recreate the video's visual design:

1. THEME IS DETERMINED BY THE VIDEO — look at the backgrounds!
   - Light/white/cream backgrounds in the video → bg-white, text-gray-900, bg-gray-50, border-gray-200
   - Dark/black backgrounds in the video → bg-zinc-950, text-white, bg-zinc-900, border-zinc-800
   - Do NOT default to dark! Many enterprise UIs, dashboards, and SaaS apps are LIGHT themed!

2. COLOR MATCHING — use the exact colors you see in the video
   - Green buttons → green buttons (not indigo)
   - Orange accents → orange accents (not purple)
   - Gray sidebar → gray sidebar (not black)

3. The video is LAW — if it shows a white background with dark text, your output MUST have bg-white and text-gray-900
4. IGNORE any "premium dark theme" aesthetic from the base prompt — in auto-detect mode, the VIDEO decides the theme!

CRITICAL: Look at the video FIRST. Is the background light or dark? That determines EVERYTHING.`;
          }
          
          // Add database context if provided
          if (databaseContext && databaseContext.trim()) {
            prompt += `\n\n═══════════════════════════════════════════════════════════════
💾 DATABASE CONTEXT
═══════════════════════════════════════════════════════════════
${databaseContext}`;
          }
          
          // MODE-AWARE VISION INSTRUCTIONS
          const isReimagine = generationMode === "reimagine";

          if (isReimagine) {
            prompt += `

WATCH THE VIDEO TO EXTRACT ALL CONTENT AND DATA. Then BUILD A COMPLETELY NEW, BREATHTAKING DESIGN.

🎨 REIMAGINE MODE — BE MORE CREATIVE, KEEP ALL CONTENT
The video is your CONTENT SOURCE only. You must INVENT a brand-new layout.

═══════════════════════════════════════════════════
CONTENT RULES (MANDATORY — violating = failure):
═══════════════════════════════════════════════════
- Keep ALL text VERBATIM: every headline, paragraph, nav item, stat, testimonial, button label
- Keep ALL data EXACT: numbers, metrics, company names, dates, prices
- Keep the PURPOSE of each section (hero, features, pricing, testimonials, CTA, footer, etc.)
- 🚨🚨🚨 ZERO BAN: The number 0 is BANNED in ALL statistics, metrics, KPIs, table data!
  "0 funded startups" → WRONG! Must be "5,000+" or similar real number
  "$0B" → WRONG! Must be "$800B+" or similar real number
  "$0", "0 cases", "0 users", "$0.00" in dashboards → ALL WRONG! Use realistic values
  Dashboard KPIs: "$14,250", "1,847 cases", "12,500 users" — NEVER $0 or 0!
  Table cells: every numeric cell must have a realistic non-zero value
  SCAN THE LAST 5 SECONDS of the video for the FINAL counter values!
  If you cannot read the final value, ESTIMATE a realistic number — NEVER output zero!
  FINAL CHECK: Search your output for ">0<" and ">$0" — if found, replace with real values!
- 🏢 Company logos: styled TEXT with company name/initials, NOT external image URLs
- 🖼️ IMAGES ARE MANDATORY: Every section MUST have at least one image! NEVER skip images!
  Use picsum.photos/seed/UNIQUE-NAME/W/H with descriptive seeds (hero-office, team-photo, feature-dashboard, etc.)
  Every image MUST have a unique seed — NEVER reuse the same seed twice!

═══════════════════════════════════════════════════
SECTION LAYOUT RULES (CLEAN + VARIED)
═══════════════════════════════════════════════════
Every section MUST follow this template for clean layout:
  <section class="relative py-24 md:py-32 overflow-hidden">
    <div class="max-w-7xl mx-auto px-6">
      <!-- content here using CSS Grid or Flexbox -->
    </div>
  </section>

RULES:
- Use CSS Grid (display:grid) or Flexbox for ALL layouts — NEVER position:absolute for layout
- position:absolute ONLY for decorative overlays (floating orbs, grain, aurora)
- Every section needs proper padding (py-24 to py-32)
- Cards: use grid with gap-6 to gap-8, responsive columns (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- All text readable: ensure contrast against background. Light bg → dark text, dark bg → white text
- On gradient/image backgrounds: add text-shadow (0 1px 3px rgba(0,0,0,0.5)) OR overlay behind text
- Nav items on gradient hero: MUST have text-shadow or bg backdrop for readability
- ❌ NEVER place white text on light background or dark text on dark background — INVISIBLE!
- Test: every section must look clean and aligned at 1200px width
- NO broken overlapping elements, NO elements going off-screen
- 🚨 TEXT VISIBILITY: NO text may be cut off or overflow its container!
  - Headlines: use font-size:clamp(2rem,5vw,5rem) so they SHRINK on narrow viewports
  - NEVER use text-8xl or text-9xl as fixed size — always use clamp() or responsive Tailwind (text-4xl md:text-6xl lg:text-7xl)
  - Add overflow-wrap:break-word on all text containers
  - Verify ALL text is fully visible — if a headline is too long, it must wrap naturally at WORD boundaries, never mid-word
  - NEVER use text-outline / -webkit-text-stroke with opacity below 60 — stroked text is much harder to read!
  - Hero container MUST have overflow-hidden + max-w-full to prevent text escaping viewport on mobile
- 🚨 HERO HEADLINE SPACING: Write headlines with SINGLE spaces between words — NO extra spaces!
  - ❌ "W E L C O M E" or "O P E N" = letter-spaced with actual space chars → WRONG
  - ❌ "CHAD  B" or truncated text → WRONG. Write COMPLETE text from video!
  - ✅ Use CSS letter-spacing: 0.2em for visual spacing, NOT space characters
  - ✅ Write full headline verbatim: "CHAD BROTHERS", "Open Workspace"
- 🚨 BUTTON RULES:
  - Button text MUST be COMPLETE — never truncated or cut off
  - NO shader/canvas/WebGL/glitch effects on buttons — buttons use clean CSS ONLY
  - Buttons: solid bg, gradient, border, shadow, transform — NO canvas overlays
- 🚨 ANIMATION VISIBILITY:
  - Hero animations: fire IMMEDIATELY on load (NO ScrollTrigger on hero elements!)
  - Below-fold: ScrollTrigger start:'top 85%' so they trigger BEFORE user reaches them
  - Every element that starts at opacity:0 MUST have a GSAP animation that sets it to opacity:1
  - After all animations: EVERY element on page is visible. Zero orphaned invisible elements!

VARY layouts between sections — cycle through:
1. Full-viewport cinematic hero (min-h-screen, font-size:clamp(2.5rem,6vw,5rem))
2. Bento grid (mixed card sizes: CSS Grid with grid-template-areas or span-2)
3. Horizontal stat strip or floating stat cards with perspective tilt
4. Horizontal snap carousel (overflow-x-auto snap-x snap-mandatory) for testimonials
5. Asymmetric 60/40 split (one side sticky with position:sticky)
6. Diagonal clip-path divider between sections
7. Infinite marquee for logo bars
8. Card comparison with hover lift
9. Vertical timeline with alternating left/right

═══════════════════════════════════════════════════
🎨 MEGA ANIMATION LIBRARY — 50 EFFECTS (from reactbits.dev)
═══════════════════════════════════════════════════
Load these CDNs in <head>:
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
For PREMIUM WebGL backgrounds (Aurora, Iridescence, LiquidChrome, Balatro, Grainient, Particles):
<script type="importmap">{"imports":{"ogl":"https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm"}}</script>

🚨 ANIMATION VARIETY — USE AT LEAST 8 DIFFERENT EFFECTS PER PAGE:
Pick from ALL categories — NEVER just use grain/noise + basic fade-in!
- 2+ text animations (blur entrance, decrypt, shiny, gradient, typewriter, rotating...)
- 2+ background effects (aurora, 3D particles, waves, iridescence, liquid chrome, balatro, grainient, dot grid...)
- 2+ interaction effects (spotlight cards, tilt cards, magnet lines, glare hover...)
- 1+ SVG animation (morphing blob, line-draw icon, floating shapes)
- 1+ scroll-triggered animation (parallax, pixel transition, fade content)
NEVER repeat the same effect across sections! VARY the animation types!

At the end of <body>, implement these animation patterns:

═══ TEXT ANIMATIONS (10 effects) ═══

───── 1. SPLIT TEXT ENTRANCE (hero headline) ─────
document.querySelectorAll('.split-text').forEach(el => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(word =>
    '<span style="display:inline-block;white-space:nowrap;margin-right:0.3em">' +
    word.split('').map(ch => '<span style="display:inline-block;will-change:transform,opacity;">' + ch + '</span>').join('') +
    '</span>'
  ).join(' ');
  el.style.overflowWrap = 'break-word';
  gsap.fromTo(el.querySelectorAll('span > span'),
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.02,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
});
IMPORTANT: Headlines MUST have style="font-size:clamp(2.5rem,5vw,4.5rem)" — NEVER a fixed huge size!

───── 2. SCROLL REVEAL TEXT (paragraphs) ─────
Words unblur and fade in scrubbed to scroll:
document.querySelectorAll('.scroll-reveal-text').forEach(el => {
  el.innerHTML = el.textContent.split(/(\s+)/).map(w =>
    w.match(/^\\s+$/) ? w : '<span class="word" style="display:inline-block">' + w + '</span>'
  ).join('');
  gsap.fromTo(el.querySelectorAll('.word'), { opacity: 0.15, filter: 'blur(4px)' },
    { opacity: 1, filter: 'blur(0px)', ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: el.parentElement, start: 'top 80%', end: 'bottom 60%', scrub: true }
    });
});

───── 3. BLUR TEXT ENTRANCE (subheadings) ─────
Words blur-in with stagger from bottom:
document.querySelectorAll('.blur-text').forEach(el => {
  el.innerHTML = el.textContent.split(/(\s+)/).map(w =>
    w.trim() ? '<span style="display:inline-block">' + w + '</span>' : w
  ).join('');
  gsap.fromTo(el.querySelectorAll('span'),
    { opacity: 0, filter: 'blur(12px)', y: 20 },
    { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
});

───── 4. GRADIENT TEXT (key headlines) ─────
.gradient-text {
  background: linear-gradient(to right, #5227FF, #FF9FFC, #B19EEF, #5227FF);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: gradient-shift 4s ease infinite alternate;
}
@keyframes gradient-shift { 0%{background-position:0% 50%} 100%{background-position:100% 50%} }

───── 5. SHINY TEXT (shimmer highlight sweep) ─────
.shiny-text {
  position: relative; display: inline-block; color: inherit;
  background: linear-gradient(120deg, currentColor 40%, #fff 50%, currentColor 60%);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: shiny-sweep 3s ease-in-out infinite;
}
@keyframes shiny-sweep { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }

───── 7. DECRYPTED TEXT (Matrix-style reveal) ─────
document.querySelectorAll('.decrypt-text').forEach(el => {
  const final = el.textContent; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let revealed = 0;
  const obs = new IntersectionObserver(entries => { entries.forEach(entry => { if(entry.isIntersecting) { obs.unobserve(el);
    const iv = setInterval(() => {
      el.textContent = final.split('').map((ch, i) => i < revealed ? ch : chars[Math.random()*chars.length|0]).join('');
      revealed += 2; if(revealed >= final.length) { el.textContent = final; clearInterval(iv); }
    }, 40);
  }});}, { threshold: 0.3 }); obs.observe(el);
});

───── 8. TYPEWRITER EFFECT (typing + cursor) ─────
document.querySelectorAll('.typewriter').forEach(el => {
  const text = el.dataset.text || el.textContent; el.textContent = '';
  el.style.borderRight = '2px solid currentColor';
  let i = 0;
  const obs = new IntersectionObserver(entries => { entries.forEach(entry => { if(entry.isIntersecting) { obs.unobserve(el);
    const iv = setInterval(() => { el.textContent = text.slice(0, ++i); if(i >= text.length) clearInterval(iv); }, 60);
  }});}, { threshold: 0.3 }); obs.observe(el);
});
CSS: .typewriter { animation: blink-cursor 0.7s step-end infinite; }
@keyframes blink-cursor { 50% { border-color: transparent; } }

───── 9. ROTATING TEXT (cycling words) ─────
document.querySelectorAll('.rotating-text').forEach(el => {
  const words = el.dataset.words.split(','); let idx = 0;
  const span = document.createElement('span'); span.style.display='inline-block';
  span.textContent = words[0]; el.textContent=''; el.appendChild(span);
  setInterval(() => {
    gsap.to(span, { y: -20, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
      idx = (idx+1) % words.length; span.textContent = words[idx];
      gsap.fromTo(span, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
    }});
  }, 2500);
});

───── 10. COUNT-UP NUMBERS (stats/metrics) ─────
document.querySelectorAll('.count-up').forEach(el => {
  const to = parseFloat(el.dataset.to); const prefix = el.dataset.prefix||''; const suffix = el.dataset.suffix||'';
  el.textContent = prefix + '0' + suffix;
  const obs = new IntersectionObserver(entries => { entries.forEach(entry => { if(entry.isIntersecting) { obs.unobserve(el);
    const start = performance.now();
    (function step(now) { const t = Math.min((now-start)/2000,1); const ease = 1-Math.pow(1-t,4);
      el.textContent = prefix + Math.round(to*ease).toLocaleString() + suffix;
      if(t<1) requestAnimationFrame(step);
    })(start);
  }});}, { threshold: 0.3 }); obs.observe(el);
});

═══ BACKGROUND EFFECTS (10 effects) ═══

───── 11. AURORA BACKGROUND (OGL WebGL — hero/CTA) ─────
REAL WebGL aurora with Perlin noise waves + 3-color gradient:
<div id="aurora-bg" style="position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;"></div>
<script type="module">
import{Renderer,Program,Mesh,Color,Triangle}from'ogl';
(function(){const ctn=document.getElementById('aurora-bg');if(!ctn)return;
const renderer=new Renderer({alpha:true,premultipliedAlpha:true,antialias:true});
const gl=renderer.gl;gl.clearColor(0,0,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
gl.canvas.style.backgroundColor='transparent';gl.canvas.style.width='100%';gl.canvas.style.height='100%';
const V=\`#version 300 es\\nin vec2 position;\\nvoid main(){gl_Position=vec4(position,0.0,1.0);}\`;
const F=\`#version 300 es\\nprecision highp float;uniform float uTime;uniform float uAmplitude;uniform vec3 uColorStops[3];uniform vec2 uResolution;uniform float uBlend;out vec4 fragColor;
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;
vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}
struct CS{vec3 color;float position;};
void main(){vec2 uv=gl_FragCoord.xy/uResolution;CS c[3];c[0]=CS(uColorStops[0],0.0);c[1]=CS(uColorStops[1],0.5);c[2]=CS(uColorStops[2],1.0);
int idx=0;for(int i=0;i<2;i++){if(c[i].position<=uv.x)idx=i;}
vec3 rc=mix(c[idx].color,c[idx+1].color,(uv.x-c[idx].position)/(c[idx+1].position-c[idx].position));
float ht=snoise(vec2(uv.x*2.0+uTime*0.1,uTime*0.25))*0.5*uAmplitude;ht=exp(ht);ht=(uv.y*2.0-ht+0.2);
float intensity=0.6*ht;float mp=0.20;float aa=smoothstep(mp-uBlend*0.5,mp+uBlend*0.5,intensity);
fragColor=vec4(intensity*rc*aa,aa);}\`;
const geo=new Triangle(gl);if(geo.attributes.uv)delete geo.attributes.uv;
const colors=[new Color('#5227FF'),new Color('#7cff67'),new Color('#5227FF')].map(c=>[c.r,c.g,c.b]);
const prog=new Program(gl,{vertex:V,fragment:F,uniforms:{uTime:{value:0},uAmplitude:{value:1.0},uColorStops:{value:colors},uResolution:{value:[ctn.offsetWidth,ctn.offsetHeight]},uBlend:{value:0.5}}});
const mesh=new Mesh(gl,{geometry:geo,program:prog});ctn.appendChild(gl.canvas);
function resize(){renderer.setSize(ctn.offsetWidth,ctn.offsetHeight);prog.uniforms.uResolution.value=[ctn.offsetWidth,ctn.offsetHeight];}
window.addEventListener('resize',resize);resize();
(function u(t){requestAnimationFrame(u);prog.uniforms.uTime.value=t*0.001;renderer.render({scene:mesh});})(0);
})();
</script>
Customize colors: change the Color('#5227FF'),Color('#7cff67'),Color('#5227FF') to match the page palette.

───── 12. 3D PARTICLES (OGL WebGL — floating point cloud with glow) ─────
200 particles in 3D space with perspective, rotation, and soft glow:
<div id="particles-bg" style="position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;"></div>
<script type="module">
import{Renderer,Camera,Geometry,Program,Mesh}from'ogl';
(function(){const ctn=document.getElementById('particles-bg');if(!ctn)return;
const renderer=new Renderer({alpha:true,antialias:false,dpr:Math.min(window.devicePixelRatio||1,2)});
const gl=renderer.gl;gl.canvas.style.width='100%';gl.canvas.style.height='100%';
const camera=new Camera(gl,{fov:15});camera.position.set(0,0,20);
const N=200;const pos=new Float32Array(N*3),rnd=new Float32Array(N*4),col=new Float32Array(N*3);
const pal=[[1,1,1],[0.32,0.15,1],[0.44,1,0.4]];
for(let i=0;i<N;i++){let x,y,z,l;do{x=Math.random()*2-1;y=Math.random()*2-1;z=Math.random()*2-1;l=x*x+y*y+z*z;}while(l>1||l===0);
const r=Math.cbrt(Math.random());pos.set([x*r,y*r,z*r],i*3);rnd.set([Math.random(),Math.random(),Math.random(),Math.random()],i*4);
const c=pal[Math.floor(Math.random()*pal.length)];col.set(c,i*3);}
const geo=new Geometry(gl,{position:{size:3,data:pos},random:{size:4,data:rnd},color:{size:3,data:col}});
const V=\`attribute vec3 position;attribute vec4 random;attribute vec3 color;uniform mat4 modelMatrix;uniform mat4 viewMatrix;uniform mat4 projectionMatrix;uniform float uTime;varying vec4 vR;varying vec3 vC;
void main(){vR=random;vC=color;vec3 p=position*10.0;p.z*=10.0;vec4 mP=modelMatrix*vec4(p,1.0);float t=uTime;
mP.x+=sin(t*random.z+6.28*random.w)*mix(0.1,1.5,random.x);mP.y+=sin(t*random.y+6.28*random.x)*mix(0.1,1.5,random.w);
mP.z+=sin(t*random.w+6.28*random.y)*mix(0.1,1.5,random.z);vec4 mv=viewMatrix*mP;
gl_PointSize=(100.0*(1.0+(random.x-0.5)))/length(mv.xyz);gl_Position=projectionMatrix*mv;}\`;
const F=\`precision highp float;uniform float uTime;varying vec4 vR;varying vec3 vC;void main(){vec2 uv=gl_PointCoord.xy;float d=length(uv-vec2(0.5));
float c=smoothstep(0.5,0.4,d)*0.8;gl_FragColor=vec4(vC+0.2*sin(uv.yxx+uTime+vR.y*6.28),c);}\`;
const prog=new Program(gl,{vertex:V,fragment:F,uniforms:{uTime:{value:0}},transparent:true,depthTest:false});
const mesh=new Mesh(gl,{geometry:geo,program:prog,mode:gl.POINTS});
function resize(){renderer.setSize(ctn.offsetWidth,ctn.offsetHeight);camera.perspective({aspect:gl.canvas.width/gl.canvas.height});}
window.addEventListener('resize',resize);resize();ctn.appendChild(gl.canvas);
let el=0,lt=performance.now();
(function u(t){requestAnimationFrame(u);el+=(t-lt);lt=t;prog.uniforms.uTime.value=el*0.001;
mesh.rotation.x=Math.sin(el*0.0002)*0.1;mesh.rotation.y=Math.cos(el*0.0005)*0.15;mesh.rotation.z+=0.01;
renderer.render({scene:mesh,camera});})(performance.now());
})();
</script>
Customize colors: change the pal array [[r,g,b],...] to match page palette. Values are 0-1 range.

───── 13. WAVES BACKGROUND (Canvas 2D Perlin noise lines) ─────
Animated flowing wave lines using Perlin noise — mouse-reactive:
<canvas id="waves-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
<script>
(function(){const c=document.getElementById('waves-bg'),ctx=c.getContext('2d');
let w,h,mx=-10,my=0,t=0;
const P=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
const perm=new Array(512),gp=new Array(512);
const G=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
for(let i=0;i<256;i++){perm[i]=perm[i+256]=P[i];gp[i]=gp[i+256]=G[P[i]%8];}
function noise(px,py){let X=Math.floor(px),Y=Math.floor(py);px-=X;py-=Y;X&=255;Y&=255;
  const f=t=>t*t*t*(t*(t*6-15)+10);
  const d=(g,x,y)=>g[0]*x+g[1]*y;
  const u=f(px),v=f(py);
  return(1-v)*((1-u)*d(gp[X+perm[Y]],px,py)+u*d(gp[X+1+perm[Y]],px-1,py))+v*((1-u)*d(gp[X+perm[Y+1]],px,py-1)+u*d(gp[X+1+perm[Y+1]],px-1,py-1));}
function resize(){w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;}
window.addEventListener('resize',resize);resize();
window.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
(function draw(){t+=0.5;ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;
  for(let i=0;i<w+20;i+=12){ctx.beginPath();
    for(let j=0;j<h+20;j+=28){const n=noise((i+t*1.5)*0.002,(j+t*0.8)*0.0015)*12;
      const px=i+Math.cos(n)*30,py=j+Math.sin(n)*15;
      j===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
    ctx.stroke();}
  requestAnimationFrame(draw);})();})();
</script>

───── 14. SQUARES GRID BACKGROUND (Canvas 2D scrolling grid) ─────
Animated scrolling grid with hover highlight:
<canvas id="squares-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
<script>
(function(){const c=document.getElementById('squares-bg'),ctx=c.getContext('2d');
let w,h,ox=0,oy=0,hx=-1,hy=-1;const sz=40,spd=0.5;
function resize(){w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;}
window.addEventListener('resize',resize);resize();
c.style.pointerEvents='auto';
c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();
  hx=Math.floor((e.clientX-r.left+ox%sz)/sz);hy=Math.floor((e.clientY-r.top+oy%sz)/sz);});
c.addEventListener('mouseleave',()=>{hx=hy=-1;});
(function draw(){ox=(ox+spd)%sz;oy=(oy+spd*0.3)%sz;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,0.06)';
  for(let x=-sz;x<w+sz;x+=sz){for(let y=-sz;y<h+sz;y+=sz){
    const px=x-(ox%sz),py=y-(oy%sz);
    const gx=Math.floor((x+ox%sz)/sz),gy=Math.floor((y+oy%sz)/sz);
    if(gx===hx&&gy===hy){ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(px,py,sz,sz);}
    ctx.strokeRect(px,py,sz,sz);}}
  const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.hypot(w,h)/2);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.6)');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  requestAnimationFrame(draw);})();})();
</script>

───── 15. DOT GRID (Canvas 2D with proximity highlight) ─────
<canvas id="dotgrid-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
<script>
(function(){const c=document.getElementById('dotgrid-bg'),ctx=c.getContext('2d');
let w,h,mx=0,my=0; const gap=32,dotR=2,prox=150;
function resize(){w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;}
window.addEventListener('resize',resize);resize();
window.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});
(function draw(){ctx.clearRect(0,0,w,h);
  for(let x=gap;x<w;x+=gap){for(let y=gap;y<h;y+=gap){
    const d=Math.hypot(x-mx,y-my);
    const t=Math.max(0,1-d/prox);
    ctx.beginPath();ctx.arc(x,y,dotR+t*3,0,Math.PI*2);
    ctx.fillStyle=t>0?'rgba(82,39,255,'+(0.2+t*0.8)+')':'rgba(255,255,255,0.12)';ctx.fill();}}
  requestAnimationFrame(draw);})();})();
</script>

───── 16. IRIDESCENCE BACKGROUND (OGL WebGL — mouse-reactive rainbow) ─────
Real WebGL iridescent interference pattern — shifts with mouse:
<div id="iridescence-bg" style="position:absolute;inset:0;z-index:0;pointer-events:auto;overflow:hidden;"></div>
<script type="module">
import{Renderer,Program,Mesh,Color,Triangle}from'ogl';
(function(){const ctn=document.getElementById('iridescence-bg');if(!ctn)return;
const renderer=new Renderer();const gl=renderer.gl;gl.clearColor(1,1,1,1);
gl.canvas.style.width='100%';gl.canvas.style.height='100%';
const V=\`attribute vec2 uv;attribute vec2 position;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0,1);}\`;
const F=\`precision highp float;uniform float uTime;uniform vec3 uColor;uniform vec3 uResolution;uniform vec2 uMouse;uniform float uAmplitude;uniform float uSpeed;varying vec2 vUv;
void main(){float mr=min(uResolution.x,uResolution.y);vec2 uv=(vUv.xy*2.0-1.0)*uResolution.xy/mr;
uv+=(uMouse-vec2(0.5))*uAmplitude;float d=-uTime*0.5*uSpeed;float a=0.0;
for(float i=0.0;i<8.0;++i){a+=cos(i-d-a*uv.x);d+=sin(uv.y*i+a);}d+=uTime*0.5*uSpeed;
vec3 col=vec3(cos(uv*vec2(d,a))*0.6+0.4,cos(a+d)*0.5+0.5);col=cos(col*cos(vec3(d,a,2.5))*0.5+0.5)*uColor;
gl_FragColor=vec4(col,1.0);}\`;
const geo=new Triangle(gl);
const prog=new Program(gl,{vertex:V,fragment:F,uniforms:{uTime:{value:0},uColor:{value:new Color(1,1,1)},
  uResolution:{value:new Color(gl.canvas.width,gl.canvas.height,gl.canvas.width/gl.canvas.height)},
  uMouse:{value:new Float32Array([0.5,0.5])},uAmplitude:{value:0.1},uSpeed:{value:1.0}}});
const mesh=new Mesh(gl,{geometry:geo,program:prog});
function resize(){renderer.setSize(ctn.offsetWidth,ctn.offsetHeight);
  prog.uniforms.uResolution.value=new Color(gl.canvas.width,gl.canvas.height,gl.canvas.width/gl.canvas.height);}
window.addEventListener('resize',resize);resize();
ctn.addEventListener('mousemove',e=>{const r=ctn.getBoundingClientRect();
  prog.uniforms.uMouse.value[0]=(e.clientX-r.left)/r.width;prog.uniforms.uMouse.value[1]=1-(e.clientY-r.top)/r.height;});
ctn.appendChild(gl.canvas);
(function u(t){requestAnimationFrame(u);prog.uniforms.uTime.value=t*0.001;renderer.render({scene:mesh});})(0);
})();
</script>

───── 17. LIQUID CHROME BACKGROUND (OGL WebGL — metallic ripples) ─────
Liquid metal chrome effect with mouse-reactive ripples:
<div id="chrome-bg" style="position:absolute;inset:0;z-index:0;pointer-events:auto;overflow:hidden;"></div>
<script type="module">
import{Renderer,Program,Mesh,Triangle}from'ogl';
(function(){const ctn=document.getElementById('chrome-bg');if(!ctn)return;
const renderer=new Renderer({antialias:true});const gl=renderer.gl;gl.clearColor(1,1,1,1);
gl.canvas.style.width='100%';gl.canvas.style.height='100%';
const V=\`attribute vec2 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0.0,1.0);}\`;
const F=\`precision highp float;uniform float uTime;uniform vec3 uResolution;uniform vec3 uBaseColor;uniform float uAmplitude;uniform float uFrequencyX;uniform float uFrequencyY;uniform vec2 uMouse;varying vec2 vUv;
vec4 ri(vec2 uvCoord){vec2 fragCoord=uvCoord*uResolution.xy;vec2 uv=(2.0*fragCoord-uResolution.xy)/min(uResolution.x,uResolution.y);
for(float i=1.0;i<10.0;i++){uv.x+=uAmplitude/i*cos(i*uFrequencyX*uv.y+uTime+uMouse.x*3.14159);uv.y+=uAmplitude/i*cos(i*uFrequencyY*uv.x+uTime+uMouse.y*3.14159);}
vec2 diff=(uvCoord-uMouse);float dist=length(diff);float falloff=exp(-dist*20.0);float ripple=sin(10.0*dist-uTime*2.0)*0.03;
uv+=(diff/(dist+0.0001))*ripple*falloff;vec3 color=uBaseColor/abs(sin(uTime-uv.y-uv.x));return vec4(color,1.0);}
void main(){vec4 col=vec4(0.0);for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){col+=ri(vUv+vec2(float(i),float(j))*(1.0/min(uResolution.x,uResolution.y)));}gl_FragColor=col/9.0;}\`;
const geo=new Triangle(gl);
const prog=new Program(gl,{vertex:V,fragment:F,uniforms:{uTime:{value:0},
  uResolution:{value:new Float32Array([gl.canvas.width,gl.canvas.height,gl.canvas.width/gl.canvas.height])},
  uBaseColor:{value:new Float32Array([0.1,0.1,0.1])},uAmplitude:{value:0.3},uFrequencyX:{value:3},uFrequencyY:{value:3},
  uMouse:{value:new Float32Array([0,0])}}});
const mesh=new Mesh(gl,{geometry:geo,program:prog});
function resize(){renderer.setSize(ctn.offsetWidth,ctn.offsetHeight);const r=prog.uniforms.uResolution.value;r[0]=gl.canvas.width;r[1]=gl.canvas.height;r[2]=gl.canvas.width/gl.canvas.height;}
window.addEventListener('resize',resize);resize();
ctn.addEventListener('mousemove',e=>{const r=ctn.getBoundingClientRect();prog.uniforms.uMouse.value[0]=(e.clientX-r.left)/r.width;prog.uniforms.uMouse.value[1]=1-(e.clientY-r.top)/r.height;});
ctn.appendChild(gl.canvas);
(function u(t){requestAnimationFrame(u);prog.uniforms.uTime.value=t*0.001*0.2;renderer.render({scene:mesh});})(0);
})();
</script>
Change uBaseColor to match page theme: [0.1,0.1,0.1]=dark, [0.8,0.2,0.4]=warm, [0.1,0.3,0.6]=cool.

───── 18. BEAMS BACKGROUND (vertical light strips) ─────
.beams-bg { position:absolute; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.beams-bg span {
  position:absolute; top:-100%; width:2px; height:200%; opacity:0.1;
  background:linear-gradient(to bottom, transparent, white, transparent);
  animation: beam-fall linear infinite;
}
Generate 8-12 beam <span>s with varying left%, animation-duration (4-12s), animation-delay (0-5s), opacity (0.05-0.15):
<div class="beams-bg">
  <span style="left:10%;animation-duration:8s;animation-delay:0s;opacity:0.08;"></span>
  <span style="left:25%;animation-duration:6s;animation-delay:1.5s;opacity:0.12;"></span>
  ...etc
</div>
@keyframes beam-fall { 0%{transform:translateY(-50%)} 100%{transform:translateY(50%)} }

───── 19. BALATRO BACKGROUND (OGL WebGL — psychedelic pixelated swirl) ─────
Hypnotic pixelated paint-swirl effect — vibrant and eye-catching:
<div id="balatro-bg" style="position:absolute;inset:0;z-index:0;pointer-events:auto;overflow:hidden;"></div>
<script type="module">
import{Renderer,Program,Mesh,Triangle}from'ogl';
(function(){const ctn=document.getElementById('balatro-bg');if(!ctn)return;
const renderer=new Renderer();const gl=renderer.gl;gl.clearColor(0,0,0,1);gl.canvas.style.width='100%';gl.canvas.style.height='100%';
const V=\`attribute vec2 uv;attribute vec2 position;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0,1);}\`;
const F=\`precision highp float;
#define PI 3.14159265359
uniform float iTime;uniform vec3 iResolution;uniform vec4 uColor1;uniform vec4 uColor2;uniform vec4 uColor3;
uniform float uContrast;uniform float uLighting;uniform float uSpinAmount;uniform float uPixelFilter;uniform float uSpinEase;uniform float uSpinSpeed;
varying vec2 vUv;
vec4 effect(vec2 ss,vec2 sc){float ps=length(ss)/uPixelFilter;vec2 uv=(floor(sc*(1.0/ps))*ps-0.5*ss)/length(ss);
float ul=length(uv);float spd=302.2+iTime*uSpinEase*-0.4;float npa=atan(uv.y,uv.x)+spd-uSpinEase*20.0*(uSpinAmount*ul+(1.0-uSpinAmount));
vec2 mid=(ss/length(ss))/2.0;uv=vec2(ul*cos(npa)+mid.x,ul*sin(npa)+mid.y)-mid;uv*=30.0;
float speed=iTime*uSpinSpeed;vec2 uv2=vec2(uv.x+uv.y);
for(int i=0;i<5;i++){uv2+=sin(max(uv.x,uv.y))+uv;uv+=0.5*vec2(cos(5.1123314+0.353*uv2.y+speed*0.131121),sin(uv2.x-0.113*speed));uv-=cos(uv.x+uv.y)-sin(uv.x*0.711-uv.y);}
float cm=(0.25*uContrast+0.5*uSpinAmount+1.2);float pr=min(2.0,max(0.0,length(uv)*0.035*cm));
float c1=max(0.0,1.0-cm*abs(1.0-pr));float c2=max(0.0,1.0-cm*abs(pr));float c3=1.0-min(1.0,c1+c2);
float lt=(uLighting-0.2)*max(c1*5.0-4.0,0.0)+uLighting*max(c2*5.0-4.0,0.0);
return(0.3/uContrast)*uColor1+(1.0-0.3/uContrast)*(uColor1*c1+uColor2*c2+vec4(c3*uColor3.rgb,c3*uColor1.a))+lt;}
void main(){gl_FragColor=effect(iResolution.xy,vUv*iResolution.xy);}\`;
const geo=new Triangle(gl);
const prog=new Program(gl,{vertex:V,fragment:F,uniforms:{iTime:{value:0},
iResolution:{value:new Float32Array([gl.canvas.width,gl.canvas.height,gl.canvas.width/gl.canvas.height])},
uColor1:{value:new Float32Array([0.871,0.267,0.231,1])},uColor2:{value:new Float32Array([0,0.42,0.706,1])},
uColor3:{value:new Float32Array([0.086,0.137,0.145,1])},
uContrast:{value:3.5},uLighting:{value:0.4},uSpinAmount:{value:0.25},uPixelFilter:{value:745},uSpinEase:{value:1},uSpinSpeed:{value:7}}});
const mesh=new Mesh(gl,{geometry:geo,program:prog});
function resize(){renderer.setSize(ctn.offsetWidth,ctn.offsetHeight);const r=prog.uniforms.iResolution.value;r[0]=gl.canvas.width;r[1]=gl.canvas.height;r[2]=gl.canvas.width/gl.canvas.height;}
window.addEventListener('resize',resize);resize();ctn.appendChild(gl.canvas);
(function u(t){requestAnimationFrame(u);prog.uniforms.iTime.value=t*0.001;renderer.render({scene:mesh});})(0);
})();
</script>
Customize: uColor1=red/warm, uColor2=blue/cool, uColor3=dark. Values are vec4 [r,g,b,a] 0-1. Increase uPixelFilter for finer pixels.

───── 20. GRAINIENT BACKGROUND (OGL WebGL 2 — noise gradient with grain) ─────
Flowing noise-driven gradient with built-in film grain. Requires WebGL 2:
<div id="grainient-bg" style="position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;"></div>
<script type="module">
import{Renderer,Program,Mesh,Triangle}from'ogl';
(function(){const ctn=document.getElementById('grainient-bg');if(!ctn)return;
const renderer=new Renderer({webgl:2,alpha:true,antialias:false,dpr:Math.min(window.devicePixelRatio||1,2)});
const gl=renderer.gl;gl.canvas.style.width='100%';gl.canvas.style.height='100%';
const V=\`#version 300 es\\nin vec2 position;\\nvoid main(){gl_Position=vec4(position,0,1);}\`;
const F=\`#version 300 es\\nprecision highp float;uniform vec2 iResolution;uniform float iTime;uniform vec3 uColor1;uniform vec3 uColor2;uniform vec3 uColor3;out vec4 fragColor;
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i),f),dot(-1.0+2.0*hash(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0,1)),f-vec2(0,1)),dot(-1.0+2.0*hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);return 0.5+0.5*n;}
void main(){float t=iTime*0.25;vec2 uv=gl_FragCoord.xy/iResolution;float r=iResolution.x/iResolution.y;
vec2 tuv=uv-0.5;tuv/=0.9;float deg=noise(vec2(t*0.1,tuv.x*tuv.y)*2.0);tuv.y/=r;tuv*=Rot(radians((deg-0.5)*500.0+180.0));tuv.y*=r;
tuv.x+=sin(tuv.y*5.0+t*2.0)/50.0;tuv.y+=sin(tuv.x*7.5+t*2.0)/25.0;
mat2 bR=Rot(0.0);float bX=(tuv*bR).x;vec3 l1=mix(uColor3,uColor2,smoothstep(-0.35,0.25,bX));
vec3 l2=mix(uColor2,uColor1,smoothstep(-0.35,0.25,bX));vec3 col=mix(l1,l2,smoothstep(0.55,-0.35,tuv.y));
float grain=fract(sin(dot(uv*2.0,vec2(12.9898,78.233)))*43758.5453);col+=(grain-0.5)*0.1;
col=(col-0.5)*1.5+0.5;col=clamp(col,0.0,1.0);fragColor=vec4(col,1.0);}\`;
const geo=new Triangle(gl);if(geo.attributes.uv)delete geo.attributes.uv;
const prog=new Program(gl,{vertex:V,fragment:F,uniforms:{iTime:{value:0},
iResolution:{value:new Float32Array([gl.canvas.width,gl.canvas.height])},
uColor1:{value:new Float32Array([1,0.624,0.988])},uColor2:{value:new Float32Array([0.322,0.153,1])},uColor3:{value:new Float32Array([0.694,0.62,0.937])}}});
const mesh=new Mesh(gl,{geometry:geo,program:prog});
function resize(){renderer.setSize(ctn.offsetWidth,ctn.offsetHeight);prog.uniforms.iResolution.value=new Float32Array([gl.canvas.width,gl.canvas.height]);}
window.addEventListener('resize',resize);resize();ctn.appendChild(gl.canvas);
const t0=performance.now();
(function u(t){requestAnimationFrame(u);prog.uniforms.iTime.value=(t-t0)*0.001;renderer.render({scene:mesh});})(performance.now());
})();
</script>
Customize: uColor1=pink/warm, uColor2=blue/purple, uColor3=soft lavender. All vec3 [r,g,b] 0-1.
TIP: For extra subtle film grain overlay on top of everything, add:
<canvas id="grain" style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;opacity:0.04;"></canvas>
<script>(function(){const c=document.getElementById('grain'),x=c.getContext('2d');c.width=c.height=256;(function d(){const i=x.createImageData(256,256);for(let j=0;j<i.data.length;j+=4){const v=Math.random()*255;i.data[j]=i.data[j+1]=i.data[j+2]=v;i.data[j+3]=20;}x.putImageData(i,0,0);requestAnimationFrame(d);})();})()</script>

═══ HOVER/INTERACTION EFFECTS (12 effects) ═══

───── 21. SPOTLIGHT CARDS (cursor-following light) ─────
.card-spotlight {
  position:relative; border-radius:1.5rem; border:1px solid rgba(255,255,255,0.08);
  background:#111; overflow:hidden; --mx:50%; --my:50%;
}
.card-spotlight::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.15), transparent 70%);
  opacity:0; transition:opacity 0.4s;
}
.card-spotlight:hover::before { opacity:1; }
JS: document.querySelectorAll('.card-spotlight').forEach(c => {
  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX-r.left)+'px');
    c.style.setProperty('--my', (e.clientY-r.top)+'px');
  });
});

───── 22. TILT CARD (3D perspective on hover) ─────
.tilt-card { perspective:800px; }
.tilt-card-inner { transition:transform 0.1s ease-out; transform-style:preserve-3d; }
JS: document.querySelectorAll('.tilt-card').forEach(card => {
  const inner = card.querySelector('.tilt-card-inner') || card;
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    inner.style.transform = 'rotateY('+x*15+'deg) rotateX('+(-y*15)+'deg) scale(1.02)';
  });
  card.addEventListener('mouseleave', () => { inner.style.transform = 'rotateY(0) rotateX(0) scale(1)'; });
});

───── 23. GLARE HOVER (shine sweep on cards) ─────
.glare-card { position:relative; overflow:hidden; }
.glare-card::after {
  content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%;
  background:linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
  transition:transform 0.5s ease; transform:translateX(-100%) rotate(0deg);
}
.glare-card:hover::after { transform:translateX(100%) rotate(0deg); }

───── 24. ELECTRIC BORDER (Canvas 2D noise border) ─────
Use around hero CTA or key cards — animated jittery border using procedural noise:
<div style="position:relative;display:inline-block;">
  <canvas class="electric-border" style="position:absolute;inset:-30px;width:calc(100%+60px);height:calc(100%+60px);pointer-events:none;z-index:1;"></canvas>
  <div style="position:relative;z-index:2;">...content...</div>
</div>
<script>
document.querySelectorAll('.electric-border').forEach(c => {
  const ctx=c.getContext('2d'); let t=0;
  const noise=(x,s)=>(Math.sin(x*12.9898+s*78.233)*43758.5453)%1;
  function draw(){t+=0.02; const w=c.width=c.offsetWidth,h=c.height=c.offsetHeight;
    ctx.clearRect(0,0,w,h); ctx.strokeStyle='#5227FF'; ctx.lineWidth=1; ctx.beginPath();
    const pad=30,r=20,steps=200;
    for(let i=0;i<=steps;i++){const p=i/steps; let px,py;
      const perim=2*(w-2*pad-2*r)+2*(h-2*pad-2*r)+2*Math.PI*r;
      const d=p*perim; /* walk around rounded rect */
      const sw=w-2*pad,sh=h-2*pad,se=sw-2*r,st=sh-2*r;
      let acc=0;
      if(d<se){px=pad+r+d;py=pad;}
      else if(d<se+Math.PI*r/2){const a=(d-se)/(r);px=pad+sw-r+Math.cos(a-Math.PI/2)*r;py=pad+r+Math.sin(a-Math.PI/2)*r;}
      else if(d<se+Math.PI*r/2+st){const o=d-se-Math.PI*r/2;px=pad+sw;py=pad+r+o;}
      else if(d<se+Math.PI*r+st){const a=(d-se-Math.PI*r/2-st)/(r);px=pad+sw-r+Math.cos(a)*r;py=pad+sh-r+Math.sin(a)*r;}
      else if(d<2*se+Math.PI*r+st){const o=d-2*se-Math.PI*r-st+se;px=pad+sw-r-o+se;py=pad+sh;}
      else{px=pad;py=pad+sh/2;}
      const nx=noise(p*8+t,0)*10, ny=noise(p*8+t,1)*10;
      i===0?ctx.moveTo(px+nx,py+ny):ctx.lineTo(px+nx,py+ny);}
    ctx.closePath();ctx.stroke();requestAnimationFrame(draw);}draw();});
</script>

───── 25. CLICK SPARK (radial burst on click) ─────
<canvas id="click-spark" style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9998;"></canvas>
<script>
(function(){const c=document.getElementById('click-spark'),ctx=c.getContext('2d');
c.width=window.innerWidth;c.height=window.innerHeight;
window.addEventListener('resize',()=>{c.width=innerWidth;c.height=innerHeight;});
let sparks=[];
document.addEventListener('click',e=>{
  for(let i=0;i<10;i++)sparks.push({x:e.clientX,y:e.clientY,angle:Math.PI*2*i/10,t:0});
});
(function draw(){ctx.clearRect(0,0,c.width,c.height);
  sparks=sparks.filter(s=>{s.t+=0.03;if(s.t>=1)return false;
    const d=s.t*20,len=8*(1-s.t);
    const x1=s.x+d*Math.cos(s.angle),y1=s.y+d*Math.sin(s.angle);
    const x2=s.x+(d+len)*Math.cos(s.angle),y2=s.y+(d+len)*Math.sin(s.angle);
    ctx.strokeStyle='rgba(255,255,255,'+(1-s.t)+')';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();return true;});
  requestAnimationFrame(draw);})();})();
</script>

───── 26. MAGNET LINES (CSS grid lines pointing to cursor) ─────
.magnet-lines { display:grid; grid-template-columns:repeat(auto-fill,40px); gap:0; position:absolute; inset:0; z-index:0; pointer-events:none; }
.magnet-lines span { width:40px; height:40px; display:flex; align-items:center; justify-content:center; }
.magnet-lines span::after { content:''; width:2px; height:20px; background:rgba(255,255,255,0.1); transform:rotate(var(--rotate,0deg)); transition:transform 0.3s; }
JS: const mlContainer = document.querySelector('.magnet-lines');
if(mlContainer){const lines=[...mlContainer.querySelectorAll('span')];
  document.addEventListener('mousemove',e=>{lines.forEach(l=>{
    const r=l.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    const angle=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90;
    l.style.setProperty('--rotate',angle+'deg');
  });});}

───── 27. MAGNET PULL (elements attract toward cursor) ─────
document.querySelectorAll('.magnet').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width/2) * 0.3;
    const y = (e.clientY - r.top - r.height/2) * 0.3;
    el.style.transform = 'translate3d('+x+'px,'+y+'px,0)';
  });
  el.addEventListener('mouseleave', () => { el.style.transform = 'translate3d(0,0,0)'; el.style.transition = 'transform 0.4s ease'; });
  el.addEventListener('mouseenter', () => { el.style.transition = 'none'; });
});

───── 28. STAR BORDER (animated orbiting glow) ─────
.star-border { position:relative; display:inline-block; border-radius:20px; overflow:hidden; padding:1px; }
.star-border::before,.star-border::after {
  content:''; position:absolute; width:300%; height:50%; opacity:0.7; border-radius:50%;
  background:radial-gradient(circle,white,transparent 10%); z-index:0;
}
.star-border::before { top:-12px; left:-250%; animation:star-orbit 6s linear infinite alternate; }
.star-border::after { bottom:-12px; right:-250%; animation:star-orbit 6s linear infinite alternate-reverse; }
.star-border > * { position:relative; z-index:1; }
@keyframes star-orbit { 0%{transform:translateX(0);opacity:1} 100%{transform:translateX(-100%);opacity:0} }

───── 29. GLASSMORPHISM CARDS ─────
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

───── 30. HOVER LIFT CARDS ─────
.hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.hover-lift:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }

───── 31. DECAY CARD (SVG distortion on hover) ─────
<svg style="position:absolute;width:0;height:0;"><defs>
  <filter id="decay"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" seed="1"/>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>
</defs></svg>
.decay-card { filter:url(#decay); transition:filter 0.5s; }
.decay-card:hover { filter:url(#decay); }
JS: document.querySelectorAll('.decay-card').forEach(card => {
  const filter = document.querySelector('#decay feDisplacementMap');
  card.addEventListener('mouseenter', () => gsap.to(filter, { attr: { scale: 15 }, duration: 0.5 }));
  card.addEventListener('mouseleave', () => gsap.to(filter, { attr: { scale: 0 }, duration: 0.8, ease: 'elastic.out(1,0.4)' }));
});

───── 32. PIXEL CARD (Canvas 2D shimmer on hover) ─────
.pixel-card { position:relative; overflow:hidden; }
JS: document.querySelectorAll('.pixel-card').forEach(card => {
  const cvs = document.createElement('canvas');
  cvs.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10;opacity:0;transition:opacity 0.3s;';
  card.appendChild(cvs); const ctx=cvs.getContext('2d');
  card.addEventListener('mouseenter',()=>{cvs.style.opacity='1';});
  card.addEventListener('mouseleave',()=>{cvs.style.opacity='0';});
  let active=false;
  (function draw(){if(card.matches(':hover')){cvs.width=card.offsetWidth;cvs.height=card.offsetHeight;
    for(let i=0;i<20;i++){ctx.fillStyle='rgba(255,255,255,'+(Math.random()*0.3)+')';
      ctx.fillRect(Math.random()*cvs.width,Math.random()*cvs.height,2,2);}}
    requestAnimationFrame(draw);})();
});

═══ SCROLL & SECTION ANIMATIONS (8 effects) ═══

───── 33. ANIMATED CONTENT ENTRANCE (every section) ─────
gsap.registerPlugin(ScrollTrigger);
document.querySelectorAll('[data-animate]').forEach(el => {
  const dir = el.dataset.animate || 'up';
  const from = { opacity:0, y:dir==='up'?60:dir==='down'?-60:0, x:dir==='left'?-60:dir==='right'?60:0 };
  gsap.from(el, { ...from, duration:0.9, ease:'power3.out',
    scrollTrigger: { trigger:el, start:'top 85%', once:true }
  });
});

───── 34. STAGGER CARDS (feature/pricing grids) ─────
document.querySelectorAll('.stagger-cards').forEach(container => {
  gsap.fromTo(container.children, { opacity:0, y:80, scale:0.95 },
    { opacity:1, y:0, scale:1, duration:0.7, ease:'power3.out', stagger:0.15,
      scrollTrigger: { trigger:container, start:'top 80%', once:true }
    });
});

───── 35. FADE CONTENT (blur-to-clear on scroll) ─────
document.querySelectorAll('.fade-content').forEach(el => {
  gsap.fromTo(el, { opacity:0, filter:'blur(10px)', y:30 },
    { opacity:1, filter:'blur(0px)', y:0, duration:1, ease:'power2.out',
      scrollTrigger: { trigger:el, start:'top 85%', once:true }
    });
});

───── 36. PARALLAX ELEMENTS ─────
document.querySelectorAll('[data-parallax]').forEach(el => {
  const speed = parseFloat(el.dataset.parallax) || 0.3;
  gsap.to(el, { yPercent:-20*speed, ease:'none',
    scrollTrigger: { trigger:el.parentElement, start:'top bottom', end:'bottom top', scrub:1 }
  });
});

───── 37. BOUNCE CARDS (fan-out on scroll) ─────
document.querySelectorAll('.bounce-cards').forEach(container => {
  const cards = [...container.children];
  cards.forEach((card, i) => {
    const angle = (i - Math.floor(cards.length/2)) * 8;
    gsap.fromTo(card, { rotation:0, y:100, opacity:0 },
      { rotation:angle, y:0, opacity:1, duration:0.8, ease:'back.out(1.4)', delay:i*0.1,
        scrollTrigger: { trigger:container, start:'top 80%', once:true }
      });
  });
});

───── 38. PIXEL TRANSITION (staggered grid reveal) ─────
document.querySelectorAll('.pixel-transition').forEach(el => {
  const cols=15, rows=10; el.style.position='relative';
  const overlay = document.createElement('div');
  overlay.style.cssText='position:absolute;inset:0;display:grid;grid-template-columns:repeat('+cols+',1fr);z-index:5;pointer-events:none;';
  for(let i=0;i<cols*rows;i++){const px=document.createElement('div');px.style.background='inherit';px.style.opacity='1';overlay.appendChild(px);}
  el.appendChild(overlay);
  gsap.to(overlay.children, { opacity:0, duration:0.4, stagger:{each:0.02,from:'random'},
    scrollTrigger:{trigger:el, start:'top 80%', once:true}
  });
});

───── 39. INFINITE MARQUEE (logo/partner bars) ─────
🎯 PREFERRED: Use React Bits ScrollVelocity for seamless marquee:
import { ScrollVelocity } from "react-bits/text/scroll-velocity"
<ScrollVelocity texts={['PARTNER1', 'PARTNER2', 'PARTNER3']} velocity={80} />
FALLBACK CSS:
.marquee { overflow:hidden; position:relative; width:100%; }
.marquee-track { display:flex; width:max-content; gap:3rem; animation:marquee-scroll 25s linear infinite; }
.marquee-track:hover { animation-play-state:paused; }
@keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
⚠️ CRITICAL: You MUST duplicate ALL items inside marquee-track (every item appears TWICE in the HTML). Without duplication the scroll will show a GAP before restarting. translateX(-50%) = exactly one copy width. This applies to ALL scrolling/marquee text, not just logos!

───── 40. HORIZONTAL SNAP CAROUSEL (testimonials) ─────
.snap-carousel {
  display:flex; gap:1.5rem; overflow-x:auto; scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch; padding-bottom:1rem;
  scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent;
}
.snap-carousel > * { scroll-snap-align:start; flex:0 0 auto; min-width:300px; }

═══ SVG ANIMATIONS (6 effects — Gemini 3.1 Pro excels at these!) ═══

───── 41. MORPHING BLOB (organic shape transitions) ─────
<svg viewBox="0 0 200 200" style="position:absolute;width:300px;height:300px;opacity:0.15;z-index:0;">
  <path fill="currentColor">
    <animate attributeName="d" dur="8s" repeatCount="indefinite" values="
      M40,80 C40,40 80,20 120,40 C160,60 180,100 160,140 C140,180 80,180 60,140 C40,100 40,80 40,80 Z;
      M60,60 C80,20 140,20 160,60 C180,100 160,160 120,160 C80,160 40,120 60,60 Z;
      M40,80 C40,40 80,20 120,40 C160,60 180,100 160,140 C140,180 80,180 60,140 C40,100 40,80 40,80 Z
    "/>
  </path>
</svg>

───── 42. LINE-DRAW ICONS (stroke reveal on scroll) ─────
.line-draw path, .line-draw circle, .line-draw line {
  stroke-dasharray: 200; stroke-dashoffset: 200;
  fill: none; stroke: currentColor; stroke-width: 2;
}
JS: document.querySelectorAll('.line-draw').forEach(svg => {
  gsap.to(svg.querySelectorAll('path,circle,line'), { strokeDashoffset:0, duration:1.5, ease:'power2.inOut', stagger:0.2,
    scrollTrigger: { trigger:svg, start:'top 80%', once:true }
  });
});

───── 43. FLOATING SHAPES (decorative geometry) ─────
<svg class="floating-shapes" viewBox="0 0 400 400" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.1;">
  <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" stroke-width="1">
    <animateTransform attributeName="transform" type="translate" values="0,0;20,-30;0,0" dur="6s" repeatCount="indefinite"/>
  </circle>
  <rect x="250" y="200" width="40" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(45,270,220)">
    <animateTransform attributeName="transform" type="translate" values="0,0;-15,25;0,0" dur="8s" repeatCount="indefinite"/>
  </rect>
  <polygon points="200,50 220,90 180,90" fill="none" stroke="currentColor" stroke-width="1">
    <animateTransform attributeName="transform" type="translate" values="0,0;10,20;0,0" dur="7s" repeatCount="indefinite"/>
  </polygon>
</svg>

───── 44. ANIMATED GRADIENT FILL (color cycling SVG) ─────
<svg style="position:absolute;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.2;">
  <defs>
    <linearGradient id="agrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"><animate attributeName="stop-color" values="#5227FF;#FF006E;#06D6A0;#5227FF" dur="6s" repeatCount="indefinite"/></stop>
      <stop offset="100%"><animate attributeName="stop-color" values="#06D6A0;#5227FF;#FF006E;#06D6A0" dur="6s" repeatCount="indefinite"/></stop>
    </linearGradient>
  </defs>
  <circle cx="50%" cy="50%" r="40%" fill="url(#agrad)" filter="blur(60px)"/>
</svg>

───── 45. PULSE CIRCLES (breathing decorative dots) ─────
<svg style="position:absolute;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.15;">
  <circle cx="15%" cy="30%" fill="currentColor">
    <animate attributeName="r" values="5;15;5" dur="4s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="85%" cy="70%" fill="currentColor">
    <animate attributeName="r" values="8;20;8" dur="5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.2;0.08;0.2" dur="5s" repeatCount="indefinite"/>
  </circle>
</svg>

───── 46. ANIMATED PATH (flowing line decoration) ─────
<svg style="position:absolute;width:100%;height:200px;bottom:0;left:0;pointer-events:none;z-index:0;opacity:0.15;">
  <path d="M0,100 Q100,20 200,100 T400,100 T600,100 T800,100" fill="none" stroke="currentColor" stroke-width="1"
    stroke-dasharray="10 5" stroke-dashoffset="0">
    <animate attributeName="stroke-dashoffset" values="0;-30" dur="2s" repeatCount="indefinite"/>
  </path>
</svg>

═══ LAYOUT UTILITIES (4 essentials) ═══

───── 47. CUSTOM SCROLLBAR ─────
::-webkit-scrollbar { width:8px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:4px; }
::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.2); }
html { scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.12) transparent; }

───── 48. BENTO GRID (magic bento layout) ─────
.bento-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.5rem; }
.bento-grid > :nth-child(1) { grid-column:span 2; grid-row:span 2; }
.bento-grid > :nth-child(4) { grid-column:span 2; }
@media(max-width:768px){ .bento-grid { grid-template-columns:1fr; } .bento-grid > * { grid-column:span 1!important; grid-row:span 1!important; } }

───── 49. SCROLL STACK (overlapping sections) ─────
.scroll-stack > section { position:sticky; top:0; min-height:100vh; }
Each section stacks on top of previous as user scrolls — creates a layered card deck effect.

───── 50. GRID MOTION (image tile grid with GSAP entrance) ─────
.grid-motion { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:4px; overflow:hidden; }
.grid-motion img { width:100%; aspect-ratio:1; object-fit:cover; }
JS: document.querySelectorAll('.grid-motion').forEach(grid => {
  gsap.fromTo(grid.children, { opacity:0, scale:0.8 },
    { opacity:1, scale:1, duration:0.5, ease:'power2.out', stagger:{each:0.05,from:'random'},
      scrollTrigger:{trigger:grid, start:'top 80%', once:true}
    });
});

═══════════════════════════════════════════════════
🔥🔥🔥 REACT BITS BONUS EFFECTS — 30 MORE (FIRE EFFECTS!) 🔥🔥🔥
═══════════════════════════════════════════════════
USE THESE IN ADDITION TO THE 50 ABOVE! Mix and match — the more the better!

───── 51. FALLING TEXT (letters rain down like Matrix) ─────
.falling-text { position:relative; overflow:hidden; }
JS: document.querySelectorAll('.falling-text').forEach(el => {
  const chars = el.textContent.split('');
  el.innerHTML = chars.map((c,i) => \`<span style="display:inline-block;animation:fallIn 0.6s \${i*0.03}s both cubic-bezier(0.34,1.56,0.64,1)">\${c==' '?'&nbsp;':c}</span>\`).join('');
});
CSS: @keyframes fallIn { from{transform:translateY(-60px) rotateX(-90deg);opacity:0} to{transform:none;opacity:1} }

───── 52. CIRCULAR TEXT (text orbiting a center point) ─────
CSS: .circular-text { position:relative; width:200px; height:200px; }
.circular-text span { position:absolute; top:50%; left:50%; transform-origin:0 100px; font-size:0.85rem; }
JS: document.querySelectorAll('.circular-text').forEach(el => {
  const text = el.dataset.text || el.textContent.trim(); el.innerHTML='';
  text.split('').forEach((c,i) => {
    const s = document.createElement('span'); s.textContent = c;
    s.style.transform = \`rotate(\${i*(360/text.length)}deg)\`; el.appendChild(s);
  });
  let r=0; const spin = () => { r+=0.3; el.style.transform=\`rotate(\${r}deg)\`; requestAnimationFrame(spin); }; spin();
});

───── 53. TEXT PRESSURE (font-weight reacts to cursor distance) ─────
.text-pressure { display:flex; flex-wrap:wrap; gap:0; }
.text-pressure span { display:inline-block; transition:font-weight 0.1s,letter-spacing 0.1s; }
JS: document.querySelectorAll('.text-pressure').forEach(el => {
  el.innerHTML = el.textContent.split('').map(c => \`<span>\${c==' '?'&nbsp;':c}</span>\`).join('');
  el.addEventListener('mousemove', e => {
    el.querySelectorAll('span').forEach(s => {
      const r = s.getBoundingClientRect(), d = Math.hypot(e.clientX-r.left-r.width/2, e.clientY-r.top-r.height/2);
      const w = Math.max(100, 900 - d*3); s.style.fontWeight = w; s.style.letterSpacing = (w-400)*0.002+'em';
    });
  });
});

───── 54. FUZZY TEXT (letters shimmer with noise outline on hover) ─────
.fuzzy-text { cursor:default; }
.fuzzy-text:hover { text-shadow: 2px 2px 6px currentColor, -2px -2px 6px currentColor; transition:text-shadow 0.3s; }
CSS: @keyframes fuzzy { 0%,100%{text-shadow:1px 1px 4px currentColor,-1px -1px 4px currentColor} 50%{text-shadow:3px 3px 8px currentColor,-3px -3px 8px currentColor,0 0 12px currentColor} }
.fuzzy-text { animation:fuzzy 2s ease-in-out infinite; }

───── 55. VARIABLE PROXIMITY (font-weight changes near cursor, whole paragraph) ─────
JS: document.querySelectorAll('.variable-proximity').forEach(para => {
  para.innerHTML = para.textContent.split(/(\s+)/).map(w => w.trim() ? \`<span style="font-variation-settings:'wght' 300;transition:font-variation-settings 0.2s">\${w}</span>\` : w).join('');
  window.addEventListener('mousemove', e => {
    para.querySelectorAll('span').forEach(s => {
      const r = s.getBoundingClientRect(), d = Math.hypot(e.clientX-r.left-r.width/2, e.clientY-r.top-r.height/2);
      s.style.fontVariationSettings = \`'wght' \${Math.min(900, Math.max(300, 900-d*2))}\`;
    });
  });
});

───── 56. LETTER GLITCH BACKGROUND (random chars flashing) ─────
.letter-glitch-bg { position:relative; overflow:hidden; }
.letter-glitch-bg::before { content:''; position:absolute; inset:0; pointer-events:none; }
JS: document.querySelectorAll('.letter-glitch-bg').forEach(el => {
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const overlay = document.createElement('div');
  overlay.style.cssText='position:absolute;inset:0;pointer-events:none;font-family:monospace;font-size:14px;line-height:1.6;opacity:0.06;overflow:hidden;color:currentColor;white-space:pre-wrap;padding:8px';
  el.style.position='relative'; el.appendChild(overlay);
  setInterval(() => { overlay.textContent = Array.from({length:500},()=>chars[Math.random()*chars.length|0]).join(''); }, 80);
});

───── 57. METABALLS (liquid blob animations in hero) ─────
HTML: <div class="metaballs-container" style="position:relative;overflow:hidden;height:400px;background:#000">
  <canvas class="metaballs-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
  <div style="position:relative;z-index:1">{content}</div></div>
JS: document.querySelectorAll('.metaballs-canvas').forEach(canvas => {
  const ctx = canvas.getContext('2d'); canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
  const balls=[{x:200,y:200,vx:1.5,vy:1,r:80,c:'#6366f1'},{x:350,y:150,vx:-1,vy:1.8,r:60,c:'#8b5cf6'},{x:150,y:300,vx:1,vy:-1.2,r:70,c:'#06b6d4'}];
  const animate=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);balls.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<0||b.x>canvas.width)b.vx*=-1;if(b.y<0||b.y>canvas.height)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,b.c);g.addColorStop(1,'transparent');ctx.globalCompositeOperation='screen';ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});requestAnimationFrame(animate);};animate();
});

───── 58. RIBBONS BACKGROUND (colorful flowing ribbons) ─────
HTML: <div class="ribbons-bg" style="position:relative;overflow:hidden">
JS: document.querySelectorAll('.ribbons-bg').forEach(el => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.15';
  const colors=['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
  for(let i=0;i<8;i++){const path=document.createElementNS('http://www.w3.org/2000/svg','path');const y=i*15;path.setAttribute('d',\`M-100 \${y+50} Q 200 \${y} 400 \${y+80} T 900 \${y+40}\`);path.setAttribute('stroke',colors[i%colors.length]);path.setAttribute('stroke-width','3');path.setAttribute('fill','none');path.style.animation=\`ribbon \${3+i*0.5}s ease-in-out infinite alternate\`;svg.appendChild(path);}
  el.style.position='relative'; el.insertBefore(svg,el.firstChild);
});
CSS: @keyframes ribbon { from{transform:translateY(-20px)} to{transform:translateY(20px)} }

───── 59. PIXEL TRAIL (cursor leaves colorful pixel trail) ─────
JS: const pixelTrail=[]; let ptActive=false;
document.addEventListener('mousemove',e=>{if(!ptActive)return;const px=document.createElement('div');px.style.cssText=\`position:fixed;left:\${e.clientX}px;top:\${e.clientY}px;width:8px;height:8px;border-radius:2px;background:hsl(\${Math.random()*360},100%,60%);pointer-events:none;z-index:9999;transition:opacity 0.4s,transform 0.4s\`;document.body.appendChild(px);setTimeout(()=>{px.style.opacity='0';px.style.transform='scale(0.1)';},50);setTimeout(()=>px.remove(),500);});
document.querySelectorAll('.pixel-trail-zone').forEach(z=>{z.addEventListener('mouseenter',()=>ptActive=true);z.addEventListener('mouseleave',()=>ptActive=false);});

───── 60. SPLASH CURSOR (fluid ripple follows cursor) ─────
JS: document.addEventListener('mousemove', e => {
  const splash = document.createElement('div');
  splash.style.cssText=\`position:fixed;left:\${e.clientX-30}px;top:\${e.clientY-30}px;width:60px;height:60px;border-radius:50%;border:2px solid rgba(99,102,241,0.6);pointer-events:none;z-index:9998;animation:splashRing 0.6s ease-out forwards\`;
  document.body.appendChild(splash); setTimeout(()=>splash.remove(),600);
});
CSS: @keyframes splashRing { from{transform:scale(0);opacity:1} to{transform:scale(2);opacity:0} }

───── 61. BLOB CURSOR (morphing blob follows cursor with delay) ─────
HTML: <div id="blob-cursor" style="position:fixed;width:40px;height:40px;background:rgba(99,102,241,0.5);border-radius:50%;pointer-events:none;z-index:9999;transition:transform 0.1s;mix-blend-mode:multiply;filter:blur(8px)"></div>
JS: const blob=document.getElementById('blob-cursor'); let bx=0,by=0,mx=0,my=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
const blobAnim=()=>{bx+=(mx-bx)*0.1;by+=(my-by)*0.1;if(blob)blob.style.transform=\`translate(\${bx-20}px,\${by-20}px)\`;requestAnimationFrame(blobAnim);};blobAnim();

───── 62. FAULTY TERMINAL BACKGROUND (glitching green text on black) ─────
HTML: <div class="faulty-terminal" style="position:relative;background:#000;overflow:hidden">
JS: document.querySelectorAll('.faulty-terminal').forEach(el => {
  const term=document.createElement('div');
  term.style.cssText='position:absolute;inset:0;font-family:monospace;font-size:11px;line-height:1.5;color:#00ff41;opacity:0.15;overflow:hidden;padding:8px;pointer-events:none;white-space:pre-wrap';
  const lines=['> SYSTEM BOOT','> SCANNING...','> ERROR 0x0042','> RECONNECTING','> ACCESS GRANTED','> LOADING MODULE','> SYNC COMPLETE','> NULL REFERENCE','> PROCESS 0xFF','> FATAL: 0x8004'];
  el.style.position='relative'; el.insertBefore(term,el.firstChild);
  setInterval(()=>{ term.textContent=Array.from({length:40},()=>lines[Math.random()*lines.length|0]).join('\n'); },200);
});

───── 63. PIXEL SNOW BACKGROUND ─────
HTML: <canvas class="pixel-snow" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.3"></canvas>
JS: document.querySelectorAll('.pixel-snow').forEach(canvas=>{
  canvas.width=canvas.offsetWidth||400; canvas.height=canvas.offsetHeight||300;
  const ctx=canvas.getContext('2d'); const flakes=Array.from({length:80},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*3+1,speed:Math.random()*1+0.5}));
  const snowAnim=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';flakes.forEach(f=>{f.y+=f.speed;if(f.y>canvas.height)f.y=0;ctx.fillRect(f.x,f.y,f.size,f.size);});requestAnimationFrame(snowAnim);};snowAnim();
});

───── 64. GALAXY / STAR FIELD BACKGROUND ─────
HTML: <canvas class="galaxy-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
JS: document.querySelectorAll('.galaxy-bg').forEach(canvas=>{
  canvas.width=canvas.offsetWidth||800; canvas.height=canvas.offsetHeight||600;
  const ctx=canvas.getContext('2d'); const stars=Array.from({length:200},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.5+0.5,twinkle:Math.random()*Math.PI*2}));
  const galaxyAnim=()=>{ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,canvas.width,canvas.height);stars.forEach(s=>{s.twinkle+=0.02;const a=0.5+0.5*Math.sin(s.twinkle);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=\`rgba(255,255,255,\${a})\`;ctx.fill();});requestAnimationFrame(galaxyAnim);};galaxyAnim();
});

───── 65. HYPERSPEED / WARP STARS BACKGROUND ─────
HTML: <canvas class="hyperspeed-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:#000"></canvas>
JS: document.querySelectorAll('.hyperspeed-bg').forEach(canvas=>{
  canvas.width=canvas.offsetWidth||800; canvas.height=canvas.offsetHeight||600;
  const ctx=canvas.getContext('2d'); const cx=canvas.width/2,cy=canvas.height/2;
  const stars=Array.from({length:120},()=>({x:(Math.random()-0.5)*canvas.width,y:(Math.random()-0.5)*canvas.height,z:Math.random()*canvas.width}));
  const warpAnim=()=>{ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(0,0,canvas.width,canvas.height);stars.forEach(s=>{s.z-=5;if(s.z<=0)Object.assign(s,{x:(Math.random()-0.5)*canvas.width,y:(Math.random()-0.5)*canvas.height,z:canvas.width});const sx=cx+s.x/s.z*canvas.width,sy=cy+s.y/s.z*canvas.width,r=Math.max(0.5,2*(1-s.z/canvas.width));ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();});requestAnimationFrame(warpAnim);};warpAnim();
});

───── 66. GRID DISTORTION (mesh grid warps toward cursor) ─────
HTML: <div class="grid-distortion-wrap" style="position:relative;overflow:hidden">
JS: document.querySelectorAll('.grid-distortion-wrap').forEach(el=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.1';
  const cols=20,rows=15;const lines=[];
  for(let i=0;i<=cols;i++){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','1');svg.appendChild(line);lines.push({el:line,type:'v',i});}
  el.style.position='relative';el.insertBefore(svg,el.firstChild);
  el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width,my=(e.clientY-r.top)/r.height;lines.forEach(l=>{if(l.type==='v'){const x=(l.i/cols*100);const pull=Math.sin((l.i/cols-mx)*Math.PI)*15*Math.max(0,1-Math.abs(l.i/cols-mx)*3);l.el.setAttribute('x1',x+pull+'%');l.el.setAttribute('x2',x+pull+'%');l.el.setAttribute('y1','0%');l.el.setAttribute('y2','100%');}});});
});

───── 67. LOGO LOOP (infinite horizontal auto-scroll) ─────
HTML: <div class="logo-loop-track" style="overflow:hidden;white-space:nowrap;width:100%">
  <div class="logo-loop-inner" style="display:inline-block;animation:logoScroll 20s linear infinite">
    <!-- logos/items here, then DUPLICATE them all for seamless loop -->
  </div></div>
CSS: @keyframes logoScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
JS: document.querySelectorAll('.logo-loop-inner').forEach(el=>{ el.innerHTML+=el.innerHTML; });
⚠️ ALL marquee/scrolling text MUST have items duplicated (2x). No exceptions!

───── 68. CUBES 3D (rotating 3D cubes decoration) ─────
CSS: .cube-3d{width:60px;height:60px;transform-style:preserve-3d;animation:cubeRotate 6s linear infinite}
@keyframes cubeRotate{from{transform:rotateX(0deg) rotateY(0deg)}to{transform:rotateX(360deg) rotateY(360deg)}}
.cube-face{position:absolute;width:60px;height:60px;border:1px solid rgba(99,102,241,0.4);background:rgba(99,102,241,0.05)}
.cube-front{transform:translateZ(30px)} .cube-back{transform:translateZ(-30px) rotateY(180deg)}
.cube-right{transform:translateX(30px) rotateY(90deg)} .cube-left{transform:translateX(-30px) rotateY(-90deg)}
.cube-top{transform:translateY(-30px) rotateX(90deg)} .cube-bottom{transform:translateY(30px) rotateX(-90deg)}

───── 69. ANTIGRAVITY (elements fly away from cursor) ─────
JS: document.querySelectorAll('.antigravity').forEach(el=>{
  let ox=0,oy=0; el.style.transition='transform 0.4s cubic-bezier(0.23,1,0.32,1)';
  el.closest('section')?.addEventListener('mousemove',e=>{
    const r=el.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=Math.sqrt(dx*dx+dy*dy);
    if(d<150){const f=(150-d)/150*40;ox=-dx/d*f;oy=-dy/d*f;}else{ox=0;oy=0;}
    el.style.transform=\`translate(\${ox}px,\${oy}px)\`;
  });
});

───── 70. STICKER PEEL (card corner peels on hover) ─────
.sticker-peel { position:relative; overflow:hidden; }
.sticker-peel::after { content:''; position:absolute; bottom:0; right:0; width:0; height:0; background:linear-gradient(225deg,#fff 45%,rgba(0,0,0,0.1) 45%,transparent); transition:width 0.3s,height 0.3s; }
.sticker-peel:hover::after { width:40px; height:40px; }

───── 71. METALLIC PAINT (metallic sheen sweeps on hover) ─────
.metallic-paint { position:relative; overflow:hidden; }
.metallic-paint::before { content:''; position:absolute; inset:-50%; background:conic-gradient(from 0deg,transparent 0%,rgba(255,255,255,0.15) 20%,transparent 40%,rgba(255,255,255,0.08) 60%,transparent 80%); transform:translateX(-100%); transition:transform 0.8s; }
.metallic-paint:hover::before { transform:translateX(100%); }

───── 72. SHAPE BLUR (geometric shape blurs/unblurs on hover) ─────
.shape-blur-wrap { position:relative; }
.shape-blur-shape { position:absolute; border-radius:30% 70% 70% 30% / 30% 30% 70% 70%; width:200px; height:200px; background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2)); filter:blur(40px); transition:filter 0.5s; pointer-events:none; }
.shape-blur-wrap:hover .shape-blur-shape { filter:blur(20px); }

───── 73. CHROMAGRID (chromatic aberration on hover) ─────
.chroma-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:2px; }
.chroma-cell { transition:filter 0.3s; }
.chroma-cell:hover { filter:drop-shadow(2px 0 0 rgba(255,0,0,0.5)) drop-shadow(-2px 0 0 rgba(0,0,255,0.5)); }

───── 74. FLYING POSTERS (3D card cascade on scroll) ─────
.flying-posters { display:flex; gap:2rem; perspective:1000px; }
.flying-poster { flex:0 0 280px; transform-origin:center bottom; }
JS: document.querySelectorAll('.flying-posters').forEach(wrap=>{
  gsap.fromTo(wrap.children, { rotateY:-45, opacity:0, z:-200 },
    { rotateY:0, opacity:1, z:0, duration:0.8, stagger:0.15, ease:'power3.out',
      scrollTrigger:{trigger:wrap,start:'top 80%',once:true} });
});

───── 75. CIRCULAR GALLERY (rotating 3D ring of cards) ─────
.circular-gallery-wrap { position:relative; height:400px; perspective:1000px; }
.circular-gallery-inner { position:absolute; inset:0; transform-style:preserve-3d; }
JS: document.querySelectorAll('.circular-gallery-wrap').forEach(wrap=>{
  const inner=wrap.querySelector('.circular-gallery-inner');if(!inner)return;
  const cards=inner.querySelectorAll('.gallery-card'); const n=cards.length; let angle=0;
  cards.forEach((c,i)=>{c.style.cssText+=\`;position:absolute;width:200px;left:50%;top:50%;transform:rotateY(\${i*(360/n)}deg) translateZ(280px) translate(-50%,-50%)\`;});
  const spin=()=>{angle+=0.3;inner.style.transform=\`rotateY(\${angle}deg)\`;requestAnimationFrame(spin);};spin();
});

───── 76. FLUID GLASS (glass morphism with fluid border) ─────
.fluid-glass { background:rgba(255,255,255,0.08); backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); border:1px solid rgba(255,255,255,0.2); box-shadow:0 8px 32px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.2); border-radius:1rem; transition:all 0.3s; }
.fluid-glass:hover { border-color:rgba(255,255,255,0.35); box-shadow:0 12px 40px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.3); transform:translateY(-2px); }

───── 77. ELASTIC SLIDER (slider with spring physics) ─────
HTML: <div class="elastic-track" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:1rem;padding:1rem;-webkit-overflow-scrolling:touch;scroll-behavior:smooth">
  <!-- slides with style="scroll-snap-align:start;flex:0 0 300px" -->
</div>
JS: document.querySelectorAll('.elastic-track').forEach(track=>{
  track.addEventListener('scroll',()=>gsap.to(track,{scaleY:0.97,duration:0.1,yoyo:true,repeat:1,ease:'power2.out'}));
});

───── 78. ANIMATED LIST (items appear with staggered bounce) ─────
.animated-list li { opacity:0; transform:translateX(-20px); }
JS: document.querySelectorAll('.animated-list').forEach(ul=>{
  gsap.to(ul.querySelectorAll('li'), { opacity:1, x:0, duration:0.5, ease:'back.out(1.7)', stagger:0.08,
    scrollTrigger:{trigger:ul,start:'top 85%',once:true} });
});

───── 79. MAGIC BENTO GRID (mixed card sizes with hover glow) ─────
.bento-magic { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.bento-magic .bento-large { grid-column:span 2; }
.bento-magic .bento-tall { grid-row:span 2; }
.bento-card { border-radius:1.5rem; padding:1.5rem; position:relative; overflow:hidden; cursor:pointer; transition:transform 0.3s; }
.bento-card:hover { transform:scale(1.02); }
.bento-card::after { content:''; position:absolute; inset:0; background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,0.1) 0%,transparent 60%); opacity:0; transition:opacity 0.3s; }
.bento-card:hover::after { opacity:1; }
JS: document.querySelectorAll('.bento-card').forEach(c=>{c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');});});

───── 80. SCROLL STACK (sections pin and stack over each other) ─────
JS: document.querySelectorAll('.scroll-stack-section').forEach((section,i)=>{
  gsap.to(section, { scale:0.9, opacity:0.5, borderRadius:'1rem',
    scrollTrigger:{ trigger:section, start:'top top', end:'bottom top', scrub:true, pin:true, pinSpacing:false }
  });
});

═══════════════════════════════════════════════════
🔥 REACT BITS COMPLETE CATALOG — 53 MORE EFFECTS (#81-#133) 🔥
Use THESE TOO — pick freely from all 133 effects!
═══════════════════════════════════════════════════

══ TEXT ANIMATIONS (#81-#90) ══

───── 81. TEXT TYPE (character-by-character typing with cursor blink) ─────
CSS: @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
.text-type-cursor { display:inline-block;width:2px;height:1em;background:currentColor;margin-left:2px;animation:cursorBlink 0.8s step-end infinite;vertical-align:text-bottom; }
HTML: <span class="text-type" data-words="Hello World|Build Fast|Ship More"></span>
JS: document.querySelectorAll('.text-type').forEach(el=>{
  const words=(el.dataset.words||'Hello').split('|');
  el.innerHTML='<span class="tw"></span><span class="text-type-cursor"></span>';
  const tw=el.querySelector('.tw'); let wi=0,ci=0,del=false;
  const go=()=>{const w=words[wi%words.length];tw.textContent=del?w.slice(0,ci--):w.slice(0,++ci);if(!del&&ci===w.length){setTimeout(()=>{del=true;go();},1500);return;}if(del&&ci<0){del=false;wi++;ci=0;}setTimeout(go,del?50:80);};go();
});

───── 82. SHUFFLE TEXT (random char shuffle before real text locks in) ─────
JS: const SCHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&*';
document.querySelectorAll('.shuffle-text').forEach(el=>{
  const orig=el.textContent; let fr=0;
  const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return;io.disconnect();
    const run=()=>{el.textContent=orig.split('').map((c,i)=>i<Math.floor(fr)?c:SCHARS[Math.random()*SCHARS.length|0]).join('');fr+=0.5;if(fr<orig.length+1)requestAnimationFrame(run);else el.textContent=orig;};run();});
  io.observe(el);
});

───── 83. CURVED LOOP TEXT (text on SVG arc, auto-rotating) ─────
HTML: <div style="width:200px;height:200px">
  <svg viewBox="0 0 200 200" style="width:100%;height:100%;animation:curveSpin 8s linear infinite">
    <path id="arcPath" fill="none" d="M 100,100 m -70,0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0"/>
    <text font-size="12" fill="currentColor" letter-spacing="3">
      <textPath href="#arcPath">CURVED TEXT • CURVED TEXT •</textPath>
    </text>
  </svg>
</div>
CSS: @keyframes curveSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

───── 84. TEXT CURSOR (custom cursor text label follows mouse) ─────
HTML: <div id="tcursor" style="position:fixed;pointer-events:none;z-index:9999;font-size:0.85rem;font-weight:700;color:#fff;mix-blend-mode:difference;padding:4px 8px;border-radius:4px;transform:translate(-50%,-50%);transition:opacity 0.2s;opacity:0"></div>
JS: const tc=document.getElementById('tcursor');let tx=0,ty=0,trx=0,try_=0;
document.addEventListener('mousemove',e=>{trx=e.clientX;try_=e.clientY;if(tc)tc.style.opacity='1';});
document.querySelectorAll('[data-cursor-text]').forEach(el=>{el.addEventListener('mouseenter',()=>{if(tc)tc.textContent=el.dataset.cursorText;});el.addEventListener('mouseleave',()=>{if(tc)tc.textContent='';});});
const tcAnim=()=>{tx+=(trx-tx)*0.12;ty+=(try_-ty)*0.12;if(tc)tc.style.transform=\`translate(\${tx}px,\${ty}px) translate(-50%,-50%)\`;requestAnimationFrame(tcAnim);};tcAnim();

───── 85. TRUE FOCUS (focused word sharp, others blur) ─────
.true-focus { display:flex;flex-wrap:wrap;gap:0.4em; }
.true-focus span { transition:filter 0.4s,opacity 0.4s; }
.true-focus:hover span { filter:blur(4px);opacity:0.3; }
.true-focus span:hover { filter:blur(0)!important;opacity:1!important;cursor:default; }
JS: document.querySelectorAll('.true-focus').forEach(el=>{
  el.innerHTML=el.textContent.trim().split(' ').map(w=>\`<span>\${w}</span>\`).join(' ');
});

───── 86. SCROLL FLOAT (letters float up from below with spring on scroll) ─────
.scroll-float { overflow:hidden; }
.scroll-float span { display:inline-block; }
JS: document.querySelectorAll('.scroll-float').forEach(el=>{
  el.innerHTML=el.textContent.split('').map(c=>c===' '?'<span style="display:inline-block">&nbsp;</span>':\`<span style="display:inline-block">\${c}</span>\`).join('');
  gsap.fromTo(el.querySelectorAll('span'),{y:60,opacity:0},{y:0,opacity:1,duration:0.8,ease:'back.out(2)',stagger:0.03,scrollTrigger:{trigger:el,start:'top 85%',once:true}});
});

───── 87. ASCII TEXT (monospace big text, glowing keyframe) ─────
HTML: <pre class="ascii-art" style="font-family:monospace;font-size:clamp(5px,1.1vw,11px);line-height:1.1;letter-spacing:0;overflow:hidden;color:inherit;background:none;border:none;margin:0">
  ██  ██  ███  ██  ██  ██████
  ██  ██ ██ ██ ██  ██  ██   █
  ██████ █████ ██  ██  ██████
  ██  ██ ██ ██  ████   ██   █
  ██  ██ ██ ██   ██    ██████
</pre>
CSS: .ascii-art { animation:asciiGlow 3s ease-in-out infinite alternate; }
@keyframes asciiGlow { from{text-shadow:none} to{text-shadow:0 0 10px currentColor,0 0 20px currentColor} }

───── 88. SCRAMBLED TEXT (Matrix-style scramble-then-reveal per letter) ─────
JS: (() => {
  const C='!<>-_\\/[]{}—=+*^?#@ABCDEFGHIJKLMNabcdefghijklmn';
  document.querySelectorAll('.scrambled-text').forEach(el=>{
    const orig=el.textContent; let fr=0;
    const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return;io.disconnect();
      const run=()=>{el.innerHTML=orig.split('').map((c,i)=>{if(c===' ')return ' ';if(i<Math.floor(fr))return \`<span>\${c}</span>\`;return \`<span style="opacity:0.4;color:#6366f1">\${C[Math.random()*C.length|0]}</span>\`;}).join('');fr+=0.35;if(fr<orig.length+1)requestAnimationFrame(run);else el.textContent=orig;};run();});
    io.observe(el);});
})();

───── 89. GLITCH TEXT (CSS clip-path color-split distortion) ─────
.glitch { position:relative; }
.glitch::before,.glitch::after { content:attr(data-text);position:absolute;left:0;top:0;width:100%; }
.glitch::before { color:#f00;clip-path:polygon(0 0,100% 0,100% 35%,0 35%);animation:gl1 0.7s infinite linear alternate-reverse; }
.glitch::after { color:#00f;clip-path:polygon(0 65%,100% 65%,100% 100%,0 100%);animation:gl2 0.7s infinite linear alternate-reverse; }
CSS: @keyframes gl1 { 0%{transform:translate(-2px)} 50%{transform:translate(2px,1px)} 100%{transform:translate(-1px,-1px)} }
@keyframes gl2 { 0%{transform:translate(2px)} 50%{transform:translate(-2px,-1px)} 100%{transform:translate(1px,2px)} }
HTML: <h1 class="glitch" data-text="GLITCH HERO">GLITCH HERO</h1>

───── 90. SCROLL VELOCITY (marquee speed reacts to scroll speed) ─────
HTML: <div class="scroll-vel-wrap" style="overflow:hidden;white-space:nowrap;padding:1rem 0">
  <div class="scroll-vel-inner" style="display:inline-block">FAST • WHEN • SCROLLING • FAST • WHEN • SCROLLING • </div>
</div>
JS: document.querySelectorAll('.scroll-vel-wrap').forEach(wrap=>{
  const inner=wrap.querySelector('.scroll-vel-inner');if(!inner)return;
  inner.innerHTML+=inner.innerHTML;let x=0,lastS=0,vel=0;
  const anim=()=>{const s=window.scrollY;vel+=(s-lastS)*0.06;vel*=0.95;lastS=s;x-=(0.4+Math.abs(vel));if(Math.abs(x)>inner.scrollWidth/2)x=0;inner.style.transform=\`translateX(\${x}px)\`;requestAnimationFrame(anim);};anim();
});

══ ANIMATIONS (#91-#98) ══

───── 91. ORBIT IMAGES (images orbiting a center element) ─────
HTML: <div class="orbit-wrap" style="position:relative;width:360px;height:360px;margin:0 auto">
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2">{CENTER LOGO}</div>
  <div class="orbit-ring" style="position:absolute;inset:20px;border-radius:50%;border:1px dashed rgba(255,255,255,0.1)">
    <img class="orbit-item" style="position:absolute;width:52px;height:52px;border-radius:50%;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.3)" src="https://picsum.photos/seed/orb-a/52/52"/>
    <img class="orbit-item" style="position:absolute;width:52px;height:52px;border-radius:50%;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.3)" src="https://picsum.photos/seed/orb-b/52/52"/>
    <img class="orbit-item" style="position:absolute;width:52px;height:52px;border-radius:50%;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.3)" src="https://picsum.photos/seed/orb-c/52/52"/>
    <img class="orbit-item" style="position:absolute;width:52px;height:52px;border-radius:50%;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.3)" src="https://picsum.photos/seed/orb-d/52/52"/>
  </div>
</div>
JS: document.querySelectorAll('.orbit-ring').forEach(ring=>{
  const items=ring.querySelectorAll('.orbit-item'),n=items.length;const r=ring.offsetWidth/2-26,cx=ring.offsetWidth/2,cy=ring.offsetHeight/2;let a=0;
  const anim=()=>{a+=0.006;items.forEach((item,i)=>{const th=a+(i/n)*Math.PI*2;item.style.left=(cx+Math.cos(th)*r-26)+'px';item.style.top=(cy+Math.sin(th)*r-26)+'px';});requestAnimationFrame(anim);};anim();
});

───── 92. TARGET CURSOR (crosshair targeting reticle follows cursor) ─────
HTML: <div id="target-cur" style="position:fixed;pointer-events:none;z-index:9999;width:44px;height:44px;transform:translate(-50%,-50%);transition:transform 0.08s">
  <svg viewBox="0 0 44 44" fill="none" stroke="#6366f1" stroke-width="1.5">
    <circle cx="22" cy="22" r="12"/><circle cx="22" cy="22" r="2" fill="#6366f1"/>
    <line x1="22" y1="2" x2="22" y2="10"/><line x1="22" y1="34" x2="22" y2="42"/>
    <line x1="2" y1="22" x2="10" y2="22"/><line x1="34" y1="22" x2="42" y2="22"/>
  </svg>
</div>
JS: const tgt=document.getElementById('target-cur');document.addEventListener('mousemove',e=>{if(tgt){tgt.style.left=e.clientX+'px';tgt.style.top=e.clientY+'px';}});

───── 93. LASER FLOW (laser beam trail from cursor) ─────
HTML: <canvas id="laser-cv" style="position:fixed;inset:0;pointer-events:none;z-index:9997;width:100%;height:100%"></canvas>
JS: (() => {
  const c=document.getElementById('laser-cv');if(!c)return;
  c.width=window.innerWidth;c.height=window.innerHeight;
  const ctx=c.getContext('2d');const pts=[];let mx=0,my=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;pts.push({x:mx,y:my,t:Date.now()});});
  const draw=()=>{ctx.clearRect(0,0,c.width,c.height);const now=Date.now();const alive=pts.filter(p=>now-p.t<500);pts.length=0;pts.push(...alive);
    if(alive.length>1){for(let i=1;i<alive.length;i++){const a=(1-(now-alive[i].t)/500)*0.9;ctx.beginPath();ctx.strokeStyle=\`rgba(99,102,241,\${a})\`;ctx.lineWidth=a*3;ctx.lineCap='round';ctx.moveTo(alive[i-1].x,alive[i-1].y);ctx.lineTo(alive[i].x,alive[i].y);ctx.stroke();}}requestAnimationFrame(draw);};draw();
})();

───── 94. GHOST CURSOR (fading soft circle echo trail) ─────
JS: document.addEventListener('mousemove',e=>{
  const g=document.createElement('div');
  g.style.cssText=\`position:fixed;left:\${e.clientX}px;top:\${e.clientY}px;width:16px;height:16px;border-radius:50%;background:rgba(99,102,241,0.4);pointer-events:none;z-index:9996;transform:translate(-50%,-50%);transition:opacity 0.5s,transform 0.5s\`;
  document.body.appendChild(g);setTimeout(()=>{g.style.opacity='0';g.style.transform='translate(-50%,-50%) scale(3)';},20);setTimeout(()=>g.remove(),550);
});

───── 95. GRADUAL BLUR (section blurs progressively on scroll) ─────
JS: document.querySelectorAll('.gradual-blur').forEach(el=>{
  gsap.to(el,{filter:'blur(10px)',opacity:0.2,scrollTrigger:{trigger:el,start:'top top',end:'bottom center',scrub:true}});
});

───── 96. NOISE OVERLAY (Canvas 2D film grain animation) ─────
HTML: <canvas class="noise-cv" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.07;z-index:1"></canvas>
JS: document.querySelectorAll('.noise-cv').forEach(c=>{
  c.width=256;c.height=256;const ctx=c.getContext('2d');
  const grain=()=>{const d=ctx.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}ctx.putImageData(d,0,0);requestAnimationFrame(grain);};grain();
});

───── 97. CROSSHAIR (fullscreen crosshair lines follow cursor) ─────
HTML: <div id="ch-h" style="position:fixed;top:0;width:100vw;height:1px;background:rgba(99,102,241,0.18);pointer-events:none;z-index:9995"></div>
<div id="ch-v" style="position:fixed;left:0;height:100vh;width:1px;background:rgba(99,102,241,0.18);pointer-events:none;z-index:9995"></div>
JS: const chh=document.getElementById('ch-h'),chv=document.getElementById('ch-v');
document.addEventListener('mousemove',e=>{if(chh)chh.style.top=e.clientY+'px';if(chv)chv.style.left=e.clientX+'px';});

───── 98. IMAGE TRAIL (images appear and fade trailing cursor) ─────
JS: const imgs=['https://picsum.photos/seed/trail-a/80/80','https://picsum.photos/seed/trail-b/80/80','https://picsum.photos/seed/trail-c/80/80','https://picsum.photos/seed/trail-d/80/80'];let iIdx=0,iLast=0;
document.addEventListener('mousemove',e=>{const now=Date.now();if(now-iLast<130)return;iLast=now;
  const img=document.createElement('img');img.src=imgs[iIdx++%imgs.length];
  img.style.cssText=\`position:fixed;left:\${e.clientX-40}px;top:\${e.clientY-40}px;width:80px;height:80px;object-fit:cover;border-radius:8px;pointer-events:none;z-index:9994;transition:opacity 0.4s,transform 0.4s;transform:rotate(\${(Math.random()-0.5)*16}deg)\`;
  document.body.appendChild(img);setTimeout(()=>{img.style.opacity='0';img.style.transform=\`scale(0.4) rotate(\${(Math.random()-0.5)*20}deg)\`;},80);setTimeout(()=>img.remove(),500);
});

══ COMPONENTS (#99-#116) ══

───── 99. BUBBLE MENU (circular pop-out menu) ─────
HTML: <div class="bubble-menu" style="position:relative;display:inline-block;width:56px;height:56px">
  <button onclick="this.closest('.bubble-menu').classList.toggle('bm-open')" style="width:56px;height:56px;border-radius:50%;background:#6366f1;color:#fff;font-size:1.5rem;border:none;cursor:pointer;z-index:2;position:relative;transition:transform 0.3s">+</button>
  <button class="bm-item" style="position:absolute;top:0;left:0;width:44px;height:44px;border-radius:50%;background:#8b5cf6;border:none;cursor:pointer;transform:scale(0);opacity:0;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1)"></button>
  <button class="bm-item" style="position:absolute;top:0;left:0;width:44px;height:44px;border-radius:50%;background:#06b6d4;border:none;cursor:pointer;transform:scale(0);opacity:0;transition:all 0.3s 0.05s cubic-bezier(0.34,1.56,0.64,1)"></button>
  <button class="bm-item" style="position:absolute;top:0;left:0;width:44px;height:44px;border-radius:50%;background:#10b981;border:none;cursor:pointer;transform:scale(0);opacity:0;transition:all 0.3s 0.1s cubic-bezier(0.34,1.56,0.64,1)"></button>
</div>
CSS: .bubble-menu.bm-open .bm-item:nth-child(2){transform:translate(-80px,-30px) scale(1);opacity:1}
.bubble-menu.bm-open .bm-item:nth-child(3){transform:translate(-90px,20px) scale(1);opacity:1}
.bubble-menu.bm-open .bm-item:nth-child(4){transform:translate(-60px,70px) scale(1);opacity:1}
.bubble-menu.bm-open button:first-child{transform:rotate(45deg)}

───── 100. REFLECTIVE CARD (animated reflection sheen sweep) ─────
.reflective-card { position:relative;overflow:hidden;cursor:pointer; }
.reflective-card::after { content:'';position:absolute;inset:-100%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.12) 50%,transparent 60%);transform:translateX(-200%);transition:transform 0.7s; }
.reflective-card:hover::after { transform:translateX(200%); }

───── 101. CARD NAV (scroll card nav with dot indicators) ─────
HTML: <div class="card-nav" style="position:relative">
  <div class="card-nav-track" style="display:flex;gap:1.5rem;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:0.5rem 0">
    <div style="scroll-snap-align:start;flex:0 0 300px;border-radius:1rem;padding:1.5rem" class="glass-card">{card1}</div>
    <div style="scroll-snap-align:start;flex:0 0 300px;border-radius:1rem;padding:1.5rem" class="glass-card">{card2}</div>
    <div style="scroll-snap-align:start;flex:0 0 300px;border-radius:1rem;padding:1.5rem" class="glass-card">{card3}</div>
  </div>
  <div class="card-nav-dots" style="display:flex;gap:6px;justify-content:center;margin-top:1rem"></div>
</div>
JS: document.querySelectorAll('.card-nav').forEach(wrap=>{
  const track=wrap.querySelector('.card-nav-track'),dots=wrap.querySelector('.card-nav-dots');
  const cards=track.querySelectorAll('[style*="scroll-snap"]');
  cards.forEach((_,i)=>{const d=document.createElement('button');d.style.cssText=\`width:\${i===0?'24px':'8px'};height:8px;border-radius:4px;border:none;cursor:pointer;background:\${i===0?'#6366f1':'rgba(255,255,255,0.2)'};transition:all 0.3s\`;d.onclick=()=>cards[i].scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'});dots.appendChild(d);});
  track.addEventListener('scroll',()=>{const idx=Math.round(track.scrollLeft/(track.scrollWidth/cards.length));dots.querySelectorAll('button').forEach((d,i)=>{d.style.width=i===idx?'24px':'8px';d.style.background=i===idx?'#6366f1':'rgba(255,255,255,0.2)';});});
});

───── 102. STACK (card stack that fans on hover) ─────
.stack-wrap { position:relative;width:300px;height:220px; }
.stack-card { position:absolute;inset:0;border-radius:1.25rem;transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.stack-card:nth-child(1){transform:rotate(-4deg) translateY(8px);z-index:1}
.stack-card:nth-child(2){transform:rotate(-1deg) translateY(4px);z-index:2}
.stack-card:nth-child(3){transform:rotate(0deg);z-index:3}
.stack-wrap:hover .stack-card:nth-child(1){transform:rotate(-14deg) translate(-60px,12px)}
.stack-wrap:hover .stack-card:nth-child(2){transform:rotate(-5deg) translate(-20px,6px)}
.stack-wrap:hover .stack-card:nth-child(3){transform:rotate(8deg) translate(40px,8px)}

───── 103. PILL NAV (sliding pill indicator navigation) ─────
HTML: <nav class="pill-nav" style="display:inline-flex;background:rgba(255,255,255,0.06);border-radius:999px;padding:4px;gap:2px;position:relative">
  <div class="pill-ind" style="position:absolute;top:4px;left:4px;height:calc(100% - 8px);background:#6366f1;border-radius:999px;transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none"></div>
  <button class="pill-btn" style="position:relative;z-index:1;padding:0.5rem 1.25rem;border:none;background:none;color:#fff;cursor:pointer;border-radius:999px;font-weight:600;font-size:0.9rem">Home</button>
  <button class="pill-btn" style="position:relative;z-index:1;padding:0.5rem 1.25rem;border:none;background:none;color:rgba(255,255,255,0.55);cursor:pointer;border-radius:999px;font-size:0.9rem">Work</button>
  <button class="pill-btn" style="position:relative;z-index:1;padding:0.5rem 1.25rem;border:none;background:none;color:rgba(255,255,255,0.55);cursor:pointer;border-radius:999px;font-size:0.9rem">About</button>
</nav>
JS: document.querySelectorAll('.pill-nav').forEach(nav=>{
  const ind=nav.querySelector('.pill-ind'),btns=nav.querySelectorAll('.pill-btn');
  const go=btn=>{const nr=nav.getBoundingClientRect(),br=btn.getBoundingClientRect();ind.style.left=(br.left-nr.left)+'px';ind.style.width=br.width+'px';btns.forEach(b=>b.style.color=b===btn?'#fff':'rgba(255,255,255,0.55)');};
  btns[0]&&go(btns[0]);btns.forEach(b=>b.addEventListener('click',()=>go(b)));
});

───── 104. MASONRY (CSS columns waterfall grid) ─────
.masonry { columns:3;column-gap:1rem; }
.masonry-item { break-inside:avoid;margin-bottom:1rem; }
@media(max-width:768px){.masonry{columns:2}}
@media(max-width:480px){.masonry{columns:1}}

───── 105. GLASS SURFACE (deep multi-layer frosted glass) ─────
.glass-surface { background:rgba(255,255,255,0.04);backdrop-filter:blur(40px) brightness(1.1) saturate(200%);-webkit-backdrop-filter:blur(40px) brightness(1.1) saturate(200%);border:1px solid rgba(255,255,255,0.08);box-shadow:0 0 0 1px rgba(0,0,0,0.1),0 4px 32px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.12);position:relative; }
.glass-surface::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.06) 0%,transparent 50%);border-radius:inherit;pointer-events:none; }

───── 106. DOME GALLERY (spherical dome image grid layout) ─────
.dome-gallery { display:grid;grid-template-columns:repeat(5,1fr);gap:3px;border-radius:50% 50% 0 0 / 40% 40% 0 0;overflow:hidden; }
.dome-gallery img { width:100%;aspect-ratio:1;object-fit:cover;transition:transform 0.3s,filter 0.3s; }
.dome-gallery img:hover { transform:scale(1.08);filter:brightness(1.15); }

───── 107. FOLDER (3D folder open/close on hover) ─────
.folder-wrap { width:120px;height:90px;position:relative;cursor:pointer;perspective:400px; }
.folder-back { position:absolute;inset:0;background:#f59e0b;border-radius:4px 14px 14px 14px; }
.folder-tab { position:absolute;top:-18px;left:0;width:55px;height:20px;background:#d97706;border-radius:8px 8px 0 0; }
.folder-front { position:absolute;top:8px;left:0;right:0;bottom:0;background:linear-gradient(135deg,#fbbf24,#f59e0b);border-radius:4px 4px 14px 14px;transform-origin:bottom;transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.folder-wrap:hover .folder-front { transform:rotateX(-50deg); }

───── 108. STAGGERED MENU (list items slide in with stagger) ─────
.staggered-menu { list-style:none;padding:0;margin:0; }
.staggered-menu li { opacity:0;transform:translateX(-20px); }
JS: document.querySelectorAll('.staggered-menu').forEach(ul=>{
  gsap.to(ul.querySelectorAll('li'),{opacity:1,x:0,duration:0.5,stagger:0.08,ease:'power3.out',scrollTrigger:{trigger:ul,start:'top 85%',once:true}});
});

───── 109. PROFILE CARD (social profile card with follow button) ─────
HTML: <div class="profile-card" style="border-radius:1.5rem;overflow:hidden;text-align:center;max-width:280px">
  <div style="height:100px;background:linear-gradient(135deg,#6366f1,#8b5cf6)"></div>
  <div style="padding:0 1.5rem 1.5rem">
    <img src="https://i.pravatar.cc/80?img=5" style="width:80px;height:80px;border-radius:50%;border:4px solid rgba(255,255,255,0.1);margin:-40px auto 1rem;display:block;object-fit:cover"/>
    <h3 style="margin:0 0 0.25rem;font-size:1.1rem;font-weight:700">Alex Johnson</h3>
    <p style="margin:0 0 1rem;opacity:0.6;font-size:0.85rem">Product Designer</p>
    <button class="pf-follow" style="padding:0.5rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:999px;cursor:pointer;font-weight:600;transition:all 0.2s" onclick="this.classList.toggle('pf-on');this.textContent=this.classList.contains('pf-on')?'Following':'Follow'">Follow</button>
  </div>
</div>
CSS: .pf-follow.pf-on{background:transparent;border:2px solid #6366f1;color:#6366f1}
.pf-follow:hover{transform:scale(1.05);box-shadow:0 4px 16px rgba(99,102,241,0.4)}

───── 110. DOCK (macOS magnification dock) ─────
HTML: <div class="dock-wrap" style="display:flex;align-items:flex-end;gap:8px;padding:8px 16px;background:rgba(255,255,255,0.1);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.18);border-radius:1.25rem;width:fit-content;margin:0 auto">
  <div class="dock-item" style="width:52px;height:52px;border-radius:12px;overflow:hidden;background:#6366f1;transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer;flex-shrink:0"></div>
  <div class="dock-item" style="width:52px;height:52px;border-radius:12px;overflow:hidden;background:#8b5cf6;transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer;flex-shrink:0"></div>
  <div class="dock-item" style="width:52px;height:52px;border-radius:12px;overflow:hidden;background:#06b6d4;transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer;flex-shrink:0"></div>
  <div class="dock-item" style="width:52px;height:52px;border-radius:12px;overflow:hidden;background:#10b981;transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer;flex-shrink:0"></div>
</div>
JS: document.querySelectorAll('.dock-wrap').forEach(dock=>{
  const items=dock.querySelectorAll('.dock-item');
  dock.addEventListener('mousemove',e=>{const dr=dock.getBoundingClientRect();items.forEach(item=>{const ir=item.getBoundingClientRect(),cx=ir.left+ir.width/2,d=Math.abs(e.clientX-cx),s=Math.max(1,2.6-d*0.018);item.style.transform=\`scale(\${s}) translateY(\${(s-1)*-22}px)\`;});});
  dock.addEventListener('mouseleave',()=>items.forEach(i=>{i.style.transform='';}));
});

───── 111. GOOEY NAV (blob gooey filter navigation) ─────
HTML: <svg style="position:absolute;width:0;height:0"><filter id="goo-f"><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10" result="goo"/></filter></svg>
<nav style="display:flex;background:rgba(99,102,241,0.12);border-radius:999px;padding:4px;filter:url(#goo-f);width:fit-content">
  <a style="padding:0.6rem 1.3rem;border-radius:999px;text-decoration:none;color:inherit;font-weight:500;background:transparent;transition:background 0.3s" href="#">Home</a>
  <a style="padding:0.6rem 1.3rem;border-radius:999px;text-decoration:none;color:#fff;font-weight:600;background:#6366f1" href="#">Work</a>
  <a style="padding:0.6rem 1.3rem;border-radius:999px;text-decoration:none;color:inherit;font-weight:500;background:transparent;transition:background 0.3s" href="#">About</a>
</nav>

───── 112. CARD SWAP (clickable card stack swap) ─────
.card-swap { position:relative;width:300px;height:400px; }
.swappable { position:absolute;inset:0;border-radius:1.5rem;cursor:pointer;transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.swappable:nth-child(1){z-index:3;transform:rotate(0deg)}
.swappable:nth-child(2){z-index:2;transform:rotate(-5deg) translateY(8px)}
.swappable:nth-child(3){z-index:1;transform:rotate(5deg) translateY(16px)}
JS: document.querySelectorAll('.card-swap').forEach(stack=>{
  stack.addEventListener('click',()=>{
    const cards=[...stack.children];const top=cards[0];
    top.style.transition='transform 0.4s';top.style.transform='translate(150%,0) rotate(20deg)';
    setTimeout(()=>{top.style.transition='none';top.style.transform='rotate(5deg) translateY(16px)';stack.appendChild(top);setTimeout(()=>{top.style.transition='';[...stack.children].forEach((c,i)=>{c.style.zIndex=3-i;c.style.transform=['rotate(0deg)','rotate(-5deg) translateY(8px)','rotate(5deg) translateY(16px)'][i]||'';});},20);},420);
  });
});

───── 113. GLASS ICONS (frosted glass icon buttons) ─────
.glass-icon { display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.06);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);transition:all 0.2s;cursor:pointer; }
.glass-icon:hover { background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.25);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.2); }

───── 114. FLOWING MENU (navigation with animated liquid highlight) ─────
HTML: <nav class="flow-menu" style="display:flex;background:rgba(255,255,255,0.04);border-radius:999px;padding:4px;position:relative">
  <div class="flow-ind" style="position:absolute;top:4px;left:4px;height:calc(100% - 8px);background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:999px;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none"></div>
  <button class="flow-btn" style="position:relative;z-index:1;padding:0.6rem 1.4rem;border:none;background:none;color:#fff;font-weight:600;cursor:pointer;border-radius:999px;font-size:0.9rem">Home</button>
  <button class="flow-btn" style="position:relative;z-index:1;padding:0.6rem 1.4rem;border:none;background:none;color:rgba(255,255,255,0.5);cursor:pointer;border-radius:999px;font-size:0.9rem">Work</button>
  <button class="flow-btn" style="position:relative;z-index:1;padding:0.6rem 1.4rem;border:none;background:none;color:rgba(255,255,255,0.5);cursor:pointer;border-radius:999px;font-size:0.9rem">About</button>
</nav>
JS: document.querySelectorAll('.flow-menu').forEach(nav=>{
  const ind=nav.querySelector('.flow-ind'),btns=nav.querySelectorAll('.flow-btn');
  const go=btn=>{const nr=nav.getBoundingClientRect(),lr=btn.getBoundingClientRect();ind.style.left=(lr.left-nr.left)+'px';ind.style.width=lr.width+'px';ind.style.top=(lr.top-nr.top)+'px';ind.style.height=lr.height+'px';btns.forEach(b=>b.style.color=b===btn?'#fff':'rgba(255,255,255,0.5)');};
  btns[0]&&go(btns[0]);btns.forEach(b=>b.addEventListener('click',()=>go(b)));
});

───── 115. INFINITE MENU (auto-scrolling infinite vertical menu) ─────
HTML: <div class="inf-menu" style="overflow:hidden;height:240px;position:relative;mask-image:linear-gradient(to bottom,transparent,black 20%,black 80%,transparent)">
  <div class="inf-menu-track" style="display:flex;flex-direction:column">
    <div class="inf-item" style="padding:0.75rem 1.5rem;font-size:1.05rem;cursor:pointer;transition:color 0.2s,transform 0.2s;white-space:nowrap">Menu Item One</div>
    <div class="inf-item" style="padding:0.75rem 1.5rem;font-size:1.05rem;cursor:pointer;transition:color 0.2s,transform 0.2s;white-space:nowrap">Menu Item Two</div>
    <div class="inf-item" style="padding:0.75rem 1.5rem;font-size:1.05rem;cursor:pointer;transition:color 0.2s,transform 0.2s;white-space:nowrap">Menu Item Three</div>
    <div class="inf-item" style="padding:0.75rem 1.5rem;font-size:1.05rem;cursor:pointer;transition:color 0.2s,transform 0.2s;white-space:nowrap">Menu Item Four</div>
  </div>
</div>
CSS: .inf-item:hover { color:#6366f1;transform:translateX(10px); }
JS: document.querySelectorAll('.inf-menu').forEach(menu=>{
  const track=menu.querySelector('.inf-menu-track');if(!track)return;
  track.innerHTML+=track.innerHTML;let y=0;const h=track.scrollHeight/2;
  const anim=()=>{y+=0.7;if(y>=h)y=0;track.style.transform=\`translateY(-\${y}px)\`;requestAnimationFrame(anim);};anim();
});

───── 116. STEPPER (animated step progress indicator) ─────
HTML: <div class="stepper" style="display:flex;align-items:center">
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:40px;height:40px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 0 0 4px rgba(99,102,241,0.2)">1</div>
    <span style="font-size:0.75rem;font-weight:500">Start</span>
  </div>
  <div style="height:2px;flex:1;background:linear-gradient(to right,#6366f1,rgba(255,255,255,0.1));min-width:60px"></div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-weight:700">2</div>
    <span style="font-size:0.75rem;opacity:0.4">Config</span>
  </div>
  <div style="height:2px;flex:1;background:rgba(255,255,255,0.1);min-width:60px"></div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-weight:700">3</div>
    <span style="font-size:0.75rem;opacity:0.4">Launch</span>
  </div>
</div>

══ BACKGROUNDS (#117-#133) ══

───── 117. LIQUID ETHER (flowing liquid radial gradient animation) ─────
.liquid-ether { position:relative;overflow:hidden; }
.liquid-ether::before { content:'';position:absolute;inset:-50%;width:200%;height:200%;background:radial-gradient(ellipse 60% 50% at 30% 50%,rgba(99,102,241,0.25),transparent 55%),radial-gradient(ellipse 50% 60% at 70% 40%,rgba(139,92,246,0.2),transparent 55%),radial-gradient(ellipse 40% 50% at 50% 80%,rgba(6,182,212,0.15),transparent 50%);animation:etherDrift 10s ease-in-out infinite alternate;pointer-events:none; }
CSS: @keyframes etherDrift { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-3%,2%) scale(1.04)} 100%{transform:translate(2%,-3%) scale(0.97)} }

───── 118. PRISM BACKGROUND (prismatic conic gradient spin) ─────
.prism-bg { position:relative;overflow:hidden; }
.prism-bg::before { content:'';position:absolute;inset:-50%;width:200%;height:200%;background:conic-gradient(from 0deg at 40% 50%,rgba(255,0,0,0.05),rgba(255,160,0,0.05),rgba(255,255,0,0.05),rgba(0,255,0,0.05),rgba(0,0,255,0.05),rgba(128,0,128,0.05),rgba(255,0,0,0.05));animation:prismSpin 15s linear infinite;pointer-events:none; }
CSS: @keyframes prismSpin { to{transform:rotate(360deg)} }

───── 119. DARK VEIL (full-page curtain reveal on load) ─────
HTML: <div class="dark-veil" style="position:fixed;inset:0;background:#000;z-index:9999;pointer-events:none"></div>
JS: (() => {
  const v=document.querySelector('.dark-veil');if(!v)return;
  v.style.animation='veilLift 1s cubic-bezier(0.76,0,0.24,1) 0.2s forwards';
})();
CSS: @keyframes veilLift { from{transform:translateY(0);opacity:1} to{transform:translateY(-100%);opacity:0} }

───── 120. LIGHT PILLAR (vertical god beam columns) ─────
.light-pillars { position:absolute;inset:0;pointer-events:none;overflow:hidden; }
.light-pillar { position:absolute;width:100px;height:100%;background:linear-gradient(to bottom,rgba(255,255,255,0.9),transparent);filter:blur(50px);opacity:0.05;animation:pillarSway 7s ease-in-out infinite alternate; }
.light-pillar:nth-child(1){left:15%;animation-duration:5s}
.light-pillar:nth-child(2){left:45%;animation-delay:1.5s;animation-duration:8s}
.light-pillar:nth-child(3){left:75%;animation-delay:3s;animation-duration:6s}
CSS: @keyframes pillarSway { from{transform:skewX(-4deg) scale(1)} to{transform:skewX(4deg) scale(1.05)} }
HTML: <div class="light-pillars"><div class="light-pillar"></div><div class="light-pillar"></div><div class="light-pillar"></div></div>

───── 121. FLOATING LINES (drifting horizontal line lines BG) ─────
HTML: <div class="float-lines" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:0.08"></div>
JS: document.querySelectorAll('.float-lines').forEach(el=>{
  for(let i=0;i<14;i++){const l=document.createElement('div');const y=Math.random()*100;const w=25+Math.random()*55;const spd=4+Math.random()*6;l.style.cssText=\`position:absolute;height:1px;background:currentColor;width:\${w}%;top:\${y}%;left:-\${w}%;animation:floatLine \${spd}s \${Math.random()*6}s linear infinite\`;el.appendChild(l);}
});
CSS: @keyframes floatLine { to{transform:translateX(300%)} }

───── 122. LIGHT RAYS (god rays emanating from top) ─────
.light-rays { position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;opacity:0.07; }
JS: document.querySelectorAll('.light-rays').forEach(el=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.style.cssText='width:100%;height:100%;position:absolute;inset:0';svg.setAttribute('viewBox','0 0 1000 800');
  for(let i=0;i<10;i++){const path=document.createElementNS('http://www.w3.org/2000/svg','path');const x=100+i*90;path.setAttribute('d',\`M 500 0 L \${x-30} 800 L \${x+50} 800 Z\`);path.setAttribute('fill',\`rgba(255,255,255,\${0.5-i*0.04})\`);path.style.animation=\`rayPulse \${3+i*0.4}s ease-in-out \${i*0.2}s infinite alternate\`;svg.appendChild(path);}
  el.appendChild(svg);
});
CSS: @keyframes rayPulse { from{opacity:0.4} to{opacity:0.9} }

───── 123. PIXEL BLAST (colorful pixel particle burst background) ─────
HTML: <canvas class="px-blast" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
JS: document.querySelectorAll('.px-blast').forEach(c=>{
  c.width=c.offsetWidth||800;c.height=c.offsetHeight||600;const ctx=c.getContext('2d');
  const ps=Array.from({length:70},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,sz:2+Math.random()*5,h:Math.random()*60+220}));
  const a=()=>{ctx.fillStyle='rgba(0,0,0,0.08)';ctx.fillRect(0,0,c.width,c.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>c.width)p.vx*=-1;if(p.y<0||p.y>c.height)p.vy*=-1;ctx.fillStyle=\`hsl(\${p.h},80%,60%)\`;ctx.fillRect(p.x,p.y,p.sz,p.sz);});requestAnimationFrame(a);};a();
});

───── 124. COLOR BENDS (distorted color-bending gradient BG) ─────
.color-bends { position:relative;overflow:hidden; }
.color-bends::before { content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(99,102,241,0.28),rgba(139,92,246,0.18) 40%,rgba(6,182,212,0.1) 70%,transparent);filter:blur(35px);animation:cBend 12s ease-in-out infinite alternate;pointer-events:none; }
CSS: @keyframes cBend { 0%{transform:scale(1) skew(0deg,0deg)} 50%{transform:scale(1.12) skew(-4deg,2deg)} 100%{transform:scale(0.92) skew(3deg,-3deg)} }

───── 125. GRADIENT BLINDS (venetian blind CSS animation) ─────
.grad-blinds { position:relative;overflow:hidden; }
.grad-blinds::after { content:'';position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgba(99,102,241,0.04) 0px,rgba(99,102,241,0.04) 2px,transparent 2px,transparent 44px);animation:blindsDrift 24s linear infinite;pointer-events:none; }
CSS: @keyframes blindsDrift { from{background-position:0 0} to{background-position:0 44px} }

───── 126. GRID SCAN (scanning glow line over dot grid) ─────
.grid-scan { position:relative;overflow:hidden;background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:48px 48px; }
.grid-scan::after { content:'';position:absolute;left:0;right:0;height:2px;background:linear-gradient(to right,transparent,rgba(99,102,241,0.9),transparent);box-shadow:0 0 24px rgba(99,102,241,0.6);animation:scanLine 5s ease-in-out infinite;pointer-events:none; }
CSS: @keyframes scanLine { 0%,100%{top:0;opacity:0} 5%,95%{opacity:1} 100%{top:100%} }

───── 127. LIGHTNING (Canvas 2D procedural lightning bolts) ─────
HTML: <canvas class="lightning-cv" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.5"></canvas>
JS: document.querySelectorAll('.lightning-cv').forEach(c=>{
  c.width=c.offsetWidth||800;c.height=c.offsetHeight||500;const ctx=c.getContext('2d');
  const bolt=(x1,y1,x2,y2,d)=>{if(d===0){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle='rgba(139,92,246,0.8)';ctx.lineWidth=1;ctx.stroke();return;}const mx=(x1+x2)/2+(Math.random()-0.5)*70,my=(y1+y2)/2+(Math.random()-0.5)*35;bolt(x1,y1,mx,my,d-1);bolt(mx,my,x2,y2,d-1);if(Math.random()<0.4)bolt(mx,my,mx+(Math.random()-0.5)*80,my+40,d-2);};
  const strike=()=>{ctx.clearRect(0,0,c.width,c.height);bolt(c.width*(0.3+Math.random()*0.4),0,c.width*(0.2+Math.random()*0.6),c.height,6);};
  setInterval(strike,2500+Math.random()*3500);
});

───── 128. PRISMATIC BURST (SVG kaleidoscope wedge burst) ─────
.prism-burst { position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:0.06; }
JS: document.querySelectorAll('.prism-burst').forEach(el=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 400 400');svg.style.cssText='width:100%;height:100%;position:absolute;inset:0';
  const colors=['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
  for(let i=0;i<12;i++){const a1=(i*30)*Math.PI/180,a2=((i+0.7)*30)*Math.PI/180,r=180;const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',\`M200,200 L\${200+Math.cos(a1)*r},\${200+Math.sin(a1)*r} A\${r},\${r} 0 0,1 \${200+Math.cos(a2)*r},\${200+Math.sin(a2)*r} Z\`);p.setAttribute('fill',colors[i%colors.length]);p.style.transformOrigin='200px 200px';p.style.animation=\`burstRotate 25s linear infinite\`;svg.appendChild(p);}
  el.appendChild(svg);});
CSS: @keyframes burstRotate { to{transform:rotate(360deg)} }

───── 129. DITHER BACKGROUND (dot dithering pattern animation) ─────
.dither-bg { position:relative;overflow:hidden; }
.dither-bg::after { content:'';position:absolute;inset:0;background-image:radial-gradient(circle,currentColor 1px,transparent 1px);background-size:4px 4px;opacity:0.04;animation:ditherDrift 10s linear infinite;pointer-events:none; }
CSS: @keyframes ditherDrift { from{background-position:0 0} to{background-position:16px 16px} }

───── 130. RIPPLE GRID (circular wave expanding on dot grid) ─────
HTML: <canvas class="ripple-grid" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.25"></canvas>
JS: document.querySelectorAll('.ripple-grid').forEach(c=>{
  c.width=c.offsetWidth||800;c.height=c.offsetHeight||600;const ctx=c.getContext('2d');const sp=44;let t=0;
  const rows=Math.ceil(c.height/sp),cols=Math.ceil(c.width/sp);
  const a=()=>{ctx.clearRect(0,0,c.width,c.height);t+=0.04;for(let r=0;r<=rows;r++){for(let cl=0;cl<=cols;cl++){const x=cl*sp,y=r*sp,d=Math.sqrt((x-c.width/2)**2+(y-c.height/2)**2),w=Math.sin(d*0.04-t)*0.5+0.5;ctx.beginPath();ctx.arc(x,y,1+w*4,0,Math.PI*2);ctx.fillStyle=\`rgba(99,102,241,\${0.08+w*0.35})\`;ctx.fill();}}requestAnimationFrame(a);};a();
});

───── 131. THREADS (fine animated thread lines background) ─────
HTML: <canvas class="threads-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.1"></canvas>
JS: document.querySelectorAll('.threads-bg').forEach(c=>{
  c.width=c.offsetWidth||800;c.height=c.offsetHeight||600;const ctx=c.getContext('2d');
  const th=Array.from({length:35},()=>({x:Math.random()*c.width,y:Math.random()*c.height,ang:Math.random()*Math.PI*2,spd:0.15+Math.random()*0.25,len:60+Math.random()*120}));
  const a=()=>{ctx.clearRect(0,0,c.width,c.height);th.forEach(t=>{t.x+=Math.cos(t.ang)*t.spd;t.y+=Math.sin(t.ang)*t.spd;if(t.x<0||t.x>c.width||t.y<0||t.y>c.height){t.x=Math.random()*c.width;t.y=Math.random()*c.height;}ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x+Math.cos(t.ang)*t.len,t.y+Math.sin(t.ang)*t.len);ctx.strokeStyle='rgba(99,102,241,0.5)';ctx.lineWidth=0.5;ctx.stroke();});requestAnimationFrame(a);};a();
});

───── 132. BALLPIT (Canvas 2D physics balls with gravity) ─────
HTML: <canvas class="ballpit-bg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
JS: document.querySelectorAll('.ballpit-bg').forEach(c=>{
  c.width=c.offsetWidth||800;c.height=c.offsetHeight||600;const ctx=c.getContext('2d');
  const balls=Array.from({length:28},()=>({x:Math.random()*c.width,y:Math.random()*c.height*0.5,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*3,r:18+Math.random()*28,h:Math.random()*80+200}));
  const a=()=>{ctx.clearRect(0,0,c.width,c.height);balls.forEach(b=>{b.vy+=0.08;b.x+=b.vx;b.y+=b.vy;if(b.x-b.r<0){b.x=b.r;b.vx=Math.abs(b.vx)*0.85;}if(b.x+b.r>c.width){b.x=c.width-b.r;b.vx=-Math.abs(b.vx)*0.85;}if(b.y+b.r>c.height){b.y=c.height-b.r;b.vy=-Math.abs(b.vy)*0.8;}if(b.y-b.r<0){b.y=b.r;b.vy=Math.abs(b.vy);}const g=ctx.createRadialGradient(b.x-b.r*0.3,b.y-b.r*0.3,0,b.x,b.y,b.r);g.addColorStop(0,\`hsla(\${b.h},80%,70%,0.9)\`);g.addColorStop(1,\`hsla(\${b.h},60%,40%,0.8)\`);ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();});requestAnimationFrame(a);};a();
});

───── 133. ORB (glowing soft orb gradient background elements) ─────
HTML: <div class="orb-bg" style="position:relative;overflow:hidden">
  <div class="orb-el" style="position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none;width:420px;height:420px;background:rgba(99,102,241,0.22);top:-100px;left:-100px;animation:orbDrift 9s ease-in-out infinite alternate"></div>
  <div class="orb-el" style="position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none;width:380px;height:380px;background:rgba(139,92,246,0.18);bottom:-80px;right:-80px;animation:orbDrift 11s ease-in-out 2s infinite alternate"></div>
  <div class="orb-el" style="position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;width:260px;height:260px;background:rgba(6,182,212,0.13);top:50%;left:50%;transform:translate(-50%,-50%);animation:orbDrift 7s ease-in-out 1s infinite alternate"></div>
  {content}
</div>
CSS: @keyframes orbDrift { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-15px) scale(1.06)} 100%{transform:translate(-12px,18px) scale(0.95)} }

═══════════════════════════════════════════════════
🚨 TESTIMONIAL SECTION — MANDATORY HORIZONTAL CAROUSEL 🚨
═══════════════════════════════════════════════════
When rendering testimonials/reviews/quotes:
- NEVER stack them vertically as a column of cards!
- ALWAYS use a horizontal snap carousel with EXACTLY this structure:
<section class="relative py-24 md:py-32 overflow-hidden">
  <div class="max-w-7xl mx-auto px-6">
    <h2>...</h2>
    <div class="snap-carousel" style="display:flex;gap:1.5rem;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:1rem 0;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent;">
      <!-- Each card: FIXED WIDTH, never full-width -->
      <div style="scroll-snap-align:start;flex:0 0 340px;min-width:300px;max-width:380px;" class="glass-card p-6 rounded-2xl">
        <p>"Quote text..."</p>
        <div class="mt-4 flex items-center gap-3">
          <img src="https://picsum.photos/48/48?random=test1" class="w-12 h-12 rounded-full" />
          <div><strong>Name</strong><br><small>Title, Company</small></div>
        </div>
      </div>
      <!-- repeat for each testimonial -->
    </div>
  </div>
</section>
- Cards must have flex:0 0 340px (NOT flex:1, NOT width:100%)
- The container must scroll horizontally showing 2-3 cards at a time
- If there are 3+ testimonials, some MUST be offscreen (scroll to reveal)

═══════════════════════════════════════════════════
🚨🚨🚨 DASHBOARD / APP UI LAYOUTS — SIDEBAR RULE 🚨🚨🚨
═══════════════════════════════════════════════════
If the video shows a dashboard, admin panel, SaaS app, or ANY interface with sidebar + main content:

❌ NEVER use position:fixed or position:absolute for the sidebar!
❌ NEVER use position:sticky for the sidebar without grid/flex parent!
❌ These cause the main content to OVERLAP/GO UNDER the sidebar!

✅ ALWAYS use flex layout for sidebar+main:
✅ Main area MUST have min-width:0 and overflow-x:hidden
✅ SINGLE <main> element — content renders once, works on ALL screen sizes!

MANDATORY STRUCTURE (match the VIDEO's theme for colors!):
<!-- Desktop: sidebar + main. Mobile: hamburger + slide-out drawer -->
<div x-data="{ sidebarOpen: false }" class="min-h-screen">
  <!-- MOBILE TOP BAR with hamburger (shown < lg) -->
  <div class="lg:hidden flex items-center justify-between p-4 border-b" style="background:var(--sidebar-bg,#1f2937);border-color:var(--border,#374151);">
    <span class="font-bold text-white">App Name</span>
    <button @click="sidebarOpen = !sidebarOpen" class="text-white p-1">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <!-- MOBILE SLIDE-OUT DRAWER (overlay) -->
  <div x-show="sidebarOpen" x-transition class="lg:hidden fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/50" @click="sidebarOpen=false"></div>
    <aside class="relative z-50 w-64 h-full overflow-y-auto p-4" style="background:var(--sidebar-bg,#1f2937);">
      <!-- SAME nav items as desktop sidebar -->
    </aside>
  </div>
  <!-- FLEX LAYOUT: desktop sidebar + main content -->
  <div class="flex min-h-screen">
    <!-- DESKTOP SIDEBAR (hidden on mobile, visible on lg+) -->
    <aside class="hidden lg:flex lg:flex-col lg:w-[250px] lg:flex-shrink-0 overflow-y-auto p-4" style="min-height:100vh;">
      <!-- sidebar logo + nav items -->
    </aside>
    <!-- MAIN CONTENT — ONE element, works on ALL screen sizes! -->
    <main class="flex-1 min-w-0 overflow-x-hidden p-4 lg:p-6">
      <!-- ALL content goes here ONCE — stat cards, tables, charts -->
      <!-- This renders on both desktop AND mobile! -->
    </main>
  </div>
</div>

🚨 CRITICAL: Only ONE <main> element! Do NOT create separate desktop/mobile main areas!
The <main> content is written ONCE and works on all screen sizes automatically.
On mobile: sidebar hidden (hidden lg:flex), hamburger opens slide-out drawer with full navigation.

📱 MOBILE SIDEBAR RULES:
- Desktop sidebar: class="hidden lg:flex" — invisible on mobile, visible on desktop
- Mobile: hamburger top bar (class="lg:hidden") + slide-out drawer with SAME nav items
- Drawer matches sidebar's background color (dark sidebar = dark drawer)
- Drawer has backdrop overlay (bg-black/50) and closes on backdrop click
- Tables on mobile: wrap in overflow-x:auto for horizontal scrolling
- ❌ NEVER show a vertical sidebar on mobile — it covers the entire screen!
- ❌ NEVER create TWO separate main content areas (one for desktop, one for mobile)

📊 CHART OVERFLOW RULES (MANDATORY for dashboards!):
- ALL chart containers MUST have overflow:hidden and a FIXED height — NEVER let charts grow unbounded!
- Bar charts: parent div needs height:280px (or similar fixed px) + overflow:hidden
- Line/area charts: wrap in div style="height:280px;overflow:hidden;position:relative"
- Pie/donut charts: container must be width:100%;aspect-ratio:1;max-width:320px;margin:0 auto
- SVG charts: ALWAYS set viewBox AND width="100%" height="100%" — NEVER set width/height to px values on the SVG
- Chart grids: use CSS Grid or flex with bounded sizes, NEVER position:absolute unless parent has position:relative + overflow:hidden
- Bubble/scatter charts: use CSS Grid inside overflow:hidden — NO absolute positioning that escapes boundary
- WRONG: <div><svg width="600" height="400">...</svg></div> ← SVG overflows on small screens!
- RIGHT: <div style="height:280px;overflow:hidden;position:relative"><svg viewBox="0 0 600 400" width="100%" height="100%">...</svg></div>

🖼️ IMAGE FORMAT (MANDATORY — picsum ONLY):
- Use ONLY: https://picsum.photos/seed/DESCRIPTIVE-NAME/WIDTH/HEIGHT
- Seeds MUST be descriptive: hero-office, team-collaboration, product-laptop, dashboard-chart, etc.
- NEVER use: https://picsum.photos/id/N/W/H (ID format may return broken images!)
- NEVER use: https://picsum.photos/WxH or https://picsum.photos/W/H (no seed = inconsistent!)
- Every image MUST have a UNIQUE seed — duplicate seeds = duplicate images!
- Avatars: https://i.pravatar.cc/150?img=N (N=1-70)

═══════════════════════════════════════════════════
ASSEMBLY RULES — MINIMUM REQUIREMENTS (use 15+ effects!):
═══════════════════════════════════════════════════
MANDATORY (every page):
- split-text OR blur-text OR decrypt-text on the hero headline
- scroll-reveal-text on at least 1 paragraph
- data-animate on every major content block
- stagger-cards on at least 1 card grid
- count-up on every stat/metric number
- gradient-text OR shiny-text on at least 1 headline
- card-spotlight OR tilt-card OR glare-card on at least 1 card set
- marquee on any logo/partner bar
- Custom scrollbar styling on <html>

PICK 2+ background effects (VARY per section — NEVER same background twice!):
- OGL WebGL: aurora, 3d-particles, iridescence, liquid-chrome, balatro, grainient
- Canvas 2D: waves-bg, squares-bg, dotgrid-bg
- CSS: beams-bg
Prefer OGL WebGL backgrounds — they are PREMIUM quality with real shaders!

PICK 2+ hover effects:
- hover-lift, tilt-card, spotlight, glare-hover, electric-border, star-border, decay-card, pixel-card, magnet-pull

PICK 1+ SVG animation:
- morphing-blob, line-draw icons, floating-shapes, animated-gradient, pulse-circles, animated-path

PICK 1+ bonus:
- typewriter, rotating-text, click-spark, magnet-lines, fade-content, bounce-cards, pixel-transition, grid-motion, bento-grid, scroll-stack

TESTIMONIALS: snap-carousel (HORIZONTAL, never vertical stack)

If multiple pages shown: use Alpine.js x-data/x-show for navigation.
Wrap in \`\`\`html blocks.`;
          } else {
            prompt += `

WATCH THE VIDEO CAREFULLY — ESPECIALLY LATER FRAMES. FAITHFULLY RECONSTRUCT WHAT YOU SEE.

🚨🚨🚨 RULE #0 — THEME DETECTION (BEFORE ANYTHING ELSE!) 🚨🚨🚨
LOOK AT THE VIDEO BACKGROUNDS! This determines your entire color scheme:
- WHITE/LIGHT/CREAM backgrounds → You MUST use: bg-white, text-gray-900, bg-gray-50, border-gray-200
- DARK/BLACK backgrounds → You MUST use: bg-zinc-950, text-white, bg-zinc-900, border-zinc-800
- MIXED (light main + dark sidebar) → Match each section individually!
- Do NOT default to dark theme! Enterprise apps, dashboards, SaaS tools are often LIGHT themed!
- If the body/main area is white/light gray → <body class="bg-white text-gray-900">
- If the body/main area is dark/black → <body class="bg-[#0a0a0a] text-white">

CRITICAL RULES:
1. Every section MUST have REAL content (no empty cards!). Every image uses UNIQUE picsum seed.
2. If a section spans full width in the video → make it full width in output.
3. 🚨🚨🚨 ZERO BAN: The number 0 is BANNED in ALL statistics, metrics, KPIs, table data!
   - "0 funded startups" → WRONG! Must be "5,000+" or similar real number
   - "$0B" → WRONG! Must be "$800B+" or similar real number
   - "$0", "0 cases", "0 users", "$0.00" in dashboards → ALL WRONG! Use realistic values
   - Dashboard KPIs: "$14,250", "1,847 cases", "12,500 users" — NEVER $0 or 0!
   - Table cells: every numeric cell must have a realistic non-zero value
   - SCAN THE LAST 5 SECONDS of the video for the FINAL counter values!
   - If you cannot read the final value, ESTIMATE a realistic number — NEVER output zero!
   - FINAL CHECK: Search your output for ">0<" and ">$0" — if found, replace with real values!
4. 📐 MATCH THE VIDEO LAYOUT: If the video shows text on LEFT + image on RIGHT (split hero) → build a TWO-COLUMN hero, NOT centered. Do NOT center everything — match the column structure!
5. If the video shows buttons side-by-side → place them side-by-side (flex-row), not stacked.
6. 🏢 COMPANY LOGO SECTIONS: If the video shows a grid/row of company logos (partners, clients, "Top companies"):
   - Use STYLED TEXT with the company name or initial letter (e.g., <div class="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-white font-bold text-xl">S</div> for Stripe)
   - Do NOT use external image URLs for company logos — they WILL break!
   - cdn.simpleicons.org is OK ONLY for social media icons (GitHub, Twitter, LinkedIn)
7. 📊 DASHBOARD / APP UI LAYOUTS: If the video shows a dashboard with sidebar:
   Use the MANDATORY STRUCTURE template above (flex layout with hidden lg:flex sidebar).
   🚨 SINGLE <main> element! Content is written ONCE, works on both desktop and mobile!
   ❌ NEVER create two separate main content areas!
   - Main area: min-width:0, flex-1 (CRITICAL — prevents overflow!)
   - ALL charts, tables, data grids: wrap in overflow-x:auto container
   - stat cards: grid with auto-fit minmax(250px,1fr)
8. 📋 TESTIMONIALS: If the video shows testimonials/reviews/quotes:
   - Use horizontal scrolling carousel (overflow-x:auto, flex, gap, scroll-snap-type:x mandatory)
   - Each card: flex:0 0 340px (fixed width, NOT full-width stacking)
   - NEVER stack 3+ testimonials as a vertical column

If multiple pages shown: use Alpine.js x-data/x-show for navigation.
Include GSAP + ScrollTrigger for animations.

🚨🚨🚨 FINAL CHECK BEFORE YOU OUTPUT — SIDEBAR RESPONSIVENESS 🚨🚨🚨
If your output has a sidebar/left panel, verify ALL of these:
✅ Desktop sidebar has class="hidden lg:flex" (invisible on mobile!)
✅ Mobile top nav exists with class="lg:hidden" and hamburger button
✅ Mobile slide-out drawer has class="lg:hidden" with x-show
✅ Only ONE <main> element exists — content written ONCE for all screen sizes!
❌ NEVER create two <main> elements (one desktop, one mobile) — mobile one will be empty!

Wrap in \`\`\`html blocks.`;
          }


          // SEND VIDEO TO GEMINI 3 PRO - IT SEES AND CODES!
          // When DS is selected, add a post-video reminder to override video colors with DS tokens
          const contentParts: Array<{text: string} | {inlineData: {mimeType: string; data: string}}> = [
            { text: prompt },
            { inlineData: { mimeType, data: videoBase64 } },
          ];

          if (isDSStyle) {
            // Extract DS color tokens from styleDirective for explicit reminder
            const colorLines = styleDirective.match(/COLORS:\n([\s\S]*?)(?:\n\n|\nTYPOGRAPHY|\nSPACING|\n===)/);
            const colorSummary = colorLines?.[1]?.trim() || "the DS tokens listed above";
            contentParts.push({ text: `🚨 POST-VIDEO REMINDER — DESIGN SYSTEM COLOR OVERRIDE:
You just watched a video. DO NOT copy the colors you saw in the video!
The user's Design System defines these colors — use THEM instead:
${colorSummary}

Apply these DS colors to buttons, backgrounds, accents, links, borders.
The video provides layout + content. The DS provides ALL colors and typography.
Generate the HTML now using ONLY Design System colors.` });
          } else if (!isReimagine) {
            // RECONSTRUCT mode — enforce content completeness + theme matching
            contentParts.push({ text: `🚨 RECONSTRUCT MODE — FAITHFUL REPRODUCTION:
You just watched a video. You MUST reproduce it COMPLETELY — every section, every element, every piece of text.

CONTENT COMPLETENESS (MANDATORY):
- Keep ALL text VERBATIM: every headline, paragraph, nav item, stat, testimonial, button label, footer link
- Keep ALL data EXACT: numbers, metrics, company names, dates, prices
- Include ALL sections shown in video — hero, features, pricing, testimonials, CTA, footer, etc.
- NO empty sections, NO placeholder text, NO skipped content
- 🚨 ZERO BAN: 0 is BANNED in statistics/KPIs — use the ACTUAL values from the video!
- SCAN THE LAST 5 SECONDS of the video for FINAL counter values!

THEME MATCHING:
- Was the background LIGHT (white/cream/gray) or DARK (black/dark gray)?
- If LIGHT: <body class="bg-white text-gray-900"> and light Tailwind classes
- If DARK: <body class="bg-[#0a0a0a] text-white"> and dark Tailwind classes
- Match the video EXACTLY. Do NOT default to dark if the video was light!

Generate the COMPLETE HTML now — every section from the video must be present.` });
          }

          // BOTH modes: enforce zero ban and content completeness as final reminder
          if (!isDSStyle) {
            contentParts.push({ text: `🚨🚨🚨 FINAL MANDATORY CHECK — READ THIS LAST:
1. ZERO BAN: The number 0 is BANNED in ALL statistics, metrics, KPIs. If you see "5 questions" in the video, output "5" NOT "0". SCAN THE LAST 5 SECONDS for final counter values!
2. ALL SECTIONS: Include EVERY section from the video — hero, stats, features, pricing, testimonials, CTA, footer. Do NOT skip any section.
3. ALL TEXT VERBATIM: Every headline, paragraph, button label, stat label, nav item must match the video EXACTLY.` });
          }

          // Retry loop for 503/429 high demand errors
          const MAX_RETRIES = 3;
          const retryDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          let streamResult;
          let lastStreamError;

          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              streamResult = await withTimeout(
                model.generateContentStream(contentParts),
                240000, // 4 minute timeout for complex generation
                "Direct Vision Code Generation"
              );
              break; // success
            } catch (error: any) {
              lastStreamError = error;
              console.error(`[stream] Attempt ${attempt}/${MAX_RETRIES} failed:`, error?.message);
              const isRetryable = error?.message?.includes('503') ||
                                  error?.message?.includes('overloaded') ||
                                  error?.message?.includes('Service Unavailable') ||
                                  error?.message?.includes('429');
              if (!isRetryable) throw error;

              if (attempt < MAX_RETRIES) {
                const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "status",
                  message: `Model busy, retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${MAX_RETRIES})`,
                  progress: 5
                })}\n\n`));
                await retryDelay(waitTime);
              }
            }
          }

          if (!streamResult) {
            throw lastStreamError || new Error("All retry attempts failed");
          }

          const result = streamResult;

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
              ? Math.min(10 + Math.floor((fullText.length / 50000) * 80), 95)
              : 15;
            
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
          
          // Fix broken images, template literals, orphaned HTML tags, and malformed double-tags
          cleanCode = fixBrokenImageUrls(cleanCode);
          cleanCode = fixTemplateLiteralErrors(cleanCode);
          cleanCode = fixBrokenHtmlTags(cleanCode);
          cleanCode = fixMalformedDoubleTags(cleanCode);
          
          // Extract flow data if present
          let flowData = null;
          const flowMatch = cleanCode.match(/<!--\s*FLOW_DATA:\s*([\s\S]*?)\s*-->/);
          if (flowMatch) {
            try {
              flowData = JSON.parse(flowMatch[1]);
              console.log("[stream] Extracted flow data:", flowData);
            } catch (e) {
              console.log("[stream] Could not parse flow data");
            }
          }
          
          // Extract REPLAY_METADATA for pages detection
          let scanData = null;
          const metadataMatch = cleanCode.match(/<!--\s*REPLAY_METADATA\s*([\s\S]*?)\s*-->/);
          if (metadataMatch) {
            try {
              const metadata = JSON.parse(metadataMatch[1]);
              console.log("[stream] Extracted REPLAY_METADATA:", metadata);
              
              // Validation function for page names - filters out placeholders and invalid names
              const isValidPageName = (name: string): boolean => {
                if (!name || typeof name !== 'string') return false;
                const trimmed = name.trim();
                // Must be 2-50 characters
                if (trimmed.length < 2 || trimmed.length > 50) return false;
                // No template placeholders like {xxx} or {xxx.yyy}
                if (/\{.*\}/.test(trimmed)) return false;
                // No code patterns like .headline, .title, etc.
                if (/^\.[a-z]+$/i.test(trimmed)) return false;
                // Must start with a letter (allow unicode for international names)
                if (!/^[A-Za-zÀ-ÿĄĘŁŃÓŚŹŻąęłńóśźż]/.test(trimmed)) return false;
                // No HTML/code characters
                if (/[<>=\[\]`$]/.test(trimmed)) return false;
                // Skip common non-page elements
                const skipWords = ['apply', 'login', 'logout', 'sign up', 'signup', 'sign in', 'signin', 'search', 'menu', 'get started', 'download', 'submit', 'send'];
                if (skipWords.includes(trimmed.toLowerCase())) return false;
                return true;
              };
              
              // Build scanData.pages from metadata
              const pages: any[] = [];
              
              // Add implemented pages (seen in video)
              if (metadata.implementedPages) {
                metadata.implementedPages.forEach((pageName: string, i: number) => {
                  if (!isValidPageName(pageName)) {
                    console.log("[stream] Skipping invalid implementedPage:", pageName);
                    return;
                  }
                  pages.push({
                    id: pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    title: pageName,
                    path: pageName.toLowerCase() === 'home' ? '/' : `/${pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                    isDefault: pageName.toLowerCase() === 'home',
                    seenInVideo: true,
                    components: [],
                    description: `${pageName} page - shown in video`
                  });
                });
              }
              
              // Add possible pages (from nav but not shown)
              if (metadata.possiblePages) {
                metadata.possiblePages.forEach((pageName: string) => {
                  if (!isValidPageName(pageName)) {
                    console.log("[stream] Skipping invalid possiblePage:", pageName);
                    return;
                  }
                  const pageId = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  // Skip if already in implemented pages
                  if (!pages.some(p => p.id === pageId)) {
                    pages.push({
                      id: pageId,
                      title: pageName,
                      path: `/${pageId}`,
                      isDefault: false,
                      seenInVideo: false,
                      components: [],
                      description: `${pageName} - detected in navigation, not shown in video`
                    });
                  }
                });
              }
              
              // Add detected nav links as possible pages
              if (metadata.detectedNavLinks) {
                metadata.detectedNavLinks.forEach((linkName: string) => {
                  if (!isValidPageName(linkName)) {
                    console.log("[stream] Skipping invalid navLink:", linkName);
                    return;
                  }
                  const pageId = linkName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  if (!pages.some(p => p.id === pageId)) {
                    pages.push({
                      id: pageId,
                      title: linkName,
                      path: `/${pageId}`,
                      isDefault: false,
                      seenInVideo: false,
                      components: [],
                      description: `${linkName} - detected in navigation`
                    });
                  }
                });
              }
              
              if (pages.length > 0) {
                scanData = { pages };
                console.log("[stream] Built scanData with", pages.length, "pages");
              }
            } catch (e) {
              console.log("[stream] Could not parse REPLAY_METADATA");
            }
          }
          
          // Also try to detect pages from Alpine.js x-show directives
          if (!scanData) {
            const alpinePages = cleanCode.match(/x-show="page\s*===?\s*'([^']+)'/g);
            if (alpinePages && alpinePages.length > 0) {
              const pageNames = alpinePages.map(match => {
                const nameMatch = match.match(/'([^']+)'/);
                return nameMatch ? nameMatch[1] : null;
              }).filter(Boolean);
              
              const uniquePages = [...new Set(pageNames)];
              if (uniquePages.length > 0) {
                const pages = uniquePages.map((pageName, i) => ({
                  id: String(pageName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  title: String(pageName).charAt(0).toUpperCase() + String(pageName).slice(1),
                  path: pageName === 'home' ? '/' : `/${String(pageName).toLowerCase()}`,
                  isDefault: pageName === 'home' || i === 0,
                  seenInVideo: true,
                  components: [],
                  description: `${pageName} page - detected from Alpine.js`
                }));
                scanData = { pages };
                console.log("[stream] Detected", pages.length, "pages from Alpine.js x-show directives");
              }
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "complete",
            code: cleanCode,
            flowData, // Include flow data for building the flow map
            scanData, // Include scanData for Flow pages detection
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
