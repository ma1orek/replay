import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 300;

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || "";
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
        
        // PLAN MODE - Quick conversational response
        if (isPlanMode) {
          send("status", { message: "Thinking...", phase: "plan" });
          
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

          const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: planPrompt }],
            max_tokens: 500,
            temperature: 0.7,
            stream: true,
          });
          
          let fullText = "";
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            fullText += text;
            if (text) {
              send("chunk", { text, fullText });
            }
          }

          send("complete", { code: fullText, isChat: true });
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

        send("status", { message: "Generating code with GPT-5.2...", phase: "ai" });

        // Build prompt
        const prompt = buildEditPrompt(currentCode, editRequest, databaseContext, validImages.length > 0);

        // Build messages
        const messages: any[] = [
          { role: "system", content: "You are Replay, an elite UI Engineering AI. You edit production-ready HTML/CSS/Alpine.js code. Always return COMPLETE HTML documents wrapped in ```html code blocks." },
          { 
            role: "user", 
            content: imageContents.length > 0 
              ? [{ type: "text", text: prompt }, ...imageContents]
              : prompt
          }
        ];

        send("status", { message: "Writing code...", phase: "writing" });

        // Stream the response with GPT-5.2
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages,
            max_tokens: 16000,
            temperature: 0.7,
            stream: true,
          });
          
          let fullCode = "";
          let chunkCount = 0;
          
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            fullCode += text;
            chunkCount++;
            
            // Send actual code chunks for real-time display
            if (text.length > 0) {
              send("chunk", { text, fullText: fullCode });
            }
            
            // Send progress updates every few chunks
            if (chunkCount % 5 === 0) {
              const lines = fullCode.split('\n').length;
              send("progress", { 
                lines,
                chars: fullCode.length,
                preview: fullCode.slice(-300)
              });
            }
          }

          send("status", { message: "Finalizing...", phase: "finalize" });
          await delay(50);

          // Extract code from response
          const extractedCode = extractCode(fullCode);
          
          if (extractedCode) {
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
            // Fallback extraction
            const fallbackCode = tryFallbackExtraction(fullCode);
            if (fallbackCode) {
              const summary = generateChangeSummary(currentCode, fallbackCode, editRequest);
              send("complete", { code: fallbackCode, summary });
            } else {
              // Check if AI gave explanation instead
              const looksLikeExplanation = fullCode.length < 2000 && 
                !fullCode.includes('<!DOCTYPE') && 
                !fullCode.includes('<html');
              
              if (looksLikeExplanation) {
                send("complete", { 
                  code: fullCode.trim(), 
                  isChat: true,
                  needsClarification: false
                });
              } else {
                const clarifyResponse = generateClarifyingQuestion(editRequest, currentCode);
                send("complete", { 
                  code: clarifyResponse, 
                  isChat: true,
                  needsClarification: true
                });
              }
            }
          }
        } catch (streamError: any) {
          console.error("[Stream Edit] OpenAI error:", streamError);
          send("error", { error: streamError?.message || "AI generation failed. Please try again." });
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
  
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 50) return htmlMatch[1].trim();
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 50) return codeMatch[1].trim();
  
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  const htmlTagMatch = cleaned.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) return htmlTagMatch[1].trim();
  
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.startsWith('<html') || cleaned.startsWith('<HTML')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
    return cleaned;
  }
  
  const htmlStartIndex = cleaned.search(/<(!DOCTYPE|html)/i);
  if (htmlStartIndex >= 0) {
    const htmlContent = cleaned.substring(htmlStartIndex);
    const endIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return htmlContent.substring(0, endIndex + 7);
  }
  
  return null;
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

function buildEditPrompt(code: string, request: string, dbContext?: string, hasImages?: boolean): string {
  const imageContext = hasImages 
    ? `\n\nThe user has attached image(s). Use them as visual reference for the changes.`
    : '';
    
  const dbContextStr = dbContext 
    ? `\n\nDATABASE CONTEXT:\n${dbContext}`
    : '';

  // Detect if this is a "Create new page" request (starts with @PageName)
  const isCreatePageRequest = /^@[a-zA-Z0-9-_]+\s+(create|add|make|build)/i.test(request.trim());
  const pageNameMatch = request.match(/^@([a-zA-Z0-9-_]+)/);
  const pageName = pageNameMatch ? pageNameMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;

  // Special instructions for adding new pages
  const pageCreationInstructions = isCreatePageRequest && pageName ? `
═══════════════════════════════════════════════════════════════════════════════
🆕 ADDING NEW PAGE: "${pageName}"
═══════════════════════════════════════════════════════════════════════════════
This is a NEW PAGE request. You must:
1. ADD "${pageName}" to the Alpine.js x-data currentPage options (in the navigation if it exists)
2. ADD a NEW x-show section: x-show="currentPage === '${pageName}'"
3. CREATE full content for the "${pageName}" page matching the existing design
4. ADD a navigation link to access this page (in sidebar/nav)
5. KEEP ALL EXISTING PAGES INTACT - do NOT regenerate or modify them!

⚠️ CRITICAL: The existing pages (home, dashboard, etc.) must remain EXACTLY as they are!
Only ADD the new page section and navigation link.

Example structure to ADD (insert before </body>):
<!-- ═══════ ${pageName.toUpperCase()} PAGE ═══════ -->
<main x-show="currentPage === '${pageName}'" x-transition ... >
  ... NEW page content here ...
</main>
` : '';

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
${pageCreationInstructions}
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
8. ❌ NEVER regenerate existing pages when adding new ones

═══════════════════════════════════════════════════════════════════════════════
🛠️ TECHNICAL STANDARDS:
═══════════════════════════════════════════════════════════════════════════════
- Use Tailwind CSS for all styling
- Use Alpine.js for interactivity (x-data, x-show, x-on, x-transition)
- Mobile-first responsive design (sm:, md:, lg:, xl: breakpoints)
- HOVER CONTRAST: Dark bg hover → hover:text-white, Light bg hover → hover:text-black
- NEVER use "0" for stats - use realistic numbers: "26 Years", "1.3M+ Users"
- IMAGES: ONLY use https://picsum.photos/WxH?random=N
- AVATARS: ONLY use https://i.pravatar.cc/150?img=N

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
