import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

function getApiKey() {
  return process.env.GEMINI_API_KEY || "";
}

// Server-Sent Events streaming for Edit with AI
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

        const apiKey = getApiKey();
        if (!apiKey) {
          send("error", { error: "API key not configured" });
          controller.close();
          return;
        }

        // Send initial status
        send("status", { message: "Analyzing your request...", phase: "init" });

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // PLAN MODE - Quick conversational response
        if (isPlanMode) {
          send("status", { message: "Thinking...", phase: "plan" });
          
          const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
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

          const result = await model.generateContentStream([{ text: planPrompt }]);
          
          let fullText = "";
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullText += text;
            send("chunk", { text, fullText });
          }

          send("complete", { code: fullText, isChat: true });
          controller.close();
          return;
        }

        // EDIT MODE - Full code generation with streaming status
        
        // Always use the best model for code editing - reliability is critical
        const modelToUse = "gemini-3-flash-preview";
        
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

        // Process images if any
        const validImages = images?.filter((img: any) => (img.base64 && img.base64.length > 100) || img.url) || [];
        const processedImages: { base64: string; mimeType: string }[] = [];

        if (validImages.length > 0) {
          send("status", { message: `Processing ${validImages.length} image(s)...`, phase: "images" });
          
          for (const img of validImages) {
            if (img.url && !img.base64) {
              try {
                const response = await fetch(img.url);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  const base64 = Buffer.from(arrayBuffer).toString('base64');
                  processedImages.push({
                    base64,
                    mimeType: response.headers.get('content-type') || 'image/png',
                  });
                }
              } catch (e) {
                console.error("Image fetch error:", e);
              }
            } else if (img.base64) {
              processedImages.push({ base64: img.base64, mimeType: img.mimeType });
            }
          }
        }

        send("status", { message: "Generating code with AI...", phase: "ai" });

        const model = genAI.getGenerativeModel({
          model: modelToUse, // gemini-2.5-flash-preview for fast editing
          generationConfig: { temperature: 0.7, maxOutputTokens: 100000 },
        });

        // Build prompt
        const prompt = buildEditPrompt(currentCode, editRequest, databaseContext, processedImages);

        // Build parts with images
        const parts: any[] = [{ text: prompt }];
        for (const img of processedImages) {
          parts.push({
            inlineData: { mimeType: img.mimeType, data: img.base64 },
          });
        }

        send("status", { message: "Writing code...", phase: "writing" });

        // Stream the response with real-time code chunks and timeout protection
        let result;
        try {
          // Set a timeout for the stream initialization
          const streamPromise = model.generateContentStream(parts);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Stream initialization timeout")), 30000)
          );
          result = await Promise.race([streamPromise, timeoutPromise]) as any;
        } catch (streamError) {
          console.error("[Stream Edit] Stream init error:", streamError);
          // Fallback to non-streaming for reliability
          send("status", { message: "Switching to reliable mode...", phase: "fallback" });
          try {
            const fallbackResult = await model.generateContent(parts);
            const fallbackCode = fallbackResult.response.text();
            const extractedCode = extractCode(fallbackCode);
            if (extractedCode) {
              send("complete", { code: extractedCode, summary: "Code updated successfully" });
            } else {
              send("error", { error: "Failed to generate valid code" });
            }
            controller.close();
            return;
          } catch (fallbackError) {
            send("error", { error: "AI generation failed. Please try again." });
            controller.close();
            return;
          }
        }
        
        let fullCode = "";
        let chunkCount = 0;
        let lastSentLength = 0;
        let lastChunkTime = Date.now();
        const CHUNK_TIMEOUT = 15000; // 15s timeout between chunks
        
        for await (const chunk of result.stream) {
          // Check for timeout between chunks
          if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
            console.error("[Stream Edit] Chunk timeout - no data for 15s");
            break;
          }
          lastChunkTime = Date.now();
          
          const text = chunk.text();
          fullCode += text;
          chunkCount++;
          
          // Send actual code chunks for real-time display
          if (text.length > 0) {
            send("chunk", { text, fullText: fullCode });
          }
          
          // Send progress updates every few chunks
          if (chunkCount % 3 === 0) {
            const lines = fullCode.split('\n').length;
            send("progress", { 
              lines,
              chars: fullCode.length,
              preview: fullCode.slice(-300) // Last 300 chars for better preview
            });
          }
        }

        send("status", { message: "Finalizing...", phase: "finalize" });
        await delay(50);

        // Extract code from response with improved extraction
        const extractedCode = extractCode(fullCode);
        
        if (extractedCode) {
          // Generate summary of changes
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
        } else {
          // Fallback: try to use the raw response if it looks like valid HTML
          const fallbackCode = tryFallbackExtraction(fullCode);
          if (fallbackCode) {
            const summary = generateChangeSummary(currentCode, fallbackCode, editRequest);
            send("complete", { code: fallbackCode, summary });
          } else {
            console.error("[Stream Edit] Failed to extract code. Raw response length:", fullCode.length);
            console.error("[Stream Edit] First 500 chars:", fullCode.slice(0, 500));
            
            // Check if AI just explained something instead of editing
            const looksLikeExplanation = fullCode.length < 2000 && 
              !fullCode.includes('<!DOCTYPE') && 
              !fullCode.includes('<html') &&
              !fullCode.includes('```');
            
            if (looksLikeExplanation) {
              // AI gave explanation - send as chat message
              send("complete", { 
                code: fullCode.trim(), 
                isChat: true,
                needsClarification: false
              });
            } else {
              // Ask for clarification
              const clarifyResponse = generateClarifyingQuestion(editRequest, currentCode);
              send("complete", { 
                code: clarifyResponse, 
                isChat: true,
                needsClarification: true
              });
            }
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
  // Clean response first
  let cleaned = response.trim();
  
  // Remove common AI response prefixes
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.trim();
  
  // Try to extract HTML from code blocks (multiple patterns)
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 50) return htmlMatch[1].trim();
  
  // Try generic code block
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 50) return codeMatch[1].trim();
  
  // Try to find HTML without code blocks
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  // Try just <html>...</html>
  const htmlTagMatch = cleaned.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) return htmlTagMatch[1].trim();
  
  // If response starts with <!DOCTYPE or <html, use it directly
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.startsWith('<html') || cleaned.startsWith('<HTML')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
    return cleaned;
  }
  
  // Last resort: find HTML anywhere in response
  const htmlStartIndex = cleaned.search(/<(!DOCTYPE|html)/i);
  if (htmlStartIndex >= 0) {
    const htmlContent = cleaned.substring(htmlStartIndex);
    const endIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return htmlContent.substring(0, endIndex + 7);
  }
  
  return null;
}

function tryFallbackExtraction(response: string): string | null {
  // More aggressive extraction for edge cases
  
  // Strip markdown code fences first
  let cleaned = response
    .replace(/```html?\s*/gi, '')
    .replace(/```tsx?\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // Look for any substantial HTML content
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
  
  // Try to find DOCTYPE and extract from there
  const doctypeIndex = cleaned.toLowerCase().indexOf('<!doctype');
  const htmlIndex = cleaned.toLowerCase().indexOf('<html');
  const startIndex = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;
  
  if (startIndex >= 0) {
    const fromStart = cleaned.substring(startIndex);
    const endIndex = fromStart.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) {
      return fromStart.substring(0, endIndex + 7);
    }
    // Even without closing tag, if it's substantial, return it
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
  
  // Check for new pages
  const oldPages = (oldCode.match(/x-show=["']currentPage\s*===?\s*["'][^"']+["']/gi) || []).length;
  const newPages = (newCode.match(/x-show=["']currentPage\s*===?\s*["'][^"']+["']/gi) || []).length;
  if (newPages > oldPages) {
    summaryParts.push(`Dodano ${newPages - oldPages} stron/ę`);
  }
  
  // Check for new sections
  const oldSections = (oldCode.match(/<section/gi) || []).length;
  const newSections = (newCode.match(/<section/gi) || []).length;
  if (newSections > oldSections) {
    summaryParts.push(`Dodano ${newSections - oldSections} sekcji`);
  }
  
  // Line changes
  if (lineDiff > 10) {
    summaryParts.push(`+${lineDiff} linii`);
  } else if (lineDiff < -10) {
    summaryParts.push(`${lineDiff} linii`);
  }
  
  if (summaryParts.length === 0) {
    summaryParts.push("Gotowe!");
  }
  
  return summaryParts.join(" • ");
}

function generateClarifyingQuestion(request: string, code: string): string {
  // Analyze what the user might have meant
  const hasElementRef = request.includes('@') || request.includes('div') || request.includes('button');
  const hasColorRef = /color|kolor|czerwon|niebiesk|zielon|biał|czarn/i.test(request);
  const hasTextRef = /text|tekst|tytuł|nagłówek|title|heading/i.test(request);
  const hasSizeRef = /bigger|smaller|większ|mniejsz|size|rozmiar/i.test(request);
  
  let question = "Hej, mógłbyś doprecyzować? ";
  
  if (hasColorRef && !hasElementRef) {
    question += "Który element zmienić? Napisz np. 'przycisk główny' albo 'nagłówek'.";
  } else if (hasTextRef && !hasElementRef) {
    question += "Który tekst zmieniamy? Podaj kawałek obecnego tekstu.";
  } else if (hasSizeRef && !hasElementRef) {
    question += "Co powiększyć/zmniejszyć? Podaj który element.";
  } else {
    question += "Powiedz mi konkretniej co zmienić - np. 'zielony przycisk' albo 'tekst w nagłówku'.";
  }
  
  return question;
}

function buildEditPrompt(code: string, request: string, dbContext?: string, images?: any[]): string {
  const imageContext = images && images.length > 0 
    ? `\n\nThe user has attached ${images.length} image(s). Use them as visual reference for the changes.`
    : '';
    
  const dbContextStr = dbContext 
    ? `\n\nDATABASE CONTEXT:\n${dbContext}`
    : '';

  return `You are Replay, an Elite UI Engineering AI specialized in editing production-ready HTML/CSS/Alpine.js code.

🎯 YOUR MISSION: Edit the code according to the user's request while maintaining code quality and functionality.

═══════════════════════════════════════════════════════════════════════════════
📄 CURRENT CODE (PRESERVE ALL FUNCTIONALITY):
═══════════════════════════════════════════════════════════════════════════════
\`\`\`html
${code}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
📝 USER REQUEST:
═══════════════════════════════════════════════════════════════════════════════
${request}${imageContext}${dbContextStr}

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL OUTPUT RULES (MUST FOLLOW):
═══════════════════════════════════════════════════════════════════════════════
1. ✅ Return COMPLETE HTML document (<!DOCTYPE html> to </html>)
2. ✅ Wrap code in \`\`\`html code blocks
3. ✅ Include ALL original functionality - do not remove anything unless asked
4. ✅ Preserve Alpine.js x-data, x-show, x-on directives exactly
5. ✅ Keep all existing pages, navigation, and multi-page structure
6. ❌ NEVER return partial code, explanations instead of code, or code fragments
7. ❌ NEVER say "here's the code" without providing full code

═══════════════════════════════════════════════════════════════════════════════
🛠️ TECHNICAL STANDARDS:
═══════════════════════════════════════════════════════════════════════════════
- Use Tailwind CSS for all styling
- Use Alpine.js for interactivity (x-data, x-show, x-on, x-transition)
- Mobile-first responsive design (sm:, md:, lg:, xl: breakpoints)
- HOVER CONTRAST: Dark bg hover → hover:text-white, Light bg hover → hover:text-black
- NEVER use "0" for stats - use realistic numbers: "26 Years", "1.3M+ Users", "104 Projects"

═══════════════════════════════════════════════════════════════════════════════
📐 SIDEBAR LAYOUT RULES (CRITICAL):
═══════════════════════════════════════════════════════════════════════════════
If the code has a SIDEBAR MENU, you MUST follow these layout rules:

**CORRECT STRUCTURE:**
\`\`\`html
<body class="min-h-screen bg-gray-50">
  <!-- Fixed sidebar -->
  <aside class="fixed left-0 top-0 h-screen w-64 lg:w-72 bg-white border-r z-40">
    <!-- Sidebar content -->
  </aside>
  
  <!-- Main content - MUST have left margin equal to sidebar width -->
  <main class="ml-64 lg:ml-72 min-h-screen">
    <!-- Header inside main -->
    <header class="sticky top-0 bg-white border-b z-30">...</header>
    <!-- Content -->
    <div class="p-6">...</div>
  </main>
</body>
\`\`\`

**KEY RULES:**
1. Sidebar: \`fixed left-0 top-0 h-screen w-64\` (or w-72, w-80)
2. Main content: \`ml-64\` (MUST match sidebar width!)
3. If sidebar is w-72, main must be ml-72
4. If sidebar is w-80, main must be ml-80
5. Content should NEVER go under/behind the sidebar
6. On mobile: sidebar hidden or overlay, main has ml-0

**MOBILE RESPONSIVE:**
\`\`\`html
<aside class="fixed left-0 top-0 h-screen w-64 -translate-x-full lg:translate-x-0 transition-transform z-50">
<main class="lg:ml-64 min-h-screen">
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
🎨 COMPONENT QUALITY STANDARDS:
═══════════════════════════════════════════════════════════════════════════════
• FAQ/ACCORDION:
  - x-transition:enter="transition ease-out duration-200"
  - x-transition:enter-start="opacity-0 -translate-y-2"
  - x-transition:enter-end="opacity-100 translate-y-0"
  - Rotating chevron: :class="{ 'rotate-180': open }" transition-transform duration-300

• MARQUEE/INFINITE SCROLL:
  - Outer: overflow-hidden
  - Inner: flex w-max animate-marquee
  - Two groups: flex shrink-0 items-center gap-16 pr-16
  - DUPLICATE all content for seamless loop
  - @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

• IMAGES: ONLY use https://picsum.photos/WxH?random=N (increment N)
  ❌ NEVER use images.unsplash.com or pexels.com - BANNED!
• AVATARS: ONLY use https://i.pravatar.cc/150?img=N (increment N)
• VIDEO THUMBNAILS: picsum.photos + play button overlay

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT:
═══════════════════════════════════════════════════════════════════════════════
Return ONLY the complete modified HTML code wrapped in \`\`\`html blocks.
Start with <!DOCTYPE html> and end with </html>.
No explanations before or after the code block.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
... complete code ...
</html>
\`\`\``;
}

