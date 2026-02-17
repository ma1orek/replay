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
  // Repeatedly fix <tag1 <tag2 ... patterns until none remain
  let prev = "";
  while (prev !== fixed) {
    prev = fixed;
    fixed = fixed.replace(/<(\w+)\s+<\w+(\s+)/g, (match, firstTag, trailing) => {
      fixCount++;
      return `<${firstTag}${trailing}`;
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
    
    // SINGLE MODEL: Gemini 3 Pro with VISION
    // Pro SEES the video directly and generates code - NO intermediate JSON!
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.85, // High for creative Awwwards-level designs
        maxOutputTokens: 100000,
        // @ts-ignore - thinking for better code quality
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
- 🚨 ZERO BAN: 0 is BANNED in stats! "0 funded startups" → "5,000+". "$0B" → "$800B+". Scan LAST 5 SECONDS for final counter values!
- 🏢 Company logos: styled TEXT with company name/initials, NOT external image URLs
- Every image: unique picsum.photos seed (e.g. ?random=hero1, ?random=feat2)

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
- All text readable: ensure contrast, use text-shadow on image backgrounds
- Test: every section must look clean and aligned at 1200px width
- NO broken overlapping elements, NO elements going off-screen
- 🚨 TEXT VISIBILITY: NO text may be cut off or overflow its container!
  - Headlines: use font-size:clamp(2rem,5vw,5rem) so they SHRINK on narrow viewports
  - NEVER use text-8xl or text-9xl as fixed size — always use clamp() or responsive Tailwind (text-4xl md:text-6xl lg:text-7xl)
  - Add overflow-wrap:break-word on all text containers
  - Verify ALL text is fully visible — if a headline is too long, it must wrap naturally at WORD boundaries, never mid-word

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
ANIMATION LIBRARY — USE ALL OF THESE (from reactbits.dev)
═══════════════════════════════════════════════════
Load these CDNs in <head>:
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

Then at the end of <body>, implement ALL of these animation patterns:

───── 1. SPLIT TEXT ENTRANCE (for hero headline) ─────
Split headline into WORDS first (to preserve word-wrap), then chars within each word:
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
IMPORTANT: The headline element MUST have style="font-size:clamp(2.5rem,5vw,4.5rem)" — NEVER a fixed huge size!

───── 2. SCROLL REVEAL TEXT (for paragraphs/descriptions) ─────
Words unblur and fade in scrubbed to scroll:
document.querySelectorAll('.scroll-reveal-text').forEach(el => {
  el.innerHTML = el.textContent.split(/(\s+)/).map(w =>
    w.match(/^\\s+$/) ? w : '<span class="word" style="display:inline-block">' + w + '</span>'
  ).join('');
  const words = el.querySelectorAll('.word');
  gsap.fromTo(words, { opacity: 0.15, filter: 'blur(4px)' },
    { opacity: 1, filter: 'blur(0px)', ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: el.parentElement, start: 'top 80%', end: 'bottom 60%', scrub: true }
    });
});

───── 3. ANIMATED CONTENT ENTRANCE (for every section) ─────
Every section child slides up and fades in on scroll:
gsap.registerPlugin(ScrollTrigger);
document.querySelectorAll('[data-animate]').forEach(el => {
  const dir = el.dataset.animate || 'up';
  const from = { opacity: 0, y: dir==='up' ? 60 : dir==='down' ? -60 : 0,
    x: dir==='left' ? -60 : dir==='right' ? 60 : 0 };
  gsap.from(el, { ...from, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  });
});

───── 4. STAGGER CARDS (for feature/pricing cards) ─────
Cards stagger in from bottom with delay:
document.querySelectorAll('.stagger-cards').forEach(container => {
  const cards = container.children;
  gsap.fromTo(cards, { opacity: 0, y: 80, scale: 0.95 },
    { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: container, start: 'top 80%', once: true }
    });
});

───── 5. COUNT-UP NUMBERS (for stats/metrics) ─────
Animated counter using IntersectionObserver:
document.querySelectorAll('.count-up').forEach(el => {
  const to = parseFloat(el.dataset.to);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  el.textContent = prefix + '0' + suffix;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { obs.unobserve(el);
      const start = performance.now();
      (function step(now) {
        const t = Math.min((now - start) / 2000, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        el.textContent = prefix + Math.round(to * ease).toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(step);
      })(start);
    }});
  }, { threshold: 0.3 });
  obs.observe(el);
});

───── 6. GRADIENT TEXT (for key headlines) ─────
CSS class for animated gradient text:
.gradient-text {
  background: linear-gradient(to right, #5227FF, #FF9FFC, #B19EEF, #5227FF);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: gradient-shift 4s ease infinite alternate;
}
@keyframes gradient-shift { 0%{background-position:0% 50%} 100%{background-position:100% 50%} }

───── 7. GLITCH TEXT (for dramatic headlines) ─────
.glitch { position:relative; font-weight:900; }
.glitch::after,.glitch::before {
  content:attr(data-text); position:absolute; top:0; color:inherit;
  background:inherit; overflow:hidden; clip-path:inset(0);
}
.glitch::after { left:3px; text-shadow:-3px 0 red; animation:glitch-anim 3s infinite linear alternate-reverse; }
.glitch::before { left:-3px; text-shadow:3px 0 cyan; animation:glitch-anim 2s infinite linear alternate-reverse; }
@keyframes glitch-anim {
  0%{clip-path:inset(20% 0 50% 0)} 25%{clip-path:inset(40% 0 20% 0)}
  50%{clip-path:inset(15% 0 55% 0)} 75%{clip-path:inset(30% 0 40% 0)}
  100%{clip-path:inset(10% 0 60% 0)}
}

───── 8. SPOTLIGHT CARDS (cursor-following light on hover) ─────
.card-spotlight {
  position:relative; border-radius:1.5rem; border:1px solid rgba(255,255,255,0.08);
  background:#111; overflow:hidden;
  --mx:50%; --my:50%;
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

───── 9. INFINITE MARQUEE (for logo/partner bars) ─────
.marquee { overflow:hidden; position:relative; width:100%; }
.marquee-track {
  display:flex; width:max-content; gap:3rem;
  animation: marquee-scroll 25s linear infinite;
}
.marquee-track:hover { animation-play-state:paused; }
@keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
IMPORTANT: duplicate all items inside marquee-track so loop is seamless!

───── 10. FILM GRAIN OVERLAY (page-wide texture) ─────
Add a subtle noise texture over the entire page:
<canvas id="grain" style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;opacity:0.04;"></canvas>
<script>
(function(){const c=document.getElementById('grain'),x=c.getContext('2d');c.width=c.height=256;
let f=0;(function d(){if(f++%3===0){const i=x.createImageData(256,256);for(let j=0;j<i.data.length;j+=4){
const v=Math.random()*255;i.data[j]=i.data[j+1]=i.data[j+2]=v;i.data[j+3]=20;}x.putImageData(i,0,0);}
requestAnimationFrame(d);})();})();
</script>

───── 11. AURORA BACKGROUND (for hero or CTA sections) ─────
.aurora { position:absolute; inset:0; overflow:hidden; z-index:0; pointer-events:none; }
.aurora::before,.aurora::after {
  content:''; position:absolute; width:150%; height:60%; border-radius:50%;
  filter:blur(80px); opacity:0.4;
  animation:aurora-drift 8s ease-in-out infinite alternate;
}
.aurora::before { background:radial-gradient(ellipse,#5227FF 0%,transparent 70%); top:-20%; left:-25%; }
.aurora::after { background:radial-gradient(ellipse,#7cff67 0%,transparent 70%); bottom:-20%; right:-25%;
  animation-delay:-4s; animation-direction:alternate-reverse; }
@keyframes aurora-drift { 0%{transform:translateX(-10%) translateY(0) rotate(-5deg)} 100%{transform:translateX(10%) translateY(-10%) rotate(5deg)} }

───── 12. FLOATING PARTICLES (for hero background) ─────
<canvas id="particles" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
<script>
(function(){const c=document.getElementById('particles'),x=c.getContext('2d');
let w,h,p=[];function r(){w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;}
window.addEventListener('resize',r);r();
for(let i=0;i<80;i++)p.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*2+0.5,
  vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,a:Math.random()*0.5+0.3});
(function d(){x.clearRect(0,0,w,h);p.forEach(pt=>{pt.x+=pt.vx;pt.y+=pt.vy;
  if(pt.x<0)pt.x=w;if(pt.x>w)pt.x=0;if(pt.y<0)pt.y=h;if(pt.y>h)pt.y=0;
  x.beginPath();x.arc(pt.x,pt.y,pt.r,0,Math.PI*2);x.fillStyle='rgba(255,255,255,'+pt.a+')';x.fill();});
  requestAnimationFrame(d);})();})();
</script>

───── 13. GLASSMORPHISM CARDS ─────
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

───── 14. HOVER LIFT CARDS ─────
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

───── 15. STAR BORDER (animated orbiting glow) ─────
.star-border { position:relative; display:inline-block; border-radius:20px; overflow:hidden; padding:1px; }
.star-border::before,.star-border::after {
  content:''; position:absolute; width:300%; height:50%; opacity:0.7; border-radius:50%;
  background:radial-gradient(circle,white,transparent 10%); z-index:0;
}
.star-border::before { top:-12px; left:-250%; animation:star-orbit 6s linear infinite alternate; }
.star-border::after { bottom:-12px; right:-250%; animation:star-orbit 6s linear infinite alternate-reverse; }
.star-border > * { position:relative; z-index:1; }
@keyframes star-orbit { 0%{transform:translateX(0);opacity:1} 100%{transform:translateX(-100%);opacity:0} }

───── 16. PARALLAX ELEMENTS ─────
At least 2 sections with background parallax:
document.querySelectorAll('[data-parallax]').forEach(el => {
  const speed = parseFloat(el.dataset.parallax) || 0.3;
  gsap.to(el, { yPercent: -20 * speed, ease: 'none',
    scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 }
  });
});

───── 17. CUSTOM SCROLLBAR (page-wide) ─────
Add to <style> for sleek custom scrollbar on the entire page:
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
html { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }

───── 18. HORIZONTAL SNAP CAROUSEL (for testimonials/cards) ─────
.snap-carousel {
  display:flex; gap:1.5rem; overflow-x:auto; scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch; padding-bottom:1rem;
  scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent;
}
.snap-carousel::-webkit-scrollbar { height:6px; }
.snap-carousel::-webkit-scrollbar-track { background:transparent; }
.snap-carousel::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
.snap-carousel > * { scroll-snap-align:start; flex:0 0 auto; min-width:300px; }

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

✅ ALWAYS use CSS Grid for sidebar+main layout:
✅ The sidebar and main content MUST be siblings in a grid container
✅ Main area MUST have min-width:0 and overflow-x:hidden

MANDATORY STRUCTURE (match the VIDEO's theme for colors!):
<!-- Desktop: sidebar + main grid. Mobile: top nav + stacked content -->
<div x-data="{ sidebarOpen: false }" class="min-h-screen">
  <!-- MOBILE TOP NAV (shown < lg) -->
  <div class="lg:hidden flex items-center justify-between p-4 border-b" style="border-color:var(--border,#e5e7eb);">
    <span class="font-bold">App Name</span>
    <button @click="sidebarOpen = !sidebarOpen">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <!-- MOBILE SLIDE-OUT MENU -->
  <div x-show="sidebarOpen" @click.away="sidebarOpen=false" x-transition class="lg:hidden fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/50" @click="sidebarOpen=false"></div>
    <aside class="relative z-50 w-64 h-full overflow-y-auto p-4" style="background:var(--sidebar-bg,#1f2937);">
      <!-- sidebar nav items (same as desktop) -->
    </aside>
  </div>
  <!-- DESKTOP GRID LAYOUT (shown >= lg) -->
  <div class="hidden lg:grid" style="grid-template-columns:250px 1fr;min-height:100vh;">
    <aside style="overflow-y:auto;padding:1rem;">
      <!-- sidebar logo + nav items — use video's sidebar color! -->
    </aside>
    <main style="min-width:0;overflow-x:hidden;overflow-y:auto;padding:1.5rem;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;">
        <!-- stat cards, tables, charts -->
      </div>
    </main>
  </div>
  <!-- MOBILE MAIN CONTENT (shown < lg, below top nav) -->
  <main class="lg:hidden p-4" style="min-width:0;overflow-x:hidden;">
    <!-- Same content as desktop main, stacked vertically -->
  </main>
</div>

📱 MOBILE SIDEBAR RULES (CRITICAL!):
- On mobile (< lg breakpoint): sidebar MUST become a hamburger menu at the TOP
- NEVER show a 250px sidebar on mobile — it takes the entire screen width!
- Use Alpine.js x-show to toggle a slide-out drawer on mobile
- Desktop (lg+): CSS Grid with sidebar + main as usual
- The main content on mobile should stack vertically with full width
- Tables on mobile: use overflow-x:auto so they scroll horizontally

VERIFICATION: After generating, check that:
1. Desktop: outermost layout has display:grid with grid-template-columns
2. Desktop: <aside> and <main> are DIRECT children of the grid container
3. Mobile: sidebar is HIDDEN, replaced by top nav bar with hamburger toggle
4. Mobile: main content is full-width, stacked vertically
5. No element uses position:fixed to create a permanent sidebar

═══════════════════════════════════════════════════
ASSEMBLY RULES — MINIMUM REQUIREMENTS:
═══════════════════════════════════════════════════
You MUST use at least:
- split-text on the hero headline
- scroll-reveal-text on at least 1 description paragraph
- data-animate on every major content block
- stagger-cards on at least 1 card grid
- count-up on every stat/metric number
- gradient-text on at least 1 secondary headline
- card-spotlight on at least 1 card set
- marquee on any logo/partner bar
- grain overlay on the full page
- aurora OR particles on the hero background
- glass-card on at least 2 cards
- hover-lift on all interactive cards
- parallax on at least 2 decorative elements
- At least 1 glitch-text OR star-border element
- Custom scrollbar styling on <html>
- snap-carousel on testimonials section (HORIZONTAL, never vertical stack)

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
3. 🚨🚨🚨 ZERO BAN: The number 0 is BANNED in statistics/metrics! Websites use animated counters that START at 0 and count UP.
   - "0 funded startups" → WRONG! Must be "5,000+" or similar real number
   - "$0B" → WRONG! Must be "$800B+" or similar real number
   - "0+" → WRONG! Must be a realistic large number
   - SCAN THE LAST 5 SECONDS of the video for the FINAL counter values!
   - If you cannot read the final value, ESTIMATE a realistic number — NEVER output zero!
4. 📐 MATCH THE VIDEO LAYOUT: If the video shows text on LEFT + image on RIGHT (split hero) → build a TWO-COLUMN hero, NOT centered. Do NOT center everything — match the column structure!
5. If the video shows buttons side-by-side → place them side-by-side (flex-row), not stacked.
6. 🏢 COMPANY LOGO SECTIONS: If the video shows a grid/row of company logos (partners, clients, "Top companies"):
   - Use STYLED TEXT with the company name or initial letter (e.g., <div class="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-white font-bold text-xl">S</div> for Stripe)
   - Do NOT use external image URLs for company logos — they WILL break!
   - cdn.simpleicons.org is OK ONLY for social media icons (GitHub, Twitter, LinkedIn)
7. 📊 DASHBOARD / APP UI LAYOUTS: If the video shows a dashboard, admin panel, or app with sidebar + main content:
   - Use CSS Grid: display:grid; grid-template-columns:250px 1fr; min-height:100vh;
   - Sidebar: fixed width, overflow-y:auto, flex-shrink:0
   - Main area: min-width:0 (CRITICAL — prevents chart/table overflow!)
   - ALL charts, tables, data grids: wrap in overflow-x:auto container, set width:100%; max-width:100%;
   - stat cards: grid with auto-fit minmax(250px,1fr)
   - NEVER let inner content push the grid wider than viewport
8. 📋 TESTIMONIALS: If the video shows testimonials/reviews/quotes:
   - Use horizontal scrolling carousel (overflow-x:auto, flex, gap, scroll-snap-type:x mandatory)
   - Each card: flex:0 0 340px (fixed width, NOT full-width stacking)
   - NEVER stack 3+ testimonials as a vertical column

If multiple pages shown: use Alpine.js x-data/x-show for navigation.
Include GSAP + ScrollTrigger for animations.
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
            // RECONSTRUCT mode — remind to match the video's theme
            contentParts.push({ text: `🚨 POST-VIDEO THEME REMINDER:
You just watched a video. Before generating code, answer this question:
Was the main background in the video LIGHT (white/cream/gray) or DARK (black/dark gray)?

- If LIGHT: <body class="bg-white text-gray-900"> and use light Tailwind classes throughout
- If DARK: <body class="bg-[#0a0a0a] text-white"> and use dark Tailwind classes throughout

Match the video EXACTLY. Do NOT default to dark if the video was light!
Generate the HTML now matching the video's actual theme.` });
          }

          const result = await withTimeout(
            model.generateContentStream(contentParts),
            240000, // 4 minute timeout for complex generation
            "Direct Vision Code Generation"
          );
          
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
