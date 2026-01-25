import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

// Use Gemini 3 Pro Preview for best quality flow detection
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

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS PROCESS ARCHITECTURE PROMPT ($100K Enterprise Value)
// ═══════════════════════════════════════════════════════════════════════════════

const FLOW_PROMPT = `You are a Senior Business Process Architect analyzing a reconstructed legacy application.

This is NOT a sitemap. This is a BUSINESS PROCESS ARCHITECTURE diagram that shows:
- Decision Points (where user/system makes choices)
- Data Flow (where data moves between components and APIs)
- State Transitions (loading, success, error states)
- Business Rules (validation, conditional logic)
- POSSIBLE PAGES TO GENERATE (from navigation links not yet implemented)

IMPORTANT: Look for REPLAY_METADATA comment in the code to find:
- possiblePages: Navigation links that could become new pages
- detectedNavLinks: All links found in navigation
- implementedPages: Pages that are already built
- suggestedNextPages: Recommended pages to generate next

Generate JSON for an ENTERPRISE PROCESS MAP:
{
  "processArchitecture": {
    "title": "Business Process Architecture",
    "description": "Complete process flow with decision points and data nodes",
    "mermaid": "flowchart TB\\n    subgraph UserActions[User Actions]\\n    START([User Opens App]) --> LOAD[Load Dashboard]\\n    LOAD --> CHECK{Auth Check}\\n    CHECK -->|Authenticated| DASH[Dashboard View]\\n    CHECK -->|Not Auth| LOGIN[Login Screen]\\n    end\\n    subgraph DataLayer[Data Layer]\\n    DASH --> API[(Fetch Data)]\\n    API --> TRANSFORM[Transform Response]\\n    end",
    "nodes": [
      {
        "id": "NODE001",
        "type": "start|action|decision|api|state|end",
        "label": "Node Label",
        "description": "What this node represents"
      }
    ]
  },
  "decisionMatrix": {
    "title": "Decision Points Analysis",
    "decisions": [
      {
        "id": "DEC001",
        "name": "Decision Name",
        "condition": "What is being checked",
        "truePath": "What happens if true",
        "falsePath": "What happens if false",
        "sourceEvidence": "Where in UI this was detected (e.g., 'Button disabled until form valid')"
      }
    ]
  },
  "dataContracts": {
    "title": "API Integration Points",
    "endpoints": [
      {
        "id": "API001",
        "trigger": "What UI action triggers this",
        "method": "GET|POST|PUT|DELETE",
        "endpoint": "/api/...",
        "payload": "{ field: type }",
        "response": "{ field: type }",
        "errorHandling": "How errors are shown to user"
      }
    ],
    "mermaid": "sequenceDiagram\\n    participant U as User\\n    participant UI as Frontend\\n    participant API as Backend API\\n    participant DB as Database\\n    U->>UI: Click Submit\\n    UI->>API: POST /api/submit\\n    API->>DB: INSERT record\\n    DB-->>API: Success\\n    API-->>UI: 200 OK\\n    UI-->>U: Show Success Toast"
  },
  "stateMachine": {
    "title": "Application State Flow",
    "description": "State transitions detected from UI behavior",
    "mermaid": "stateDiagram-v2\\n    [*] --> Idle\\n    Idle --> Loading: User Action\\n    Loading --> Success: Data Received\\n    Loading --> Error: Request Failed\\n    Success --> Idle: Reset\\n    Error --> Idle: Retry",
    "states": [
      {
        "name": "State Name",
        "entryCondition": "How to enter this state",
        "exitCondition": "How to exit this state",
        "uiIndicator": "What user sees (e.g., spinner, error message)"
      }
    ]
  },
  "businessRules": {
    "title": "Extracted Business Logic",
    "rules": [
      {
        "id": "BR001",
        "name": "Rule Name",
        "type": "validation|conditional|calculation|workflow",
        "description": "Plain English description",
        "implementation": "if (condition) { action } else { alternative }",
        "sourceEvidence": "How this was detected from UI"
      }
    ]
  },
  "userJourneys": [
    {
      "name": "Primary User Journey",
      "persona": "Primary User (e.g., Bank Teller, Admin)",
      "goal": "What user wants to achieve",
      "steps": [
        {
          "step": 1,
          "action": "User action",
          "screen": "Screen/Component name",
          "outcome": "What happens"
        }
      ],
      "happyPath": true,
      "estimatedTime": "2-3 minutes"
    }
  ],
  "integrationPoints": [
    {
      "id": "INT001",
      "location": "Component/file where integration needed",
      "type": "API|Database|External Service|Auth",
      "status": "TODO: CONNECT",
      "suggestedImplementation": "Code snippet or description"
    }
  ],
  "possiblePagesToGenerate": {
    "title": "Pages Available for Generation",
    "description": "Navigation links detected that can be generated as new pages",
    "pages": [
      {
        "name": "Page Name (e.g., About, Services)",
        "source": "Where detected (e.g., nav link, footer link, button)",
        "priority": "high|medium|low",
        "estimatedComplexity": "simple|moderate|complex",
        "suggestedContent": "Brief description of what the page should contain based on context"
      }
    ],
    "implementedPages": ["List of pages already built"],
    "generationOrder": ["Recommended order to generate remaining pages"]
  }
}

CRITICAL RULES:
1. Use DECISION NODES (diamonds {}) for every if/else, validation check, or conditional
2. Use DATABASE NODES (cylinders [()]) for every API call or data fetch
3. Use SUBGRAPHS to group related functionality
4. Show BOTH happy path AND error paths
5. Extract REAL business rules from form validation, disabled buttons, conditional rendering
6. Every button click should trace to an action node

Generate REAL analysis based on the actual code. This must look like a $50,000 consulting deliverable.`;

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
