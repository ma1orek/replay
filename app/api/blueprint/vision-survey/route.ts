import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// For Next.js App Router - route segment config
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * SURVEYOR - Agentic Vision Pre-Generation Analysis
 * 
 * Analyzes a reference image and extracts "hard data" that the generator must follow.
 * This creates deterministic constraints from probabilistic visual analysis.
 * 
 * Output: Structured JSON with exact values (colors, dimensions, typography, layout)
 */

const SURVEYOR_PROMPT = `
**ROLE: AGENTIC VISION SURVEYOR**

You are an expert visual analyzer that extracts PRECISE, DETERMINISTIC data from UI screenshots.
Your job is to create a "hard data" specification that a code generator MUST follow exactly.

**YOUR OUTPUT MUST BE VALID JSON - NO MARKDOWN, NO EXPLANATIONS**

**ANALYSIS REQUIREMENTS:**

1. **COLORS** - Extract EXACT hex values for:
   - Primary background color
   - Secondary background color  
   - Primary text color
   - Secondary/muted text color
   - Accent/brand color
   - Border colors
   - Any gradient colors

2. **TYPOGRAPHY**:
   - Font family detection (Inter, SF Pro, Roboto, etc.)
   - Heading sizes (estimate in pixels/rem)
   - Body text size
   - Font weights used (400, 500, 600, 700)
   - Line heights

3. **SPACING & DIMENSIONS**:
   - Padding values (estimate in pixels)
   - Margin/gap values
   - Border radius values
   - Component width/height if fixed

4. **LAYOUT**:
   - Layout type: "flex-row", "flex-col", "grid", "stack"
   - Alignment: "start", "center", "end", "between", "around"
   - Number of columns (for grids)
   - Gap between items

5. **VISUAL EFFECTS**:
   - Shadow presence and intensity (none, sm, md, lg, xl)
   - Border style (none, subtle, prominent)
   - Opacity/transparency
   - Blur effects
   - Gradients (direction, colors)

6. **CONTENT STRUCTURE**:
   - Component type (card, button, form, section, etc.)
   - Number of elements/items
   - Icon presence and positions
   - Image presence and aspect ratio
   - Text content (headlines, labels, descriptions)

7. **THEME**:
   - "dark" or "light"
   - Style: "minimal", "glassmorphism", "neumorphism", "flat", "material"

**OUTPUT JSON SCHEMA:**
{
  "componentType": "card|button|form|hero|navbar|etc",
  "theme": "dark|light",
  "style": "minimal|glassmorphism|neumorphism|flat|material",
  "colors": {
    "background": "#hex",
    "backgroundSecondary": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "accent": "#hex",
    "border": "#hex",
    "gradient": { "from": "#hex", "to": "#hex", "direction": "to-r|to-b|etc" } | null
  },
  "typography": {
    "fontFamily": "Inter|SF Pro|Roboto|etc",
    "headingSize": "text-xl|text-2xl|etc",
    "headingWeight": "font-medium|font-semibold|font-bold",
    "bodySize": "text-sm|text-base|etc",
    "bodyWeight": "font-normal|font-medium",
    "textMutedSize": "text-xs|text-sm|etc"
  },
  "spacing": {
    "padding": "p-4|p-6|p-8|etc",
    "gap": "gap-2|gap-4|gap-6|etc",
    "margin": "m-0|m-4|etc"
  },
  "dimensions": {
    "width": "w-full|w-96|w-[400px]|etc",
    "height": "h-auto|h-64|h-[300px]|etc",
    "maxWidth": "max-w-sm|max-w-md|etc" | null
  },
  "borders": {
    "radius": "rounded-none|rounded-lg|rounded-xl|rounded-2xl|etc",
    "width": "border-0|border|border-2|etc",
    "color": "border-zinc-800|border-white/10|etc"
  },
  "effects": {
    "shadow": "shadow-none|shadow-sm|shadow-md|shadow-lg|shadow-xl",
    "blur": "backdrop-blur-none|backdrop-blur-sm|backdrop-blur-md|etc" | null,
    "opacity": "opacity-100|bg-white/10|etc" | null
  },
  "layout": {
    "type": "flex|grid|block",
    "direction": "flex-row|flex-col|grid-cols-2|etc",
    "align": "items-start|items-center|items-end",
    "justify": "justify-start|justify-center|justify-between|etc"
  },
  "content": {
    "headline": "exact text from image",
    "subheadline": "exact text" | null,
    "description": "exact text" | null,
    "buttonText": "exact text" | null,
    "labels": ["label1", "label2"],
    "listItems": ["item1", "item2"] | null,
    "hasIcon": true|false,
    "iconPosition": "left|right|top" | null,
    "hasImage": true|false,
    "imageAspect": "square|video|portrait" | null
  },
  "tailwindClasses": {
    "container": "full class string for main container",
    "heading": "full class string for headings",
    "body": "full class string for body text",
    "button": "full class string for buttons" | null
  }
}

**CRITICAL RULES:**
1. Output ONLY valid JSON - no markdown, no code blocks, no explanations
2. Use EXACT Tailwind class names
3. Colors must be precise hex values
4. All text content must be copied VERBATIM from the image
5. If you can't determine a value, use sensible defaults but note it

**NOW ANALYZE THE PROVIDED IMAGE AND OUTPUT JSON:**
`;

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, imageUrl } = await request.json();
    
    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Use Gemini 3 Flash for fast vision analysis
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for precise, deterministic output
        maxOutputTokens: 4096,
      }
    });

    // Prepare image part
    let imagePart: any = null;
    
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
      
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    } else if (imageUrl) {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      
      imagePart = {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      };
    }

    const result = await model.generateContent([
      { text: SURVEYOR_PROMPT },
      imagePart
    ]);

    const responseText = result.response.text();
    
    // Parse JSON from response
    let hardData;
    try {
      // Clean potential markdown wrapping
      let jsonStr = responseText
        .replace(/^```(?:json)?\s*\n?/gim, '')
        .replace(/```\s*$/gim, '')
        .trim();
      
      hardData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse surveyor JSON:", responseText);
      return NextResponse.json({ 
        error: "Failed to parse vision analysis",
        rawResponse: responseText 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hardData: hardData,
      message: "Visual analysis complete - hard data extracted"
    });

  } catch (error: any) {
    console.error("Vision surveyor error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to analyze image" 
    }, { status: 500 });
  }
}
