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
  // Replace any other stock/AI image services that will break
  code = code.replace(/https?:\/\/[^"'\s)]*shutterstock[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/[^"'\s)]*istockphoto[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/[^"'\s)]*stock\.adobe[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/[^"'\s)]*freepik[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/[^"'\s)]*rawpixel[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });
  code = code.replace(/https?:\/\/[^"'\s)]*depositphotos[^"'\s)]*/gi, () => { replacedCount++; return getPicsumUrl(); });

  // CATCH-ALL: Replace img src URLs that are NOT from allowed sources
  // Allowed: picsum.photos, pravatar.cc, dicebear.com, cdn.simpleicons.org, cloudinary, supabase, data:
  code = code.replace(/<img([^>]*?)src="(https?:\/\/[^"]+)"([^>]*?)>/gi, (match, before, url, after) => {
    const lowerUrl = url.toLowerCase();
    // Allow known-good sources
    if (lowerUrl.includes('picsum.photos') ||
        lowerUrl.includes('pravatar.cc') ||
        lowerUrl.includes('dicebear.com') ||
        lowerUrl.includes('simpleicons.org') ||
        lowerUrl.includes('cloudinary.com') ||
        lowerUrl.includes('supabase.co') ||
        lowerUrl.includes('cdn.jsdelivr.net') ||
        lowerUrl.includes('unpkg.com') ||
        lowerUrl.includes('cdnjs.cloudflare.com') ||
        lowerUrl.includes('googleapis.com/storage')) {
      return match; // Keep allowed URLs
    }
    // Replace unknown/potentially broken URLs with Picsum
    replacedCount++;
    return `<img${before}src="${getPicsumUrl()}"${after}>`;
  });

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

  // Use GREEDY match (last ```) to avoid stopping at nested code fences
  const htmlMatch = cleaned.match(/```html?\s*([\s\S]*)```\s*$/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) {
    let code = htmlMatch[1].trim();
    // Strip residual "html" language identifier at start
    code = code.replace(/^html\s*\n/i, '');
    return code;
  }

  const codeMatch = cleaned.match(/```\s*([\s\S]*)```\s*$/);
  if (codeMatch && codeMatch[1].trim().length > 100) {
    let code = codeMatch[1].trim();
    code = code.replace(/^html\s*\n/i, '');
    return code;
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

  // Final fallback: strip ALL code fences and try
  const stripped = cleaned.replace(/```html?\s*/gi, '').replace(/```\s*/g, '').trim();
  if (stripped.length > 100 && (stripped.includes('<!DOCTYPE') || stripped.includes('<html'))) {
    return stripped;
  }

  return null;
}

// Post-process: fix zero values in stat/metric elements
// AGGRESSIVE zero detection — catches $0K, $0, >0<, 0%, data-to="0" in ALL contexts
function fixZeroStats(code: string): string {
  if (!code) return code;
  let fixed = code;

  // Pool of realistic replacement values for variety
  let valueIdx = 0;
  const statValues = ['2,847', '1,293', '8,451', '3,672', '956', '4,128', '12,394', '7,561'];
  const dollarValues = ['$14,250', '$8,730', '$42,500', '$3,890', '$127,400', '$23,100', '$6,450', '$91,200'];
  const percentValues = ['84%', '67%', '92%', '43%', '71%', '58%', '95%', '36%'];
  const kValues = ['$14.2K', '$8.7K', '$42.5K', '$3.9K', '$127K', '$23.1K', '$6.5K', '$91.2K'];
  const getNext = (arr: string[]) => arr[(valueIdx++) % arr.length];

  // 1. data-to="0" → realistic count-up targets
  fixed = fixed.replace(/data-to="0"/g, () => `data-to="${getNext(statValues).replace(/,/g, '')}"`);

  // 2. Dollar zeros: $0K, $0M, $0B, $0.00, $0
  fixed = fixed.replace(/(>\s*)\$0\.00(\s*<)/g, (_m, pre, post) => `${pre}${getNext(dollarValues)}${post}`);
  fixed = fixed.replace(/(>\s*)\$0[KkMmBb](\s*<)/g, (_m, pre, post) => `${pre}${getNext(kValues)}${post}`);
  fixed = fixed.replace(/(>\s*)\$0(\s*<)/g, (_m, pre, post) => `${pre}${getNext(dollarValues)}${post}`);

  // 3. Percentage zeros: >0%< or >0 %<
  fixed = fixed.replace(/(>\s*)0\s*%(\s*<)/g, (_m, pre, post) => `${pre}${getNext(percentValues)}${post}`);

  // 4. Standalone zero in large text (text-3xl through text-9xl)
  fixed = fixed.replace(/(class="[^"]*text-[3-9]xl[^"]*"[^>]*>)\s*0\s*(<)/g, (_m, pre, post) => `${pre}${getNext(statValues)}${post}`);

  // 5. Standalone zero in ANY element: >0< (but NOT >0.5< or >10< or CSS/attribute contexts)
  // Only match when 0 is the ENTIRE text content between tags
  fixed = fixed.replace(/(>)\s*0\s*(<\/(?:span|p|h[1-6]|div|td|th|strong|b|em|li|dt|dd)>)/gi, (_m, pre, post) => `${pre}${getNext(statValues)}${post}`);

  // 6. Zero in stat-like containers near keywords (orders, customers, sales, revenue, users, visits)
  // Look for patterns like: >Orders</span><span...>0</span>  or label then value
  fixed = fixed.replace(/((?:order|customer|user|visit|sale|revenue|refund|transaction|conversion|session|subscriber|download|view|click|signup|booking|ticket|member|follower|request|payment|invoice|lead|deal|client|project|task|message|notification|email|campaign|impression|engagement|bounce|retention|churn|growth|profit|loss|expense|budget|forecast)[^<]{0,80}>)\s*0\s*(<)/gi, (_m, pre, post) => `${pre}${getNext(statValues)}${post}`);

  return fixed;
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
      model: "gemini-3.1-pro-preview",
      generationConfig: {
        temperature: 0.85, // High for creative Awwwards-level designs
        maxOutputTokens: 100000,
        // @ts-ignore - thinking for better code quality
        thinkingConfig: { thinkingBudget: 32768 },
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

🚨 WATCH THE ENTIRE VIDEO — EVERY SECOND, EVERY FRAME! Extract ALL content, ALL sections, ALL data.
If the video shows 10 sections → your output MUST have 10 sections. NEVER truncate or skip sections!
Your output should be 30,000-50,000+ characters for a complete page. Under 20,000 = TRUNCATED = FAILURE!
Then BUILD A COMPLETELY NEW, BREATHTAKING DESIGN.

🎨 REIMAGINE MODE — AWWWARDS-LEVEL QUALITY! TOP 1% WEB DESIGN!
The video is your CONTENT SOURCE only. You must INVENT a brand-new, STUNNING layout and design.
You are Gemini 3.1 Pro — create a page that would win an AWWWARDS Site of the Day award!

🚨🚨🚨 ANIMATION IS NOT OPTIONAL — IT IS THE #1 PRIORITY! 🚨🚨🚨
A page WITHOUT animations is a FAILURE. Every section, every card, every headline MUST move!
The GSAP script block at the end of </body> is MANDATORY — without it the page is broken!

REQUIRED ANIMATION CHECKLIST (you MUST implement ALL of these):
✅ Hero section: split-text character animation OR dramatic scale-up entrance
✅ Every other section: gsap.from() with ScrollTrigger (fade, slide, scale, rotate — DIFFERENT per section!)
✅ Cards/grids: stagger animation (cards appear one after another with 0.1-0.15s delay)
✅ Stats/numbers: count-up animation from 0 to final value
✅ Hover effects: ALL cards lift on hover (translateY(-8px) + shadow increase)
✅ Background: animated gradient, aurora, particles, or floating orbs (NOT plain solid!)
✅ Parallax: at least 1 parallax element (gsap scrub)
✅ Custom cursor OR gradient text OR split text for visual flair

MANDATORY: Your HTML MUST end with a <script> block containing gsap.registerPlugin(ScrollTrigger) and animations!
If your output has NO gsap.from() or gsap.fromTo() calls, IT IS BROKEN AND WILL BE REJECTED!

- Create YOUR OWN unique animations with GSAP, CSS, and vanilla JS
- Each section should have a DIFFERENT animation approach — variety is key!
- Be BOLD: asymmetric layouts, creative typography, unexpected interactions
- Animated backgrounds: aurora blobs, gradient mesh, floating particles — NOT plain colors!

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
CDN LIBRARIES — Load in <head>:
═══════════════════════════════════════════════════
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

═══════════════════════════════════════════════════
📊 CHART.JS — HTML MODE (for dashboards with charts):
═══════════════════════════════════════════════════
For EVERY chart in a dashboard, use this pattern:
<div class="h-64 overflow-hidden chart-container">
  <canvas id="chart-unique-id"></canvas>
</div>

Then at the BOTTOM of <body>, AFTER all chart containers, add ONE script that initializes ALL charts with scroll animation:
<script>
// Initialize charts with scroll-triggered animation
function initCharts() {
  const chartConfigs = [
    { id: 'chart-sales', type: 'line', data: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], datasets: [{ label: 'Revenue', data: [1200,1900,3000,2500,2200,3100,2800,3500,2900,3200,2700,3800], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 2, tension: 0.4, fill: true }] }, opts: {} },
    // Add more chart configs here...
  ];

  chartConfigs.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          new Chart(el, {
            type: cfg.type,
            data: cfg.data,
            options: {
              responsive: true, maintainAspectRatio: false,
              animation: { duration: 1500, easing: 'easeOutQuart' },
              plugins: { legend: { display: true } },
              ...cfg.opts
            }
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(el.parentElement || el);
  });
}
document.addEventListener('DOMContentLoaded', initCharts);
</script>

IMPORTANT PATTERN for chart initialization:
- Define ALL chart configs in a single array at the bottom
- Each chart uses IntersectionObserver to animate on scroll into view
- Animation: duration 1500ms, easeOutQuart — charts DRAW IN smoothly when scrolled to!
- The observer fires ONCE per chart (unobserve after init)

RULES:
- EVERY canvas MUST have a UNIQUE id (chart-sales, chart-progress, chart-orders etc.)
- Container div MUST have explicit height (h-64 or h-80) + overflow-hidden + class="chart-container"
- Doughnut/Pie: add opts: { scales: { x: { display: false }, y: { display: false } } }
- Use REAL data values — NEVER zeros! Estimate realistic numbers
- Match chart colors to the dashboard theme
- animation: { duration: 1500, easing: 'easeOutQuart' } — charts must ANIMATE on appear!
- 🚨 NEVER fake charts with colored divs/circles/SVG — ALWAYS use Chart.js!

═══════════════════════════════════════════════════
ANIMATION PATTERNS (GSAP + CSS):
═══════════════════════════════════════════════════

Then at the end of <body>, implement ALL of these animation patterns:

───── 1. SPLIT TEXT ENTRANCE (for hero headline) ─────
🚨 NEVER combine split-text with glitch or gradient-text on the SAME element — pick ONE!
Split headline into WORDS first (to preserve word-wrap), then chars within each word:
document.querySelectorAll('.split-text').forEach(el => {
  // Remove conflicting pseudo-element attributes
  el.removeAttribute('data-text');
  el.classList.remove('glitch','gradient-text');
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(word =>
    '<span style="display:inline-block;white-space:nowrap;margin-right:0.3em">' +
    word.split('').map(ch => '<span style="display:inline-block;will-change:transform,opacity;">' + ch + '</span>').join('') +
    '</span>'
  ).join('');
  el.style.overflowWrap = 'break-word';
  gsap.fromTo(el.querySelectorAll('span > span'),
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.02,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
});
IMPORTANT: The headline element MUST have style="font-size:clamp(2.5rem,5vw,4.5rem)" — NEVER a fixed huge size!
🚨 TEXT ANIMATION EXCLUSIVITY: Each element gets AT MOST ONE text effect:
- split-text OR gradient-text OR glitch-text — NEVER combine them on the same element!
- Combining them creates garbled/doubled text. Pick ONE per element.

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
🚨 IMPORTANT: The HTML must show the REAL final value as text content (not "0"):
  <span class="count-up" data-to="5000" data-suffix="+">5,000+</span>
The JS will animate FROM 0 TO the value. If JS fails, the real number is still visible!
Animated counter using IntersectionObserver:
document.querySelectorAll('.count-up').forEach(el => {
  const to = parseFloat(el.dataset.to);
  if (!to || to === 0) return; // Skip zeros — NEVER animate to 0!
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  // Save original text as fallback, then start from 0
  const fallback = el.textContent;
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
  // Safety: if not visible after 3s, show final value
  setTimeout(() => { if (el.textContent === prefix + '0' + suffix) el.textContent = prefix + Math.round(to).toLocaleString() + suffix; }, 3000);
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

───── 7. GLITCH TEXT (for dramatic headlines — NEVER combine with split-text!) ─────
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

───── 10. BACKGROUND TEXTURES (choose ONE if any — do NOT always add grain!) ─────
Pick AT MOST one of these textures — OR use NONE if the design looks better clean:
Option A: Subtle grain canvas (use sparingly, NOT on every page):
<canvas id="grain" style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;opacity:0.04;"></canvas>
Option B: CSS dot grid pattern (subtle dots overlay)
Option C: Diagonal lines pattern
Option D: No texture — let gradients and color do the work
🚨 DO NOT default to grain on every page! Variety is key. Most modern UIs look BETTER without grain.

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

✅ ALWAYS use flex layout for sidebar+main:
✅ Main area MUST have min-width:0 and overflow-x:hidden
✅ SINGLE <main> element — content renders once, works on ALL screen sizes!

MANDATORY STRUCTURE (match the VIDEO's theme for colors!):
<!-- Responsive sidebar: desktop shows sidebar, mobile shows hamburger + drawer -->
<div x-data="{ sidebarOpen: false }" class="min-h-screen">
  <!-- MOBILE TOP NAV (shown < lg) -->
  <div class="lg:hidden flex items-center justify-between p-4 border-b" style="border-color:var(--border,#e5e7eb);">
    <span class="font-bold">App Name</span>
    <button @click="sidebarOpen = !sidebarOpen">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <!-- MOBILE SLIDE-OUT DRAWER (overlay on mobile) -->
  <div x-show="sidebarOpen" @click.away="sidebarOpen=false" x-transition class="lg:hidden fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/50" @click="sidebarOpen=false"></div>
    <aside class="relative z-50 w-64 h-full overflow-y-auto p-4" style="background:var(--sidebar-bg,#1f2937);">
      <!-- Same nav items as desktop sidebar -->
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
The sidebar is hidden on mobile (hidden lg:flex), shown as slide-out drawer on demand.

📱 MOBILE SIDEBAR RULES:
- Sidebar uses class="hidden lg:flex" — invisible on mobile, visible on desktop
- Mobile hamburger top nav uses class="lg:hidden"
- Tables on mobile: wrap in overflow-x:auto for horizontal scrolling

🚨🚨🚨 DASHBOARD COMPLETENESS — DO NOT TRUNCATE! 🚨🚨🚨
If the video shows a dashboard/admin panel, your <main> content MUST include ALL of these:
1. STAT CARDS ROW: 3-4 metric cards (total sales, orders, customers, etc.) in a grid
2. CHARTS: At MINIMUM 2 Chart.js charts (line/bar/doughnut) using <canvas> — NEVER skip charts!
3. DATA TABLE: At least 1 table with 5+ rows of realistic data
4. RECENT ACTIVITY or NOTIFICATIONS: A list/feed section
5. If video shows more content (widgets, calendars, maps) → include ALL of them!
❌ A dashboard with ONLY stat cards and nothing below = INCOMPLETE = FAILURE!
❌ Empty main content area = FAILURE! The <main> tag MUST have substantial content inside!
- ❌ NEVER create TWO separate main content areas (one for desktop, one for mobile)
- ❌ NEVER show a 250px sidebar on mobile

═══════════════════════════════════════════════════
🚨🚨🚨 FINAL ANIMATION ENFORCEMENT — READ THIS LAST! 🚨🚨🚨
═══════════════════════════════════════════════════
BEFORE you write the closing </body> tag, you MUST add a <script> block with:

1. gsap.registerPlugin(ScrollTrigger);
2. At LEAST 5 different gsap.from() calls targeting different sections
3. A count-up animation for any stat numbers
4. Stagger animations for card grids
5. At least ONE background effect (aurora, particles, gradient mesh, or floating blobs)

YOUR HTML OUTPUT MUST CONTAIN ALL OF THESE (search your output before submitting!):
✅ gsap.registerPlugin(ScrollTrigger)  — if missing, animations are BROKEN
✅ gsap.from( — at minimum 5 calls for different sections
✅ ScrollTrigger: { — attached to each gsap.from()
✅ stagger: — for at least one card/grid animation
✅ Hover effects on interactive elements (CSS transition + transform)
✅ Animated background (CSS @keyframes or canvas particles or gradient animation)

🚨 A PAGE WITH NO ANIMATIONS IS A FAILURE! IT WILL BE REJECTED!
🚨 TEXT ANIMATION SAFETY: Each element gets AT MOST ONE text effect
🚨 DO NOT repeat the same animation on every section — VARY them!

If multiple pages shown: use Alpine.js x-data/x-show for navigation.
Wrap in \`\`\`html blocks.`;
          } else {
            prompt += `

🚨🚨🚨 WATCH THE ENTIRE VIDEO — EVERY SECOND, EVERY FRAME, EVERY SECTION! 🚨🚨🚨
- PAUSE at each moment to identify ALL sections shown in the video
- SCROLL through the ENTIRE video timeline — beginning, middle, AND end!
- Count the TOTAL number of sections/blocks visible → your output MUST have the SAME number!
- If the video shows 8 sections → output 8 sections. If it shows 12 → output 12. NEVER truncate!
- LATER FRAMES show footer, testimonials, pricing, FAQ — do NOT skip these!
- Your output should be 30,000-50,000+ characters for a complete page — if under 20,000 you are TRUNCATING!

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

   📐 GRID ALIGNMENT (CRITICAL — blocks MUST align evenly in rows!):
   - EVERY row of cards/sections: use CSS Grid, NEVER flex-wrap for card rows
   - Stat card row: grid grid-cols-2 md:grid-cols-4 gap-4 (equal width + equal height automatically!)
   - Chart row (2 charts side-by-side): grid grid-cols-1 lg:grid-cols-2 gap-4 or gap-6
   - Table row (2 tables side-by-side): grid grid-cols-1 lg:grid-cols-2 gap-4 or gap-6
   - EVERY card inside grid: add h-full so card fills the entire grid cell height
   - Pattern: <div class="grid grid-cols-2 gap-4"><div class="bg-white rounded-xl p-4 h-full">...</div><div class="bg-white rounded-xl p-4 h-full">...</div></div>
   - 🚨 Cards in the SAME ROW must be the SAME HEIGHT — CSS Grid does this automatically when you use h-full on children!
   - If one card has more content, the shorter card stretches to match — this is the correct behavior!

   📊 CHART RULES:
   - ALL charts: MUST use Chart.js via canvas — NEVER fake charts with colored divs/circles/SVG shapes!
   - ALL charts: wrap in container with EXPLICIT height (h-64 or h-80) + overflow-hidden
   - Chart parent cards MUST have overflow-hidden (prevents canvas bleeding)
   - Pie/Donut charts: h-64 w-64 mx-auto square container, disable axes (display: false)
   - Line/Bar/Area charts: h-64 or h-80 full-width container
   - Chart data format: { labels: [...], datasets: [{ data: [numbers], borderColor/backgroundColor }] }
   - 🚨 NEVER approximate charts with decorative circles, colored divs, or SVG shapes!
   - ALL tables, data grids: wrap in overflow-x:auto container
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
            // RECONSTRUCT mode — remind to match the video's theme
            contentParts.push({ text: `🚨 POST-VIDEO THEME REMINDER:
You just watched a video. Before generating code, answer this question:
Was the main background in the video LIGHT (white/cream/gray) or DARK (black/dark gray)?

- If LIGHT: <body class="bg-white text-gray-900"> and use light Tailwind classes throughout
- If DARK: <body class="bg-[#0a0a0a] text-white"> and use dark Tailwind classes throughout

Match the video EXACTLY. Do NOT default to dark if the video was light!
Generate the HTML now matching the video's actual theme.` });
          }

          // ZERO BAN post-video reminder (ALL modes)
          contentParts.push({ text: `🚨🚨🚨 ZERO BAN — FINAL CHECK BEFORE GENERATING:
The video may show animated counters that START at 0 and count UP. Those 0s are NOT the real values!
- "0 funded startups" → WRONG! Use "5,000+" or the value from the LAST video frame
- "$0B combined valuation" → WRONG! Use "$800B+" or similar
- "0 cases", "$0.00", "0 users" → ALL WRONG! Use realistic non-zero values
- If you see 0 in a stat/metric → it's an animation start frame → use the FINAL value!
- SCAN THE LAST 5 SECONDS of the video for the real final counter values!
DO NOT output ANY stat/metric/KPI with value 0. Every number must be realistic and non-zero.` });

          // Retry loop for 503/429 high demand errors
          const MAX_RETRIES = 3;
          const retryDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          let streamResult;
          let lastStreamError;

          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              streamResult = await withTimeout(
                model.generateContentStream(contentParts),
                360000, // 6 minute timeout for complex generation with high thinking budget
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
          cleanCode = fixZeroStats(cleanCode);

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
