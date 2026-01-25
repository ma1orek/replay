import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const BLUEPRINTS_ANALYSIS_PROMPT = `
You are a DESIGN SYSTEM ARCHITECT analyzing generated UI code to create a "Component Blueprint Library".

Your task is to:
1. DETECT all distinct UI components in the code
2. IDENTIFY components that appear multiple times (variations of the same concept)
3. EXTRACT props/attributes that should be configurable
4. DEFINE variants for each component
5. CREATE a normalized "Single Source of Truth" version

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this structure:

{
  "blueprints": [
    {
      "id": "btn-primary",
      "name": "PrimaryButton",
      "category": "atoms",
      "description": "Main call-to-action button with gradient background",
      "status": "approved",
      "usageCount": 5,
      "usageLocations": ["Header", "HeroSection", "CTASection"],
      "props": [
        {
          "name": "label",
          "type": "string",
          "required": true,
          "defaultValue": "Click me",
          "description": "Button text content"
        },
        {
          "name": "variant",
          "type": "select",
          "options": ["primary", "secondary", "danger", "ghost"],
          "defaultValue": "primary",
          "description": "Visual style variant"
        },
        {
          "name": "size",
          "type": "select",
          "options": ["sm", "md", "lg"],
          "defaultValue": "md"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "defaultValue": false
        },
        {
          "name": "loading",
          "type": "boolean",
          "defaultValue": false
        }
      ],
      "variants": [
        {
          "name": "Primary",
          "propsOverride": { "variant": "primary" },
          "description": "Main CTA style"
        },
        {
          "name": "Secondary",
          "propsOverride": { "variant": "secondary" },
          "description": "Secondary action"
        },
        {
          "name": "Danger",
          "propsOverride": { "variant": "danger" },
          "description": "Destructive action"
        }
      ],
      "code": "<button class='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>{{label}}</button>",
      "reactCode": "export const PrimaryButton = ({ label, variant, onClick }) => <button onClick={onClick}>{label}</button>;",
      "previewImage": "For cards/heroes with images, KEEP existing images from the original code - do NOT generate new ones"
    }
  ],
  "duplicates": [
    {
      "originalId": "btn-primary",
      "duplicateLocations": ["Line 45", "Line 120", "Line 305"],
      "suggestion": "Consolidate into single PrimaryButton component with variants"
    }
  ],
  "designTokens": {
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#6B7280",
      "background": "#0A0A0B",
      "surface": "#141414",
      "text": "#FFFFFF",
      "textMuted": "#71717A"
    },
    "spacing": {
      "xs": "4px",
      "sm": "8px",
      "md": "16px",
      "lg": "24px",
      "xl": "32px"
    },
    "borderRadius": {
      "sm": "4px",
      "md": "8px",
      "lg": "12px",
      "xl": "16px",
      "full": "9999px"
    }
  },
  "architecture": {
    "atoms": ["PrimaryButton", "Badge", "Avatar", "Input", "Icon"],
    "molecules": ["SearchBar", "MetricCard", "NavItem", "FormGroup"],
    "organisms": ["Header", "Sidebar", "DataTable", "Modal"],
    "templates": ["DashboardPage", "LoginPage", "SettingsPage"]
  },
  "apiContracts": [
    {
      "endpoint": "POST /api/auth/login",
      "trigger": "LoginForm submit",
      "request": { "email": "string", "password": "string" },
      "response": { "token": "string", "user": "object" },
      "usedIn": ["LoginPage"]
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
ANALYSIS RULES
═══════════════════════════════════════════════════════════════════════════════

1. **DETECT DUPLICATES**: If you see similar buttons in multiple places, mark them as ONE Blueprint with variants
2. **EXTRACT PROPS**: Any value that changes between instances should be a prop
3. **CATEGORIZE**: atoms (smallest), molecules (combined atoms), organisms (sections), templates (pages)
4. **NORMALIZE**: Create the "ideal" version, not the messy original
5. **REACT CODE**: Generate proper React component code for each Blueprint

🖼️ IMAGES - CRITICAL:
- PRESERVE existing images from the original code - do NOT create new image URLs!
- If component already has an <img> tag, keep the same src URL
- FOR NEW AVATARS ONLY: src="https://i.pravatar.cc/150?u=name"
- NEVER use picsum.photos, placehold.co, or placeholder URLs
- If you must add image, use: src="https://image.pollinations.ai/prompt/DESCRIPTION?width=400&height=300&nologo=true&model=flux&seed=123"

Analyze this code and return the Blueprint Library JSON:
`;

export async function POST(req: NextRequest) {
  try {
    const { code, styleInfo } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // Gemini 3 Flash for fast analysis

    const result = await model.generateContent([
      { text: BLUEPRINTS_ANALYSIS_PROMPT },
      { text: `\n\nCODE TO ANALYZE:\n\`\`\`html\n${code}\n\`\`\`\n\nSTYLE INFO: ${styleInfo || 'Auto-detect'}\n\nReturn ONLY the JSON, no markdown.` }
    ]);

    const responseText = result.response.text();
    
    // Parse JSON from response
    let blueprintsData;
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        blueprintsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Blueprints] JSON parse error:", parseError);
      return NextResponse.json({ 
        error: "Failed to parse blueprints data",
        raw: responseText.substring(0, 500)
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: blueprintsData 
    });

  } catch (error: any) {
    console.error("[Blueprints API] Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to analyze blueprints" 
    }, { status: 500 });
  }
}
