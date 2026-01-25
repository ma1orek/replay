import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-flash-preview"; // Flash to save API quota

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEBT AUDIT GENERATOR
// Purpose: Generate Technical Debt Reduction Report with component inventory
// Value: CTO sees proof that Replay.build cleans up their mess, not just paints over it
// ═══════════════════════════════════════════════════════════════════════════════

const DEBT_AUDIT_PROMPT = `You are a Technical Debt Analyst auditing a legacy UI reconstruction.

**YOUR MISSION:** Generate a comprehensive TECHNICAL DEBT REDUCTION REPORT that proves the modernization value.

This is NOT a simple design system. This is an AUDIT showing:
- What was wrong with the legacy UI
- How it was fixed in the new system
- Quantified improvement metrics

**OUTPUT JSON:**
{
  "meta": {
    "auditDate": "ISO date",
    "legacySystemName": "from scan data",
    "modernizationScore": 85,
    "debtReductionPercentage": "78%"
  },
  
  "componentUnification": {
    "summary": "14 inconsistent button variants → 4 standardized variants",
    "before": {
      "totalVariants": 14,
      "inconsistencies": [
        {
          "component": "Button",
          "variants": 6,
          "issues": ["Different padding (8px, 12px, 16px)", "3 shades of blue (#3b82f6, #2563eb, #1d4ed8)", "Inconsistent border-radius"]
        },
        {
          "component": "Card",
          "variants": 4,
          "issues": ["Mixed shadow styles", "Inconsistent padding"]
        },
        {
          "component": "Input",
          "variants": 3,
          "issues": ["Different border colors", "Varying focus states"]
        }
      ]
    },
    "after": {
      "totalVariants": 4,
      "standardized": [
        {
          "component": "Button",
          "variants": ["primary", "secondary", "ghost", "destructive"],
          "implementation": "<Button variant='primary'>Click</Button>"
        },
        {
          "component": "Card",
          "variants": ["default", "bordered", "elevated"],
          "implementation": "<Card variant='default'>Content</Card>"
        }
      ]
    },
    "debtReduction": "78%"
  },
  
  "tokenMapping": {
    "summary": "32 hardcoded colors → 12 semantic tokens",
    "colorMigration": [
      {
        "legacy": "#3a4b5c",
        "legacyUsage": "Used 23 times for text",
        "modern": "colors.text.muted",
        "tailwind": "text-zinc-500",
        "improvement": "Semantic naming, dark mode ready"
      },
      {
        "legacy": "#1a73e8",
        "legacyUsage": "Used 15 times for buttons",
        "modern": "colors.primary.600",
        "tailwind": "bg-primary",
        "improvement": "Theme-able, consistent hover states"
      }
    ],
    "spacingMigration": [
      {
        "legacy": "12px, 16px, 18px, 24px, 32px (mixed)",
        "modern": "4px scale (4, 8, 12, 16, 24, 32)",
        "tailwind": "p-1, p-2, p-3, p-4, p-6, p-8",
        "improvement": "Consistent spacing system"
      }
    ],
    "typographyMigration": [
      {
        "legacy": "Arial, Helvetica, system-ui (mixed)",
        "modern": "Inter (single font family)",
        "tailwind": "font-sans",
        "improvement": "Professional, consistent typography"
      }
    ]
  },
  
  "accessibilityUpgrade": {
    "summary": "0% WCAG compliance → 92% WCAG 2.1 AA",
    "improvements": [
      {
        "element": "Primary Button",
        "issue": "Low contrast ratio",
        "legacyContrast": 2.8,
        "modernContrast": 4.5,
        "wcagLevel": "AA ✅",
        "fix": "Darkened button text, adjusted background"
      },
      {
        "element": "Form Labels",
        "issue": "Labels not associated with inputs",
        "legacyStatus": "❌ Missing",
        "modernStatus": "✅ Added htmlFor",
        "wcagCriteria": "1.3.1"
      },
      {
        "element": "Interactive Elements",
        "issue": "No focus indicators",
        "legacyStatus": "❌ outline: none",
        "modernStatus": "✅ focus-visible:ring-2",
        "wcagCriteria": "2.4.7"
      },
      {
        "element": "Images",
        "issue": "Missing alt text",
        "legacyStatus": "❌ 12 images without alt",
        "modernStatus": "✅ All images have alt",
        "wcagCriteria": "1.1.1"
      }
    ],
    "complianceScore": {
      "before": "0%",
      "after": "92%",
      "level": "WCAG 2.1 AA"
    }
  },
  
  "atomicInventory": {
    "summary": "Component hierarchy following Atomic Design",
    "atoms": [
      {
        "name": "Button",
        "variants": 4,
        "props": ["variant", "size", "disabled", "loading"],
        "usage": "Primary interactive element"
      },
      {
        "name": "Input",
        "variants": 2,
        "props": ["type", "placeholder", "error", "disabled"],
        "usage": "Form text input"
      },
      {
        "name": "Badge",
        "variants": 5,
        "props": ["variant", "size"],
        "usage": "Status indicators"
      },
      {
        "name": "Avatar",
        "variants": 3,
        "props": ["src", "fallback", "size"],
        "usage": "User identification"
      }
    ],
    "molecules": [
      {
        "name": "SearchInput",
        "composition": ["Input", "Icon"],
        "usage": "Search functionality"
      },
      {
        "name": "MetricCard",
        "composition": ["Card", "Icon", "Badge"],
        "usage": "KPI display"
      },
      {
        "name": "NavItem",
        "composition": ["Icon", "Text", "Badge"],
        "usage": "Navigation links"
      }
    ],
    "organisms": [
      {
        "name": "Sidebar",
        "composition": ["Logo", "NavItem[]", "UserMenu"],
        "usage": "Main navigation"
      },
      {
        "name": "DataTable",
        "composition": ["Table", "Pagination", "Filters", "Search"],
        "usage": "Data display"
      },
      {
        "name": "ChartCard",
        "composition": ["Card", "Recharts", "Legend"],
        "usage": "Data visualization"
      }
    ],
    "templates": [
      {
        "name": "DashboardLayout",
        "composition": ["Sidebar", "Header", "MainContent"],
        "usage": "Main app layout"
      }
    ]
  },
  
  "designTokens": {
    "colors": {
      "primary": { "50": "#f0f9ff", "500": "#6366f1", "600": "#4f46e5", "900": "#1e1b4b" },
      "neutral": { "50": "#fafafa", "500": "#71717a", "900": "#18181b" },
      "success": "#22c55e",
      "error": "#ef4444",
      "warning": "#f59e0b"
    },
    "spacing": {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "6": "24px",
      "8": "32px"
    },
    "borderRadius": {
      "none": "0px",
      "sm": "4px",
      "md": "8px",
      "lg": "12px",
      "full": "9999px"
    },
    "shadows": {
      "sm": "0 1px 2px rgba(0,0,0,0.05)",
      "md": "0 4px 6px rgba(0,0,0,0.1)",
      "lg": "0 10px 15px rgba(0,0,0,0.1)"
    },
    "typography": {
      "fontFamily": "Inter, system-ui, sans-serif",
      "sizes": {
        "xs": "12px",
        "sm": "14px",
        "base": "16px",
        "lg": "18px",
        "xl": "20px",
        "2xl": "24px"
      },
      "weights": {
        "normal": 400,
        "medium": 500,
        "semibold": 600,
        "bold": 700
      }
    }
  },
  
  "migrationRisks": [
    {
      "risk": "Custom chart implementations",
      "severity": "medium",
      "mitigation": "Replaced with Recharts components",
      "status": "resolved"
    },
    {
      "risk": "Inline styles",
      "severity": "high",
      "mitigation": "Migrated to Tailwind utility classes",
      "status": "resolved"
    }
  ],
  
  "recommendations": [
    {
      "priority": "high",
      "category": "Performance",
      "recommendation": "Implement code splitting for chart components",
      "effort": "2-3 hours"
    },
    {
      "priority": "medium",
      "category": "Maintainability",
      "recommendation": "Extract repeated patterns into shared hooks",
      "effort": "4-6 hours"
    }
  ]
}

Generate a REAL debt audit based on the actual scan data and generated code:`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { scanData, projectName, generatedCode } = body;

    if (!scanData && !generatedCode) {
      return NextResponse.json({ error: "Scan data or generated code required" }, { status: 400 });
    }

    console.log("[Debt-Audit] Generating technical debt report...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 16384,
      },
    });

    const context = `
PROJECT: ${projectName || "Legacy Application Modernization"}

**SCAN DATA (What was detected in legacy UI):**
${scanData ? JSON.stringify(scanData, null, 2) : "Not provided"}

**GENERATED CODE (Modernized implementation):**
${generatedCode ? generatedCode.substring(0, 12000) : "Not provided"}

Analyze the legacy UI patterns and the modernized code to generate a comprehensive debt audit:`;

    const result = await model.generateContent([
      { text: DEBT_AUDIT_PROMPT },
      { text: context }
    ]);

    const responseText = result.response.text();
    
    // Extract JSON
    let audit: any;
    try {
      audit = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        audit = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          audit = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Debt-Audit] Generated in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: audit,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[Debt-Audit] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate debt audit" },
      { status: 500 }
    );
  }
}
