import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANIMATION_ENHANCER_PROMPT } from "@/lib/prompts/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

function extractCodeFromResponse(response: string): string | null {
  let cleaned = response.trim();
  
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) {
    return htmlMatch[1].trim();
  }
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 100) {
    return codeMatch[1].trim();
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
  
  return null;
}

export async function POST(request: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { code } = await request.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "No code provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[enhance-animations] Starting animation enhancement...");
    const startTime = Date.now();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 60000,
      },
    });

    const prompt = `${ANIMATION_ENHANCER_PROMPT}

Here is the HTML code to enhance:

\`\`\`html
${code}
\`\`\`

Add MORE animations to this code. Make it feel ALIVE and PREMIUM.
Return the complete enhanced HTML wrapped in \`\`\`html code blocks.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const enhancedCode = extractCodeFromResponse(text);
    
    if (!enhancedCode) {
      console.log("[enhance-animations] Failed to extract code, returning original");
      return new Response(
        JSON.stringify({ code: code, enhanced: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[enhance-animations] Completed in ${duration}s`);

    return new Response(
      JSON.stringify({ 
        code: enhancedCode, 
        enhanced: true,
        duration: parseFloat(duration)
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[enhance-animations] Error:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || "Enhancement failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
