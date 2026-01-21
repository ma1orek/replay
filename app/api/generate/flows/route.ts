import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

// Use Gemini 3 Pro for flows (better reasoning)
const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

interface FlowGenerationRequest {
  projectName: string;
  generatedCode: string;
  flowNodes: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    components?: string[];
  }>;
  flowEdges: Array<{
    id: string;
    from: string;
    to: string;
    label?: string;
  }>;
}

const FLOW_PROMPT = `You are generating interactive user flow diagrams for an enterprise React application.

Analyze the provided code and flow data to create comprehensive Mermaid diagrams.

Generate JSON with multiple diagram types:
{
  "userJourney": {
    "title": "Main User Journey",
    "description": "Description of the primary user flow",
    "mermaid": "graph TB\\n    Start([User Opens App]) --> SCR001[Main Screen]\\n    ...",
    "interactions": [
      {
        "id": "INT001",
        "action": "Click button",
        "from": "Screen A",
        "to": "Screen B",
        "description": "What happens"
      }
    ]
  },
  "screenNavigation": {
    "title": "Screen Navigation Map",
    "mermaid": "graph LR\\n    Home --> Dashboard\\n    ...",
    "screens": [
      { "id": "SCR001", "name": "Screen Name", "type": "page|modal|section" }
    ]
  },
  "dataFlow": {
    "title": "Data Flow Diagram",
    "mermaid": "sequenceDiagram\\n    participant U as User\\n    participant F as Frontend\\n    ...",
    "apiCalls": [
      { "method": "GET", "endpoint": "/api/data", "description": "Fetch data" }
    ]
  },
  "stateManagement": {
    "title": "Component State Flow",
    "mermaid": "stateDiagram-v2\\n    [*] --> Loading\\n    Loading --> Loaded: Data fetched\\n    ..."
  },
  "businessLogic": [
    {
      "id": "BL001",
      "name": "Business Rule Name",
      "description": "What this rule does",
      "mermaid": "graph TB\\n    Check{Condition?}\\n    Check -->|Yes| Action1\\n    Check -->|No| Action2"
    }
  ]
}

IMPORTANT:
- Use proper Mermaid syntax (escape special characters)
- Make diagrams visually clear and not too complex
- Include styling with style definitions
- For graph diagrams, use meaningful node IDs like SCR001, BTN001
- For sequence diagrams, use clear participant names
- Add comments/notes to explain complex flows

Generate REAL diagrams based on the actual code structure, not generic placeholders.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const body: FlowGenerationRequest = await request.json();
    const { projectName, generatedCode, flowNodes, flowEdges } = body;

    // Build context
    const context = `
PROJECT: ${projectName}

DETECTED SCREENS/NODES:
${flowNodes.map(n => `- ${n.id}: ${n.name} (${n.type}) - ${n.status}`).join("\n")}

DETECTED EDGES/TRANSITIONS:
${flowEdges.map(e => `- ${e.from} → ${e.to}${e.label ? ` (${e.label})` : ""}`).join("\n")}

CODE STRUCTURE (analyzing components, routes, state):
${generatedCode?.slice(0, 12000) || "No code provided"}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 16384,
      },
    });

    const result = await model.generateContent([
      { text: FLOW_PROMPT },
      { text: `\n\nCONTEXT:\n${context}\n\nGenerate comprehensive flow diagrams:` }
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
    console.error("[Generate Flows] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate flows" },
      { status: 500 }
    );
  }
}
