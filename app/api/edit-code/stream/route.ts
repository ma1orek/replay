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
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
          });

          const pageCount = (currentCode.match(/x-show=["']currentPage/gi) || []).length || 1;
          const planPrompt = `You are Replay. Keep responses SHORT (1-2 sentences).
PROJECT: ${pageCount} page(s), ~${Math.round(currentCode.length/1000)}KB
USER: ${editRequest}
Reply briefly and helpfully.`;

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
        
        // Detect if this is a simple request that can use faster model
        const simplePatterns = [
          /change.*text/i, /zmień.*tekst/i, /zmien.*tekst/i,
          /change.*color/i, /zmień.*kolor/i, /zmien.*kolor/i,
          /change.*font/i, /zmień.*czcionk/i,
          /make.*bigger/i, /make.*smaller/i, /zrób.*większ/i, /zrób.*mniejsz/i,
          /add.*text/i, /dodaj.*tekst/i,
          /remove.*text/i, /usuń.*tekst/i, /usun.*tekst/i,
          /change.*title/i, /zmień.*tytuł/i,
          /rename/i, /zmień.*nazw/i,
          /update.*text/i, /zaktualizuj.*tekst/i,
        ];
        const isSimpleRequest = simplePatterns.some(p => p.test(editRequest)) && editRequest.length < 100;
        const modelToUse = isSimpleRequest ? "gemini-2.0-flash" : "gemini-2.0-flash"; // Both fast for now
        
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
          model: "gemini-2.0-flash", // Faster model for streaming
          generationConfig: { temperature: 0.8, maxOutputTokens: 100000 },
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

        // Stream the response with real-time code chunks
        const result = await model.generateContentStream(parts);
        
        let fullCode = "";
        let chunkCount = 0;
        let lastSentLength = 0;
        
        for await (const chunk of result.stream) {
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
    summaryParts.push(`Added ${newPages - oldPages} new page(s)`);
  }
  
  // Check for new sections
  const oldSections = (oldCode.match(/<section/gi) || []).length;
  const newSections = (newCode.match(/<section/gi) || []).length;
  if (newSections > oldSections) {
    summaryParts.push(`Added ${newSections - oldSections} section(s)`);
  }
  
  // Line changes
  if (lineDiff > 10) {
    summaryParts.push(`+${lineDiff} lines`);
  } else if (lineDiff < -10) {
    summaryParts.push(`${lineDiff} lines`);
  }
  
  if (summaryParts.length === 0) {
    summaryParts.push("Code updated successfully");
  }
  
  return summaryParts.join(" • ");
}

function generateClarifyingQuestion(request: string, code: string): string {
  // Analyze what the user might have meant
  const hasElementRef = request.includes('@') || request.includes('div') || request.includes('button');
  const hasColorRef = /color|kolor|czerwon|niebiesk|zielon|biał|czarn/i.test(request);
  const hasTextRef = /text|tekst|tytuł|nagłówek|title|heading/i.test(request);
  const hasSizeRef = /bigger|smaller|większ|mniejsz|size|rozmiar/i.test(request);
  
  let question = "Hmm, nie do końca rozumiem. ";
  
  if (hasColorRef && !hasElementRef) {
    question += "Który element chcesz zmienić? Możesz użyć @ i kliknąć element w preview, albo opisz go dokładniej (np. 'przycisk główny', 'nagłówek', 'tło strony').";
  } else if (hasTextRef && !hasElementRef) {
    question += "Który tekst chcesz zmienić? Podaj mi fragment obecnego tekstu albo wskaż element używając @.";
  } else if (hasSizeRef && !hasElementRef) {
    question += "Co chcesz powiększyć/pomniejszyć? Kliknij element w preview z włączonym 'Select' albo opisz który to element.";
  } else {
    question += "Możesz:\n• Użyć **Select** (wskaźnik) i kliknąć element który chcesz zmienić\n• Opisać dokładniej który element mam edytować\n• Podać przykład jak ma wyglądać po zmianie";
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

  return `You are an expert frontend developer. Edit the following HTML/CSS code according to the user's request.

CURRENT CODE:
\`\`\`html
${code}
\`\`\`

USER REQUEST: ${request}${imageContext}${dbContextStr}

RULES:
1. Return ONLY the complete, modified HTML code
2. Wrap the code in \`\`\`html code blocks
3. Preserve ALL existing functionality
4. Use Tailwind CSS for styling
5. Keep Alpine.js for interactivity
6. Make ALL changes the user requested
7. Ensure responsive design (mobile-first)
8. HOVER CONTRAST: When button hover changes background, MUST also change text color for readability!
   - Dark hover bg → light text (hover:text-white)
   - Light hover bg → dark text (hover:text-black)
   - FORBIDDEN: hover:bg-yellow-400 with text-white (invisible!)
   - CORRECT: bg-black text-white hover:bg-yellow-400 hover:text-black
9. NEVER use 0 (zero) for stats! If number unclear, use realistic fallback:
   - Years → "26", Counts → "104", Countries → "129", Users → "1.3M+"

MANDATORY COMPONENT PATTERNS:
- FAQ/Accordion dropdowns MUST have:
  1. Smooth open/close using x-transition:
     x-transition:enter="transition ease-out duration-200"
     x-transition:enter-start="opacity-0 -translate-y-2"
     x-transition:enter-end="opacity-100 translate-y-0"
     x-transition:leave="transition ease-in duration-150"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
  2. Rotating chevron icon: :class="open === N && 'rotate-180'" with transition-transform duration-300
  3. x-cloak on the content div to prevent flash
- Carousels/Sliders MUST loop infinitely: when reaching the end, wrap to the start
- Marquee scrolling text MUST use this pattern:
  1. OUTER div: overflow-hidden
  2. INNER div: flex + width:max-content + animate-marquee
  3. TWO identical groups inside, each with: flex shrink-0 items-center gap-16 pr-16
  4. Items inside: whitespace-nowrap
  5. CSS: @keyframes marquee { 0% { translateX(0); } 100% { translateX(-50%); } }
  6. DUPLICATE content for seamless loop!
- All images MUST use working URLs: https://picsum.photos/800/600?random=N (different N for each!)
- All interactive elements need hover/focus states
- Check mobile overflow - nothing should extend past viewport width

Return the FULL modified HTML code:`;
}

