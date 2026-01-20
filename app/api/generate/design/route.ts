import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

// Use Gemini 3 Pro for design (better visual understanding)
const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

interface DesignGenerationRequest {
  projectName: string;
  generatedCode: string;
  presetId?: string; // Optional preset to base on
  extractedColors?: Array<{ name: string; hex: string }>;
  industry?: string;
}

const DESIGN_PROMPT = `You are generating a modern, production-ready design system for an enterprise React application.

Create a complete design system that:
- Uses modern 2024-2026 design trends
- Is WCAG AA compliant (4.5:1 contrast minimum)
- Works with Tailwind CSS
- Includes shadcn/ui component configurations

Generate JSON:
{
  "name": "Design System Name",
  "description": "Brief description",
  "version": "1.0.0",
  
  "colors": {
    "brand": {
      "primary": { "hex": "#...", "name": "Primary Blue", "usage": "Primary buttons, links, active states" },
      "secondary": { "hex": "#...", "name": "Secondary", "usage": "Secondary buttons, borders" },
      "accent": { "hex": "#...", "name": "Accent", "usage": "Highlights, badges, CTAs" }
    },
    "semantic": {
      "success": { "hex": "#10B981", "name": "Success Green" },
      "error": { "hex": "#EF4444", "name": "Error Red" },
      "warning": { "hex": "#F59E0B", "name": "Warning Amber" },
      "info": { "hex": "#3B82F6", "name": "Info Blue" }
    },
    "neutral": {
      "white": "#FFFFFF",
      "background": "#F9FAFB",
      "surface": "#FFFFFF",
      "border": "#E5E7EB",
      "text": {
        "primary": "#111827",
        "secondary": "#6B7280",
        "disabled": "#9CA3AF",
        "inverse": "#FFFFFF"
      }
    },
    "dark": {
      "background": "#0A0A0A",
      "surface": "#141414",
      "border": "#27272A",
      "text": {
        "primary": "#FAFAFA",
        "secondary": "#A1A1AA",
        "disabled": "#52525B"
      }
    }
  },
  
  "typography": {
    "fontFamily": {
      "primary": "Inter",
      "secondary": "Inter",
      "monospace": "JetBrains Mono",
      "fallback": "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    "scale": {
      "display": { "size": "48px", "weight": "700", "lineHeight": "1.1", "letterSpacing": "-0.02em" },
      "h1": { "size": "36px", "weight": "700", "lineHeight": "1.2", "letterSpacing": "-0.02em" },
      "h2": { "size": "28px", "weight": "600", "lineHeight": "1.3" },
      "h3": { "size": "22px", "weight": "600", "lineHeight": "1.4" },
      "h4": { "size": "18px", "weight": "600", "lineHeight": "1.4" },
      "body": { "size": "15px", "weight": "400", "lineHeight": "1.6" },
      "bodySmall": { "size": "13px", "weight": "400", "lineHeight": "1.5" },
      "caption": { "size": "12px", "weight": "500", "lineHeight": "1.4" },
      "overline": { "size": "11px", "weight": "600", "lineHeight": "1.3", "letterSpacing": "0.05em", "textTransform": "uppercase" }
    }
  },
  
  "spacing": {
    "baseUnit": 4,
    "scale": {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "5": "20px",
      "6": "24px",
      "8": "32px",
      "10": "40px",
      "12": "48px",
      "16": "64px",
      "20": "80px"
    }
  },
  
  "borderRadius": {
    "none": "0px",
    "sm": "4px",
    "md": "6px",
    "lg": "8px",
    "xl": "12px",
    "2xl": "16px",
    "full": "9999px"
  },
  
  "shadows": {
    "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
  },
  
  "components": {
    "button": {
      "primary": {
        "bg": "brand.primary",
        "text": "white",
        "hoverBg": "darken(brand.primary, 10%)",
        "height": "40px",
        "padding": "8px 16px",
        "borderRadius": "md",
        "fontWeight": "500",
        "fontSize": "14px"
      },
      "secondary": {
        "bg": "transparent",
        "text": "brand.primary",
        "border": "1px solid currentColor",
        "hoverBg": "brand.primary/5%"
      },
      "ghost": {
        "bg": "transparent",
        "text": "neutral.text.secondary",
        "hoverBg": "neutral.background"
      }
    },
    "input": {
      "height": "44px",
      "padding": "10px 14px",
      "border": "1px solid neutral.border",
      "borderRadius": "md",
      "fontSize": "15px",
      "focusBorder": "brand.primary",
      "focusRing": "0 0 0 3px brand.primary/20%",
      "errorBorder": "semantic.error",
      "errorRing": "0 0 0 3px semantic.error/20%"
    },
    "card": {
      "bg": "neutral.surface",
      "border": "1px solid neutral.border",
      "borderRadius": "xl",
      "padding": "24px",
      "shadow": "sm"
    },
    "modal": {
      "bg": "neutral.surface",
      "borderRadius": "xl",
      "shadow": "xl",
      "overlayBg": "black/50%",
      "maxWidth": "500px"
    },
    "table": {
      "headerBg": "neutral.background",
      "rowHoverBg": "neutral.background/50%",
      "borderColor": "neutral.border",
      "cellPadding": "12px 16px"
    }
  },
  
  "tailwindConfig": {
    "extend": {
      "colors": { ... },
      "fontFamily": { ... },
      "borderRadius": { ... },
      "boxShadow": { ... }
    }
  },
  
  "cssVariables": ":root { --color-primary: #...; ... }"
}

IMPORTANT:
- Generate colors that work well together and meet accessibility standards
- Use modern, clean aesthetics suitable for enterprise SaaS
- If extracting from code, modernize the colors (don't copy legacy UI exactly)
- Include both light and dark mode tokens
- Generate valid Tailwind config that can be used directly`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const body: DesignGenerationRequest = await request.json();
    const { projectName, generatedCode, presetId, extractedColors, industry } = body;

    // Build context
    const context = `
PROJECT: ${projectName}
INDUSTRY: ${industry || "SaaS/Enterprise"}
PRESET BASE: ${presetId || "Modern SaaS"}

${extractedColors?.length ? `EXTRACTED COLORS (modernize these):\n${extractedColors.map(c => `${c.name}: ${c.hex}`).join("\n")}` : ""}

CODE PATTERNS (extract component styles):
${generatedCode?.slice(0, 10000) || "No code provided"}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 16384,
      },
    });

    const result = await model.generateContent([
      { text: DESIGN_PROMPT },
      { text: `\n\nCONTEXT:\n${context}\n\nGenerate the complete design system:` }
    ]);

    const responseText = result.response.text();
    
    // Extract JSON
    let jsonContent: any;
    try {
      jsonContent = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonContent = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: jsonContent,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Generate Design] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate design system" },
      { status: 500 }
    );
  }
}
