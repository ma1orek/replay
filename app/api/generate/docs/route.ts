import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

// Use Gemini 3 Flash for docs (fast & cheap)
const MODEL_NAME = "gemini-1.5-flash";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// Types for structured output
interface DocsGenerationRequest {
  type: "overview" | "api" | "qa" | "deploy";
  projectName: string;
  generatedCode: string;
  flowNodes: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
  }>;
  styleInfo?: {
    colors?: Array<{ name: string; hex: string }>;
    fonts?: string[];
    spacing?: string;
  };
  screenCount: number;
  componentCount: number;
}

// System prompts for each doc type
const PROMPTS = {
  overview: `You are generating enterprise documentation for a React application reconstructed from video analysis.

Generate a comprehensive project overview in JSON format with these fields:
{
  "title": "Project title",
  "description": "2-3 sentence description of what this app does based on the code",
  "industry": "Detected industry (Financial/Healthcare/SaaS/Government/Other)",
  "complexity": "Simple/Medium/Complex based on component count",
  "stats": {
    "screens": number,
    "components": number,
    "apiEndpoints": number,
    "designTokens": number
  },
  "features": ["Feature 1", "Feature 2", ...], // 4-6 main features identified from code
  "architecture": {
    "frontend": ["React 18", "TypeScript", ...],
    "styling": ["Tailwind CSS", "shadcn/ui", ...],
    "dataFetching": ["React Query", ...],
    "validation": ["Zod", ...]
  },
  "quickStart": [
    {"step": 1, "title": "Install", "command": "npm install"},
    {"step": 2, "title": "Configure", "description": "Copy .env.example to .env"},
    {"step": 3, "title": "Run", "command": "npm run dev"}
  ],
  "fileStructure": "ASCII tree of recommended file structure"
}

Analyze the provided code and generate accurate, specific documentation. No placeholders.`,

  api: `You are generating API documentation for a React application.

Analyze the code and infer what API endpoints would be needed to power this frontend.

Generate JSON:
{
  "endpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "/api/...",
      "description": "What this endpoint does",
      "requestBody": null or { "field": "type", ... },
      "response": { "field": "type", ... },
      "businessRules": ["Rule 1", "Rule 2"]
    }
  ],
  "openApiSpec": "Full OpenAPI 3.0 YAML specification as string",
  "backendChecklist": [
    { "item": "Implement authentication middleware", "priority": "high" },
    ...
  ],
  "dataModels": [
    { "name": "User", "fields": [{"name": "id", "type": "number"}, ...] }
  ]
}

Be specific - infer real endpoints from the UI patterns visible in the code.`,

  qa: `You are generating QA documentation for a React application.

Analyze the code and generate comprehensive testing checklists.

Generate JSON:
{
  "functionalTests": [
    {
      "id": "TC001",
      "category": "Navigation|Forms|Data|UI",
      "description": "Test case description",
      "steps": ["Step 1", "Step 2"],
      "expected": "Expected result",
      "priority": "critical|high|medium|low"
    }
  ],
  "accessibilityTests": [
    {
      "id": "A11Y001",
      "wcagCriteria": "1.1.1",
      "description": "Test description",
      "howToTest": "Instructions"
    }
  ],
  "performanceTargets": {
    "fcp": "< 2s",
    "lcp": "< 2.5s",
    "cls": "< 0.1",
    "fid": "< 100ms",
    "bundleSize": "< 200KB gzipped"
  },
  "browserSupport": [
    { "browser": "Chrome", "version": "latest", "status": "primary" },
    ...
  ],
  "securityChecklist": [
    { "item": "XSS prevention", "status": "required" },
    ...
  ]
}

Generate realistic test cases based on the actual components in the code.`,

  deploy: `You are generating deployment documentation for a React application.

Generate comprehensive deployment configs and guides.

Generate JSON:
{
  "dockerfile": "Complete multi-stage Dockerfile content",
  "dockerCompose": "docker-compose.yml content",
  "envVariables": [
    { "name": "VITE_API_URL", "description": "Backend API URL", "required": true, "example": "https://api.example.com" }
  ],
  "cicd": {
    "platform": "GitHub Actions",
    "workflow": "Complete .github/workflows/deploy.yml content"
  },
  "platforms": [
    {
      "name": "Vercel",
      "recommended": true,
      "steps": ["Step 1", "Step 2"],
      "config": "vercel.json content"
    },
    {
      "name": "Docker",
      "recommended": false,
      "steps": ["Step 1", "Step 2"]
    }
  ],
  "productionChecklist": [
    { "category": "Security", "items": ["Item 1", "Item 2"] },
    { "category": "Performance", "items": ["Item 1", "Item 2"] },
    { "category": "Monitoring", "items": ["Item 1", "Item 2"] }
  ],
  "troubleshooting": [
    { "issue": "Common issue", "cause": "Why it happens", "solution": "How to fix" }
  ]
}

Generate production-ready configurations.`
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const body: DocsGenerationRequest = await request.json();
    const { type, projectName, generatedCode, flowNodes, styleInfo, screenCount, componentCount } = body;

    if (!type || !PROMPTS[type]) {
      return NextResponse.json(
        { error: "Invalid doc type" },
        { status: 400 }
      );
    }

    // Build context for AI
    const context = `
PROJECT: ${projectName}
SCREENS: ${screenCount}
COMPONENTS: ${componentCount}
FLOW NODES: ${JSON.stringify(flowNodes.slice(0, 10), null, 2)}
COLORS: ${styleInfo?.colors?.map(c => `${c.name}: ${c.hex}`).join(", ") || "Default"}
FONTS: ${styleInfo?.fonts?.join(", ") || "Inter"}

CODE SAMPLE (first 8000 chars):
${generatedCode?.slice(0, 8000) || "No code provided"}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.3, // Lower for more consistent output
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent([
      { text: PROMPTS[type] },
      { text: `\n\nCONTEXT:\n${context}\n\nGenerate the JSON response:` }
    ]);

    const responseText = result.response.text();
    
    // Extract JSON from response
    let jsonContent: any;
    try {
      // Try to parse directly
      jsonContent = JSON.parse(responseText);
    } catch {
      // Try to extract from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in response
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
      type,
      data: jsonContent,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Generate Docs] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate documentation" },
      { status: 500 }
    );
  }
}
