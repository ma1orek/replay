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
    const { videoBase64, mimeType, styleDirective, databaseContext, styleReferenceImage, creativityLevel = 0 } = body;

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
          
          // Add user's style directive if provided (simple text, no enterprise stuff)
          if (styleDirective && styleDirective.trim()) {
            prompt += `\n\n═══════════════════════════════════════════════════════════════
🎨 USER STYLE REQUEST
═══════════════════════════════════════════════════════════════
${styleDirective}`;
          }
          
          // Add database context if provided
          if (databaseContext && databaseContext.trim()) {
            prompt += `\n\n═══════════════════════════════════════════════════════════════
💾 DATABASE CONTEXT
═══════════════════════════════════════════════════════════════
${databaseContext}`;
          }
          
          // Creativity level instructions
          if (creativityLevel > 0) {
            prompt += `\n\n🎨 CREATIVITY LEVEL: ${creativityLevel}/100 ${creativityLevel <= 33 ? '(ENHANCED)' : creativityLevel <= 66 ? '(CREATIVE)' : '(MAXIMUM)'}`;
            if (creativityLevel <= 33) {
              prompt += `\nKeep layout identical. Add smoother animations, refined typography, subtle polish. Content MUST remain 100% identical.`;
            } else if (creativityLevel <= 66) {
              prompt += `\nKeep ALL content but reimagine layout. Use creative sections, bento grids, impressive animations. Content MUST remain identical.`;
            } else {
              prompt += `\nKeep ALL content verbatim but FULLY reimagine the design. Bold layouts, maximum animations, creative typography, rich effects. Content 100% identical.`;
            }
          }

          // MINIMAL VISION INSTRUCTIONS - NO CODE EXAMPLES!
          prompt += `

WATCH THE VIDEO. CREATE AWWWARDS-QUALITY OUTPUT.

CRITICAL: Every section MUST have REAL content (no empty cards!). Every image uses UNIQUE picsum seed.
If a section spans full width in the video → make it full width in output.

If multiple pages shown: use Alpine.js x-data/x-show for navigation.
Include GSAP + ScrollTrigger for animations.
Wrap in \`\`\`html blocks.`;


          // SEND VIDEO TO GEMINI 3 PRO - IT SEES AND CODES!
          const result = await withTimeout(
            model.generateContentStream([
              { text: prompt },
              { inlineData: { mimeType, data: videoBase64 } },
            ]),
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
          
          // Fix broken images and template literals
          cleanCode = fixBrokenImageUrls(cleanCode);
          cleanCode = fixTemplateLiteralErrors(cleanCode);
          
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
