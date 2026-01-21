"use server";

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { VIDEO_TO_CODE_SYSTEM_PROMPT, buildStylePrompt } from "@/lib/prompts/system-prompt";

// ============================================================================
// SYSTEM PROMPT v14.0 - FORENSIC ASSEMBLER (Imported from centralized location)
// ============================================================================

const SYSTEM_PROMPT = VIDEO_TO_CODE_SYSTEM_PROMPT + `

================================================================================
🚨 CRITICAL IMAGE RULE (LEGACY COMPATIBILITY)
================================================================================
**ABSOLUTE BAN ON UNSPLASH/PEXELS URLs!** They break and show alt text.

✅ ONLY USE:
- https://picsum.photos/800/600?random=1 (increment random=N for each image)
- https://i.pravatar.cc/150?img=1 (for avatars, increment img=N)

❌ NEVER USE:
- images.unsplash.com (BANNED!)
- unsplash.com (BANNED!)
- pexels.com (BANNED!)
================================================================================
`;

// ============================================================================
// INTERFACES
// ============================================================================

interface TransmuteOptions {
  videoUrl: string;
  styleDirective?: string;
  databaseContext?: string;
  styleReferenceImage?: { url: string; base64?: string };
}

interface TransmuteResult {
  success: boolean;
  code?: string;
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

interface EditResult {
  success: boolean;
  code?: string;
  error?: string;
  isChat?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || "";
}

async function fetchVideoAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    console.log("[transmute] Fetching video from URL:", url.substring(0, 100));
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'video/*,*/*',
      },
    });
    
    if (!response.ok) {
      console.error("[transmute] Video fetch failed:", response.status, response.statusText);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log("[transmute] Video fetched successfully. Size:", arrayBuffer.byteLength, "Type:", contentType);
    
    // Determine correct mime type
    let mimeType = 'video/mp4';
    if (contentType.includes('webm')) mimeType = 'video/webm';
    else if (contentType.includes('quicktime') || contentType.includes('mov')) mimeType = 'video/quicktime';
    else if (contentType.includes('mp4')) mimeType = 'video/mp4';
    
    return { base64, mimeType };
  } catch (error) {
    console.error("[transmute] Error fetching video:", error);
    return null;
  }
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    let mimeType = 'image/png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) mimeType = 'image/jpeg';
    else if (contentType.includes('webp')) mimeType = 'image/webp';
    else if (contentType.includes('gif')) mimeType = 'image/gif';
    
    return { base64, mimeType };
  } catch (error) {
    console.error("[transmute] Error fetching image:", error);
    return null;
  }
}

// Extract code from Gemini response
function extractCodeFromResponse(response: string): string | null {
  let cleaned = response.trim();
  
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.trim();
  
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

// Fix broken image URLs - replace ALL external images with picsum
function fixBrokenImageUrls(code: string): string {
  if (!code) return code;
  
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];
  let imageCounter = 0;
  
  const getNextPicsumUrl = (width = 800, height = 600) => {
    const id = validPicsumIds[imageCounter % validPicsumIds.length];
    imageCounter++;
    return `https://picsum.photos/id/${id}/${width}/${height}`;
  };
  
  // Replace unsplash/pexels/placeholder images
  code = code.replace(/https?:\/\/[^"'\s)]*unsplash[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/[^"'\s)]*pexels[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/via\.placeholder\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/placehold\.co[^"'\s)]*/gi, () => getNextPicsumUrl());
  
  return code;
}

// ============================================================================
// MAIN TRANSMUTE FUNCTION - VIDEO TO CODE
// ============================================================================

export async function transmuteVideoToCode(options: TransmuteOptions): Promise<TransmuteResult> {
  const { videoUrl, styleDirective, databaseContext, styleReferenceImage } = options;
  
  console.log("[transmute] Starting video-to-code generation");
  console.log("[transmute] Video URL:", videoUrl?.substring(0, 100));
  console.log("[transmute] Style:", styleDirective?.substring(0, 50));
  
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }
  
  try {
    // Fetch video from URL (server-side)
    console.log("[transmute] Fetching video server-side from:", videoUrl?.substring(0, 80));
    const videoData = await fetchVideoAsBase64(videoUrl);
    if (!videoData) {
      console.error("[transmute] Failed to fetch video from Supabase URL");
      return { success: false, error: "Failed to fetch video from storage. Please try again." };
    }
    console.log("[transmute] Video fetched, base64 size:", videoData.base64.length, "bytes");
    
    // Build parts array
    const parts: Part[] = [];
    
    // Add system prompt + style + context
    let fullPrompt = SYSTEM_PROMPT;
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
    
    parts.push({ text: fullPrompt });
    
    // Add video
    parts.push({
      inlineData: {
        mimeType: videoData.mimeType,
        data: videoData.base64,
      },
    });
    
    // Add style reference image if provided
    if (styleReferenceImage?.url) {
      const imageData = await fetchImageAsBase64(styleReferenceImage.url);
      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.base64,
          },
        });
        parts.push({ text: "Use this image as a style reference for colors, typography, and visual mood." });
      }
    }
    
    // Initialize Gemini 3 Pro
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 100000,
        // @ts-ignore - Gemini 3 Pro specific
        thinkingConfig: { thinkingBudget: 12288 }, // Reduced to prevent hangs
      },
    });
    
    console.log("[transmute] Calling Gemini API...");
    const startTime = Date.now();
    
    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[transmute] Response received in ${duration}s. Length: ${text.length}`);
    
    // Extract code
    let code = extractCodeFromResponse(text);
    
    if (!code) {
      console.error("[transmute] Failed to extract code from response");
      console.error("[transmute] First 500 chars:", text.substring(0, 500));
      return { success: false, error: "Failed to extract valid HTML code from AI response" };
    }
    
    // Fix broken image URLs
    code = fixBrokenImageUrls(code);
    
    console.log("[transmute] Code extracted successfully. Length:", code.length);
    
    // Get token usage
    const usageMetadata = response.usageMetadata;
    const tokenUsage = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount || 0,
      candidatesTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : undefined;
    
    return {
      success: true,
      code,
      tokenUsage,
    };
    
  } catch (error: any) {
    console.error(`[transmute] Error:`, error?.message || error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============================================================================
// EDIT CODE WITH AI FUNCTION
// ============================================================================

export async function editCodeWithAI(
  currentCode: string,
  editRequest: string,
  images?: any[],
  databaseContext?: string,
  isPlanMode?: boolean,
  chatHistory?: any[]
): Promise<EditResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Plan mode - quick conversational response
    if (isPlanMode) {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      });
      
      const prompt = `You are Replay. Keep responses SHORT (1-2 sentences).
PROJECT: ~${Math.round(currentCode.length / 1000)}KB code
USER: ${editRequest}
Reply briefly and helpfully.`;
      
      const result = await model.generateContent([{ text: prompt }]);
      const response = result.response.text();
      
      return { success: true, code: response, isChat: true };
    }
    
    // Edit mode - full code generation
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: { 
        temperature: 0.4,
        maxOutputTokens: 100000,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 8192 },
      },
    });
    
    // Build parts
    const parts: Part[] = [];
    
    // Add system prompt for edits
    const editPrompt = `You are Replay, an AI that edits HTML/React code.

CURRENT CODE:
\`\`\`html
${currentCode}
\`\`\`

USER REQUEST: ${editRequest}

${databaseContext ? `DATABASE CONTEXT:\n${databaseContext}\n` : ''}

RULES:
1. Return the COMPLETE modified code (not just the changes)
2. Wrap your response in \`\`\`html code blocks
3. Preserve all existing functionality unless asked to remove it
4. Keep the same overall structure and styling
5. Use Recharts for charts, Lucide for icons
`;
    
    parts.push({ text: editPrompt });
    
    // Add images if provided
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.base64) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/png',
              data: img.base64,
            },
          });
        }
      }
      parts.push({ text: "Reference these images for the requested changes." });
    }
    
    const result = await model.generateContent(parts);
    const text = result.response.text();
    
    const code = extractCodeFromResponse(text);
    
    if (!code) {
      return { success: false, error: "Failed to extract code from response" };
    }
    
    return { success: true, code: fixBrokenImageUrls(code) };
    
  } catch (error: any) {
    console.error("[editCodeWithAI] Error:", error?.message || error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
