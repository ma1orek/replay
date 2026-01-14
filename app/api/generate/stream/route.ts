import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VIDEO_TO_CODE_SYSTEM_PROMPT, buildStylePrompt } from "@/lib/prompts/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 300;

// Get API key
function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
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
    const { videoBase64, mimeType, styleDirective, databaseContext, styleReferenceImage } = body;

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
        temperature: 0.7,
        maxOutputTokens: 100000,
      },
    });

    // Build full prompt
    let fullPrompt = VIDEO_TO_CODE_SYSTEM_PROMPT;
    fullPrompt += buildStylePrompt(styleDirective);
    
    if (databaseContext) {
      fullPrompt += `

DATABASE CONTEXT (use this data in appropriate places):
${databaseContext}
`;
    }
    
    fullPrompt += `

Now analyze the video and generate the complete HTML code.
Return ONLY the HTML code wrapped in \`\`\`html code blocks.
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
      parts.push({ text: "Use this image as a style reference for colors, typography, and visual mood." });
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
          const cleanCode = extractCodeFromResponse(fullText);
          
          if (!cleanCode) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: "error", 
              error: "Failed to extract valid HTML code from AI response" 
            })}\n\n`));
            controller.close();
            return;
          }
          
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
