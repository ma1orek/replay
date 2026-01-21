import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPresetById, EnterprisePreset } from "@/lib/enterprise-presets";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

interface DesignGenerationRequest {
  projectName: string;
  generatedCode: string;
  presetId?: string;
  extractedColors?: Array<{ name: string; hex: string }>;
  industry?: string;
  detectedComponents?: string[];
  screenCount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT MAPPING & INVENTORY PROMPT ($100K Enterprise Value)
// ═══════════════════════════════════════════════════════════════════════════════

function buildDesignPrompt(preset: EnterprisePreset | null, request: DesignGenerationRequest): string {
  const presetInfo = preset ? `
BASE PRESET: ${preset.name}
INDUSTRY: ${preset.industry}
PRESET COLORS (as starting point):
- Primary: ${preset.colors.light.primary}
- Secondary: ${preset.colors.light.secondary}
- Accent: ${preset.colors.light.accent}
- Success: ${preset.colors.light.success}
- Error: ${preset.colors.light.error}
` : "BASE PRESET: None - generate modern SaaS design";

  return `You are a Senior Design Systems Architect conducting a COMPONENT AUDIT and MODERNIZATION MAPPING.

This is NOT a color palette generator. This is a $100,000 DESIGN SYSTEM AUDIT that shows:
- What legacy components were detected
- How they map to modern equivalents
- Technical debt reduction metrics
- Token standardization

${presetInfo}

PROJECT CONTEXT:
- Name: ${request.projectName}
- Industry: ${request.industry || "Enterprise SaaS"}
- Screens detected: ${request.screenCount || "Multiple"}
${request.extractedColors?.length ? `- Colors found in original UI: ${request.extractedColors.map(c => `${c.name}(${c.hex})`).join(", ")}` : ""}

OUTPUT FORMAT (JSON):
{
  "auditSummary": {
    "status": "Optimized & Consolidated",
    "sourceAnalysis": "Code analysis of reconstructed application",
    "debtReductionScore": "85%",
    "wcagCompliance": "AA"
  },

  "legacyToModernMapping": {
    "title": "Component Transformation Report",
    "description": "How legacy UI patterns were modernized",
    "mappings": [
      {
        "id": "MAP001",
        "category": "Buttons|Inputs|Tables|Charts|Navigation|Cards",
        "legacy": {
          "description": "Gray 3D beveled button with shadow",
          "issues": ["Inconsistent sizing", "No hover states", "Not accessible"]
        },
        "modern": {
          "component": "<Button variant='default' />",
          "library": "shadcn/ui",
          "improvements": ["WCAG AA contrast", "Keyboard accessible", "Consistent sizing"]
        },
        "status": "✅ Auto-Mapped"
      }
    ]
  },

  "debtReductionMetrics": {
    "title": "Technical Debt Reduction",
    "metrics": {
      "colorConsolidation": {
        "before": "42 inconsistent hex codes",
        "after": "9 semantic tokens",
        "reduction": "78%"
      },
      "typographyConsolidation": {
        "before": "5 different font families",
        "after": "1 standardized font (Inter)",
        "reduction": "80%"
      },
      "componentConsolidation": {
        "before": "14 button variations",
        "after": "3 semantic variants (Primary, Secondary, Ghost)",
        "reduction": "78%"
      },
      "spacingConsolidation": {
        "before": "Arbitrary pixel values",
        "after": "4px base unit system",
        "improvement": "Consistent 4/8/16/24/32px scale"
      }
    }
  },

  "componentInventory": {
    "title": "Component Atlas",
    "categories": [
      {
        "name": "Buttons & Actions",
        "legacyVariantsDetected": 6,
        "modernVariants": 3,
        "components": [
          {
            "name": "Primary Button",
            "usage": "Main CTAs, form submissions",
            "tokens": {
              "background": "var(--primary)",
              "text": "var(--primary-foreground)",
              "borderRadius": "var(--radius-md)",
              "padding": "12px 24px"
            }
          }
        ]
      },
      {
        "name": "Form Inputs",
        "legacyVariantsDetected": 4,
        "modernVariants": 1,
        "components": []
      },
      {
        "name": "Data Display",
        "legacyVariantsDetected": 3,
        "modernVariants": 2,
        "components": []
      }
    ]
  },

  "tokenSystem": {
    "colors": {
      "semantic": {
        "primary": { "value": "#...", "usage": "Primary actions", "wcagRatio": "7.2:1" },
        "secondary": { "value": "#...", "usage": "Secondary actions", "wcagRatio": "5.1:1" },
        "success": { "value": "#...", "usage": "Positive values, confirmations" },
        "error": { "value": "#...", "usage": "Errors, negative values" },
        "warning": { "value": "#...", "usage": "Warnings, pending states" }
      },
      "neutral": {
        "background": "#...",
        "surface": "#...",
        "border": "#...",
        "text": "#...",
        "textMuted": "#..."
      },
      "chart": ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]
    },
    "typography": {
      "fontFamily": "Inter, system-ui, sans-serif",
      "scale": {
        "h1": "30px/36px bold",
        "h2": "24px/32px semibold",
        "h3": "20px/28px semibold",
        "body": "14px/20px normal",
        "small": "12px/16px normal"
      }
    },
    "spacing": {
      "unit": "4px",
      "scale": ["0", "4px", "8px", "12px", "16px", "24px", "32px", "48px"]
    },
    "borderRadius": {
      "sm": "4px",
      "md": "6px",
      "lg": "8px",
      "full": "9999px"
    }
  },

  "iconMapping": {
    "title": "Icon Modernization",
    "description": "Bitmap icons replaced with scalable vectors",
    "mappings": [
      {
        "legacy": "Pixelated floppy disk (16x16 PNG)",
        "modern": "Lucide <Save /> SVG",
        "improvement": "Scalable, themeable, accessible"
      },
      {
        "legacy": "Low-res home icon",
        "modern": "Lucide <Home /> SVG",
        "improvement": "Crisp at any size"
      }
    ],
    "totalReplaced": 24,
    "library": "lucide-react"
  },

  "accessibilityUpgrades": {
    "title": "Accessibility Improvements",
    "improvements": [
      {
        "issue": "Insufficient color contrast",
        "legacy": "3.1:1 ratio (failed WCAG)",
        "modern": "7.2:1 ratio (WCAG AAA)",
        "status": "✅ Fixed"
      },
      {
        "issue": "Missing focus indicators",
        "legacy": "No visible focus states",
        "modern": "ring-2 ring-offset-2 on all interactive elements",
        "status": "✅ Fixed"
      }
    ]
  },

  "exportableAssets": {
    "tailwindConfig": "Complete tailwind.config.ts with custom tokens",
    "cssVariables": "Complete :root {} with all CSS custom properties",
    "componentsJson": "shadcn/ui components.json configuration"
  },

  "recommendations": [
    { "priority": "high", "item": "Implement dark mode toggle using CSS variables" },
    { "priority": "medium", "item": "Add motion tokens for micro-interactions" },
    { "priority": "low", "item": "Consider adding a compact density option" }
  ]
}

CRITICAL RULES:
1. Count ACTUAL variants detected in code (don't invent numbers)
2. Show REAL before/after comparisons
3. All colors MUST pass WCAG AA (4.5:1 minimum)
4. Map EVERY icon to a Lucide equivalent
5. This must look like a $50,000 design audit deliverable

ANALYZE THIS CODE:
`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body: DesignGenerationRequest = await request.json();
    const { projectName, generatedCode, presetId, extractedColors, industry, screenCount } = body;

    // Get preset if specified
    const preset = presetId ? getPresetById(presetId) || null : null;
    
    // Build customized prompt
    const prompt = buildDesignPrompt(preset, body);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.4, // Lower for more consistent output
        maxOutputTokens: 16384,
        // @ts-ignore - Gemini 3 Pro specific
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for fast JSON output
      },
    });

    const result = await model.generateContent([
      { text: prompt },
      { text: `\n\nCODE TO ANALYZE:\n${generatedCode?.slice(0, 15000) || "No code provided"}\n\nGenerate the customized design system JSON:` }
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

    // Add preset info to response
    if (preset) {
      jsonContent.basePreset = {
        id: preset.id,
        name: preset.name,
        industry: preset.industry
      };
    }

    return NextResponse.json({
      success: true,
      data: jsonContent,
      generatedAt: new Date().toISOString(),
      model: MODEL_NAME
    });

  } catch (error: any) {
    console.error("[Generate Design] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate design system" },
      { status: 500 }
    );
  }
}
