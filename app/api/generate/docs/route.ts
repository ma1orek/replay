import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

// Use Gemini 3 Pro for enterprise-grade docs
const MODEL_NAME = "gemini-3-pro-preview";

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

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE MIGRATION KIT - DOCUMENTATION PROMPTS ($100K VALUE)
// ═══════════════════════════════════════════════════════════════════════════════

const PROMPTS = {
  // ────────────────────────────────────────────────────────────────────────────
  // 1. MIGRATION AUDIT & SCOPE (replaces Overview)
  // ────────────────────────────────────────────────────────────────────────────
  overview: `You are a Senior Enterprise Migration Architect generating a MIGRATION AUDIT REPORT.

This is NOT a tutorial. This is a $100,000 migration analysis that executives will use to approve budget.

Analyze the reconstructed application and generate JSON:
{
  "migrationScope": {
    "title": "Migration Audit: [App Name]",
    "executiveSummary": "2-3 sentences explaining what legacy system was analyzed and modernization status",
    "sourceAnalysis": {
      "videoFootageAnalyzed": "Duration analyzed",
      "interactionsDetected": number,
      "validationsIdentified": number,
      "errorStatesFound": number
    }
  },
  "legacyToModernMapping": [
    {
      "legacyElement": "Description of old element (e.g., 'Win95-style data grid with 3D borders')",
      "modernComponent": "<ComponentName />",
      "migrationStatus": "✅ Auto-Mapped | ⚠️ Requires Review | 🔴 Manual Override",
      "notes": "Any conversion notes"
    }
  ],
  "complexityScore": {
    "overall": "Low/Medium/High/Critical",
    "uiComplexity": number, // 1-10
    "dataComplexity": number, // 1-10
    "businessLogicComplexity": number, // 1-10
    "integrationComplexity": number // 1-10
  },
  "debtReductionMetrics": {
    "inconsistentStylesRemoved": number,
    "duplicateComponentsConsolidated": number,
    "accessibilityIssuesFixed": number,
    "description": "Human-readable summary of technical debt reduction"
  },
  "businessRulesExtracted": [
    {
      "ruleId": "BR001",
      "description": "Business rule detected from UI behavior",
      "trigger": "What triggers this rule",
      "action": "What happens",
      "sourceEvidence": "How we detected this (e.g., 'Button disabled until field X validated')"
    }
  ],
  "riskAssessment": {
    "dataLossRisk": "None/Low/Medium/High",
    "functionalityGapRisk": "None/Low/Medium/High", 
    "userAdoptionRisk": "None/Low/Medium/High",
    "mitigationStrategies": ["Strategy 1", "Strategy 2"]
  },
  "recommendedActions": [
    {
      "priority": 1,
      "action": "Action description",
      "effort": "Hours estimate",
      "impact": "Business impact"
    }
  ]
}

Generate REAL data based on the code analysis. No placeholders. This must look like it was written by a $500/hr consultant.`,

  // ────────────────────────────────────────────────────────────────────────────
  // 2. DATA CONTRACTS & BACKEND SPECS (replaces API)
  // ────────────────────────────────────────────────────────────────────────────
  api: `You are a Senior Backend Integration Architect generating DATA CONTRACTS for a modernized frontend.

This is NOT Swagger documentation. This is a Backend Integration Specification that allows a backend developer to implement APIs without asking the frontend team a single question.

Analyze the UI code and generate JSON:
{
  "integrationOverview": {
    "totalEndpointsRequired": number,
    "authenticationMethod": "JWT/OAuth2/API Key/Session",
    "primaryDataEntities": ["Entity1", "Entity2"]
  },
  "dataContracts": [
    {
      "contractId": "DC001",
      "name": "SubmitLoanApplication",
      "triggerPoint": "Where in UI this is called (e.g., 'Save button on /apply page')",
      "method": "POST",
      "endpoint": "/api/v1/applications",
      "requestSchema": {
        "typescript": "interface RequestPayload { ... } // Full TypeScript interface",
        "validation": "Zod schema as string"
      },
      "responseSchema": {
        "success": "{ status: 'ok', id: string, ... }",
        "error": "{ error: string, code: number, ... }"
      },
      "businessRules": [
        "Amount must be between 1000 and 50000",
        "Customer ID required from auth context"
      ],
      "mockResponse": "Complete JSON mock that frontend can use for testing"
    }
  ],
  "legacyFieldMapping": [
    {
      "legacyLabel": "Field label as shown in old UI",
      "newApiField": "snake_case_field_name",
      "dataType": "string/number/boolean/date",
      "validation": "Required/Optional + any constraints",
      "transformationNotes": "Any data transformation needed"
    }
  ],
  "dataModels": [
    {
      "name": "ModelName",
      "description": "What this model represents",
      "typescript": "Complete TypeScript interface/type definition",
      "dbSchema": "Suggested PostgreSQL/MySQL schema"
    }
  ],
  "integrationChecklist": [
    {
      "phase": "Phase 1: Core APIs",
      "items": [
        { "endpoint": "/api/...", "status": "Required", "estimatedHours": number }
      ]
    }
  ]
}

Generate contracts based on ACTUAL forms, buttons, and data displayed in the UI code. Backend team copies this and implements.`,

  // ────────────────────────────────────────────────────────────────────────────
  // 3. TRACEABILITY & BEHAVIORAL TESTS (replaces QA)
  // ────────────────────────────────────────────────────────────────────────────
  qa: `You are a QA Automation Lead generating a TRACEABILITY MATRIX and BEHAVIORAL TEST SUITE.

This proves that the new system behaves IDENTICALLY to the legacy system. This is compliance-grade documentation.

Analyze the code and generate JSON:
{
  "traceabilityMatrix": {
    "totalElementsTracked": number,
    "coveragePercentage": "98.5%",
    "methodology": "Video frame analysis + UI behavior mapping"
  },
  "visualRegressionProof": [
    {
      "elementId": "VR001",
      "elementName": "Transaction Table",
      "reconstructionAccuracy": "99.2%",
      "differences": ["Font changed from Arial to Inter", "Row height +2px for accessibility"],
      "verdict": "✅ Acceptable Deviation"
    }
  ],
  "behavioralTests": [
    {
      "testId": "BT001",
      "scenario": "Gherkin-style scenario description",
      "given": "Initial state",
      "when": "User action",
      "then": "Expected outcome",
      "automationCode": "Playwright/Cypress test code as string",
      "sourceEvidence": "Where in legacy this behavior was observed"
    }
  ],
  "accessibilityAudit": {
    "wcagLevel": "AA",
    "issuesFound": number,
    "issuesFixed": number,
    "improvements": [
      {
        "issue": "Missing alt text on images",
        "legacyStatus": "❌ Failed",
        "modernStatus": "✅ Fixed",
        "wcagCriteria": "1.1.1"
      }
    ]
  },
  "performanceBaseline": {
    "legacyEstimate": {
      "loadTime": "3-5s (typical legacy app)",
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
      "category": "Input Validation",
      "checks": [
        { "item": "XSS prevention on all text inputs", "status": "✅ Implemented" },
        { "item": "SQL injection prevention", "status": "✅ Parameterized queries required" }
      ]
    }
  ],
  "signOffChecklist": [
    { "stakeholder": "QA Lead", "requirement": "All behavioral tests pass", "status": "pending" },
    { "stakeholder": "Security", "requirement": "OWASP Top 10 addressed", "status": "pending" },
    { "stakeholder": "Accessibility", "requirement": "WCAG 2.1 AA compliant", "status": "pending" }
  ]
}

Generate REAL test scenarios based on actual UI components. This is audit-grade documentation.`,

  // ────────────────────────────────────────────────────────────────────────────
  // 4. HANDOFF & ARCHITECTURE (replaces Deploy)
  // ────────────────────────────────────────────────────────────────────────────
  deploy: `You are a Solutions Architect generating a TECHNICAL HANDOFF PACKAGE for the development team.

This is the "keys to the car". Tech Lead reads this and knows exactly how to integrate, extend, and deploy.

Generate JSON:
{
  "architectureOverview": {
    "pattern": "Component-based SPA / Micro-frontend / etc",
    "stateManagement": "How state is managed (Context/Redux/Zustand)",
    "dataFlow": "Description of data flow in the app",
    "keyDecisions": [
      { "decision": "Used React Hook Form for forms", "rationale": "Performance + validation" }
    ]
  },
  "componentHierarchy": {
    "tree": "ASCII tree showing component structure",
    "sharedComponents": ["ComponentA", "ComponentB"],
    "pageComponents": ["DashboardPage", "SettingsPage"],
    "featureModules": [
      { "name": "Authentication", "components": ["LoginForm", "AuthProvider"] }
    ]
  },
  "designSystemUsage": {
    "baseLibrary": "shadcn/ui",
    "customComponents": number,
    "tokenUsage": {
      "colors": number,
      "spacing": number,
      "typography": number
    },
    "deviations": ["List any custom components not from design system"]
  },
  "integrationPoints": [
    {
      "location": "src/components/Dashboard.tsx:45",
      "marker": "TODO: CONNECT_API",
      "description": "Replace mock data with real API call",
      "suggestedImplementation": "Code snippet showing how to integrate"
    }
  ],
  "deploymentGuide": {
    "recommended": "Vercel",
    "alternatives": ["AWS Amplify", "Netlify", "Docker"],
    "envVariables": [
      { "name": "NEXT_PUBLIC_API_URL", "required": true, "description": "Backend API URL" }
    ],
    "buildCommand": "npm run build",
    "outputDir": ".next"
  },
  "maintenanceGuide": {
    "updateDependencies": "npm update schedule recommendation",
    "monitoringSetup": ["Sentry for errors", "Vercel Analytics for performance"],
    "backupStrategy": "Git-based with tagged releases"
  },
  "handoffChecklist": [
    { "item": "Code review completed", "owner": "Tech Lead" },
    { "item": "Environment variables documented", "owner": "DevOps" },
    { "item": "CI/CD pipeline configured", "owner": "DevOps" },
    { "item": "Monitoring alerts set up", "owner": "SRE" }
  ]
}

Generate a REAL architecture analysis. Tech Lead should be able to onboard a new developer using this doc alone.`
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
