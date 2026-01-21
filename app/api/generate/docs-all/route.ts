import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 180; // 3 minutes for all docs

const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

interface DocsAllRequest {
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

const UNIFIED_DOCS_PROMPT = `You are a Senior Enterprise Migration Architect generating a COMPLETE MIGRATION KIT.

This is a $100,000 enterprise deliverable. Generate ALL 4 documentation sections in ONE response.

OUTPUT FORMAT - Return EXACTLY this JSON structure:
{
  "overview": {
    "migrationScope": {
      "title": "Migration Audit: [App Name]",
      "executiveSummary": "2-3 sentence summary",
      "sourceAnalysis": {
        "videoFootageAnalyzed": "30s footage",
        "interactionsDetected": 12,
        "validationsIdentified": 5,
        "errorStatesFound": 2
      }
    },
    "legacyToModernMapping": [
      {
        "legacyElement": "Legacy element description",
        "modernComponent": "<ComponentName />",
        "migrationStatus": "✅ Auto-Mapped",
        "notes": "Notes"
      }
    ],
    "complexityScore": {
      "overall": "Medium",
      "uiComplexity": 6,
      "dataComplexity": 5,
      "businessLogicComplexity": 4,
      "integrationComplexity": 3
    },
    "debtReductionMetrics": {
      "inconsistentStylesRemoved": 15,
      "duplicateComponentsConsolidated": 8,
      "accessibilityIssuesFixed": 12,
      "description": "Summary of debt reduction"
    },
    "businessRulesExtracted": [
      {
        "ruleId": "BR001",
        "description": "Rule description",
        "trigger": "Trigger",
        "action": "Action",
        "sourceEvidence": "Evidence"
      }
    ],
    "riskAssessment": {
      "dataLossRisk": "Low",
      "functionalityGapRisk": "Low",
      "userAdoptionRisk": "Low",
      "mitigationStrategies": ["Strategy 1", "Strategy 2"]
    },
    "recommendedActions": [
      {
        "priority": 1,
        "action": "Action",
        "effort": "4 hours",
        "impact": "High"
      }
    ]
  },
  "api": {
    "integrationOverview": {
      "totalEndpointsRequired": 5,
      "authenticationMethod": "JWT",
      "primaryDataEntities": ["Entity1", "Entity2"]
    },
    "dataContracts": [
      {
        "contractId": "DC001",
        "name": "ContractName",
        "triggerPoint": "UI trigger point",
        "method": "POST",
        "endpoint": "/api/v1/resource",
        "requestSchema": {
          "typescript": "interface RequestPayload { field: string; }",
          "validation": "z.object({ field: z.string() })"
        },
        "responseSchema": {
          "success": "{ status: 'ok', data: {} }",
          "error": "{ error: string, code: number }"
        },
        "businessRules": ["Rule 1"],
        "mockResponse": "{ id: '123' }"
      }
    ],
    "legacyFieldMapping": [
      {
        "legacyLabel": "Field Label",
        "newApiField": "field_name",
        "dataType": "string",
        "validation": "Required",
        "transformationNotes": "None"
      }
    ],
    "dataModels": [
      {
        "name": "ModelName",
        "description": "Description",
        "typescript": "interface Model { id: string; }",
        "dbSchema": "CREATE TABLE model (id VARCHAR(255))"
      }
    ],
    "integrationChecklist": [
      {
        "phase": "Phase 1",
        "items": [
          { "endpoint": "/api/v1/...", "status": "Required", "estimatedHours": 4 }
        ]
      }
    ]
  },
  "qa": {
    "traceabilityMatrix": {
      "totalElementsTracked": 25,
      "coveragePercentage": "98%",
      "methodology": "Video frame analysis"
    },
    "visualRegressionProof": [
      {
        "elementId": "VR001",
        "elementName": "Element",
        "reconstructionAccuracy": "99%",
        "differences": ["Minor spacing change"],
        "verdict": "✅ Acceptable"
      }
    ],
    "behavioralTests": [
      {
        "testId": "BT001",
        "scenario": "Scenario",
        "given": "Given state",
        "when": "User action",
        "then": "Expected result",
        "automationCode": "test('scenario', async () => { ... })",
        "sourceEvidence": "Video timestamp"
      }
    ],
    "accessibilityAudit": {
      "wcagLevel": "AA",
      "issuesFound": 5,
      "issuesFixed": 5,
      "improvements": [
        {
          "issue": "Issue",
          "legacyStatus": "❌ Failed",
          "modernStatus": "✅ Fixed",
          "wcagCriteria": "1.1.1"
        }
      ]
    },
    "performanceBaseline": {
      "legacyEstimate": {
        "loadTime": "3-5s",
        "interactionDelay": "200-500ms"
      },
      "modernTarget": {
        "lcp": "< 2.5s",
        "fid": "< 100ms",
        "cls": "< 0.1",
        "ttfb": "< 600ms"
      },
      "expectedImprovement": "60-80% faster"
    },
    "securityChecklist": [
      {
        "category": "Security",
        "checks": [
          { "item": "XSS prevention", "status": "✅ Implemented" }
        ]
      }
    ],
    "signOffChecklist": [
      { "stakeholder": "QA Lead", "requirement": "Tests pass", "status": "pending" }
    ]
  },
  "deploy": {
    "architectureOverview": {
      "pattern": "Component-based SPA",
      "stateManagement": "React state + Context",
      "dataFlow": "Data flow description",
      "keyDecisions": [
        { "decision": "Decision", "rationale": "Rationale" }
      ]
    },
    "componentHierarchy": {
      "tree": "App\\n├── Layout\\n│   ├── Sidebar\\n│   └── Content",
      "sharedComponents": ["Button", "Card"],
      "pageComponents": ["Dashboard"],
      "featureModules": [
        { "name": "Module", "components": ["Comp1"] }
      ]
    },
    "designSystemUsage": {
      "baseLibrary": "shadcn/ui + Tailwind",
      "customComponents": 5,
      "tokenUsage": {
        "colors": 12,
        "spacing": 8,
        "typography": 6
      },
      "deviations": ["None"]
    },
    "integrationPoints": [
      {
        "location": "src/components/...",
        "marker": "TODO: CONNECT_API",
        "description": "Replace mock data",
        "suggestedImplementation": "const data = await fetch(...)"
      }
    ],
    "deploymentGuide": {
      "recommended": "Vercel",
      "alternatives": ["Netlify", "AWS"],
      "envVariables": [
        { "name": "NEXT_PUBLIC_API_URL", "required": true, "description": "API URL" }
      ],
      "buildCommand": "npm run build",
      "outputDir": ".next"
    },
    "maintenanceGuide": {
      "updateDependencies": "Monthly",
      "monitoringSetup": ["Sentry", "Vercel Analytics"],
      "backupStrategy": "Git tags"
    },
    "handoffChecklist": [
      { "item": "Code review", "owner": "Tech Lead" }
    ]
  }
}

CRITICAL RULES:
1. Generate REAL, SPECIFIC content based on the code analysis - no placeholders
2. Analyze the actual code structure, components, and data patterns
3. This must look like $500/hr consultant work
4. Return ONLY valid JSON - no markdown, no explanations`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const body: DocsAllRequest = await request.json();
    const { projectName, generatedCode, flowNodes, styleInfo, screenCount, componentCount } = body;

    // Build context for AI
    const context = `
PROJECT: ${projectName}
SCREENS: ${screenCount}
COMPONENTS: ${componentCount}
FLOW NODES: ${JSON.stringify(flowNodes?.slice(0, 10) || [], null, 2)}
COLORS: ${styleInfo?.colors?.map(c => `${c.name}: ${c.hex}`).join(", ") || "Default"}
FONTS: ${styleInfo?.fonts?.join(", ") || "Inter"}

CODE SAMPLE (first 12000 chars):
${generatedCode?.slice(0, 12000) || "No code provided"}
`;

    console.log("[Generate All Docs] Starting unified generation for:", projectName);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2, // Lower for consistent output
        maxOutputTokens: 16384, // Large output for all 4 docs
        // @ts-ignore - Gemini 3 Pro requires thinking mode
        thinkingConfig: { thinkingBudget: 1024 }, // Minimum budget for JSON responses
      },
    });

    const result = await model.generateContent([
      { text: UNIFIED_DOCS_PROMPT },
      { text: `\n\nCONTEXT:\n${context}\n\nGenerate the complete JSON with all 4 documentation sections:` }
    ]);

    const responseText = result.response.text();
    
    // Extract JSON from response
    let jsonContent: any;
    try {
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

    console.log("[Generate All Docs] ✅ Successfully generated all documentation");

    return NextResponse.json({
      success: true,
      overview: jsonContent.overview,
      api: jsonContent.api,
      qa: jsonContent.qa,
      deploy: jsonContent.deploy,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Generate All Docs] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate documentation" },
      { status: 500 }
    );
  }
}
