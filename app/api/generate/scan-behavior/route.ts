import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASS 3: BEHAVIOR & FLOW SCANNER
// Purpose: Track user interactions, page transitions, validations, loading states
// ═══════════════════════════════════════════════════════════════════════════════

const BEHAVIOR_SCAN_PROMPT = `You are a BUSINESS PROCESS ANALYST with frame-by-frame video analysis capabilities.

**YOUR ONLY JOB:** Watch the video and document EVERY user interaction and system response. This creates the behavior specification for QA testing.

**CRITICAL RULES:**
1. Track EVERY click, hover, and form interaction.
2. Note loading spinners, skeleton screens, and their durations.
3. Document validation errors and success messages.
4. Map navigation paths (which click leads where).
5. Identify conditional UI (elements that appear/disappear based on state).
6. Note animation types (fade, slide, scale).

**OUTPUT JSON SCHEMA:**
{
  "timestamp": "ISO timestamp",
  "confidence": 0.0-1.0,
  "videoDuration": "estimated total duration in seconds",
  
  "userJourney": [
    {
      "timestamp": "00:05",
      "action": "click|hover|type|scroll|submit|select",
      "target": {
        "element": "button|link|input|menu-item|tab|etc",
        "label": "EXACT text of element clicked",
        "selector": "suggested CSS selector (e.g., [data-testid='sidebar-payments'])"
      },
      "result": {
        "type": "navigation|modal|dropdown|state-change|api-call|validation",
        "description": "what happened after the action",
        "newUrl": "/payments (if navigation)",
        "duration": "time to complete in ms"
      }
    }
  ],
  
  "pageTransitions": [
    {
      "from": "/dashboard",
      "to": "/payments",
      "trigger": "sidebar menu click on 'Payments'",
      "transitionType": "instant|fade|slide-left|slide-right",
      "loadingIndicator": "spinner|skeleton|progress-bar|none"
    }
  ],
  
  "stateTransitions": [
    {
      "id": "state_001",
      "stateName": "loading|success|error|empty|idle",
      "trigger": "what causes this state",
      "uiIndicator": {
        "type": "spinner|skeleton|toast|modal|inline-message",
        "position": "center|button|inline",
        "text": "Loading... | Success! | Error message"
      },
      "duration": "approximate duration",
      "nextState": "what state follows"
    }
  ],
  
  "validations": [
    {
      "id": "val_001",
      "field": "form field name",
      "trigger": "on-blur|on-submit|real-time",
      "rule": "required|email|min-length|pattern|etc",
      "errorMessage": "EXACT error message shown",
      "errorPosition": "below-field|tooltip|toast",
      "successIndicator": "checkmark|green-border|none"
    }
  ],
  
  "modals": [
    {
      "id": "modal_001",
      "trigger": "what action opens it",
      "title": "Modal title",
      "type": "dialog|drawer|fullscreen|bottom-sheet",
      "hasOverlay": true,
      "closeOptions": ["X button", "click outside", "Escape key"],
      "animationType": "fade|slide-up|scale",
      "content": "brief description of modal content"
    }
  ],
  
  "toasts": [
    {
      "trigger": "what action triggers it",
      "type": "success|error|warning|info",
      "message": "EXACT toast message",
      "position": "top-right|bottom-center|etc",
      "duration": "auto-dismiss after Xs",
      "hasAction": false,
      "actionLabel": null
    }
  ],
  
  "conditionalUI": [
    {
      "id": "cond_001",
      "element": "what element appears/disappears",
      "condition": "when user is admin|when form is valid|when data is loading",
      "showWhen": true,
      "hideWhen": false,
      "evidence": "how you detected this from the video"
    }
  ],
  
  "businessRules": [
    {
      "id": "rule_001",
      "name": "Rule name",
      "type": "validation|workflow|permission|calculation",
      "description": "Plain English: 'Payment amount must be positive'",
      "implementation": "if (amount <= 0) showError('Amount must be positive')",
      "evidence": "timestamp 00:25 - error shown when negative value entered"
    }
  ],
  
  "apiCalls": [
    {
      "id": "api_001",
      "trigger": "user action that triggers this",
      "method": "GET|POST|PUT|DELETE",
      "endpoint": "/api/inferred-endpoint",
      "inferredPayload": {
        "field": "type based on form"
      },
      "inferredResponse": {
        "field": "type based on what appears"
      },
      "loadingState": "how loading is shown",
      "errorHandling": "how errors are displayed"
    }
  ],
  
  "decisionPoints": [
    {
      "id": "dec_001",
      "question": "Is user authenticated?",
      "type": "auth|permission|validation|feature-flag",
      "truePath": "Show dashboard",
      "falsePath": "Redirect to login",
      "evidence": "Video shows user already on dashboard (authenticated)"
    }
  ],
  
  "microInteractions": [
    {
      "trigger": "hover|focus|click",
      "element": "button|card|link",
      "effect": "glow|scale|color-change|shadow",
      "cssEstimate": "hover:scale-105 hover:shadow-lg"
    }
  ]
}

**IMPORTANT:**
- Watch the ENTIRE video before responding.
- Note the sequence of events chronologically.
- If something is unclear, note your uncertainty.
- This data will be used to generate E2E tests and flow documentation.

Analyze the video and document all user interactions:`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { videoBase64, mimeType, videoUrl } = body;

    if (!videoBase64 && !videoUrl) {
      return NextResponse.json({ error: "Video data required" }, { status: 400 });
    }

    console.log("[Scan-Behavior] Starting behavior analysis...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2, // Slightly higher for inferring behavior
        maxOutputTokens: 16384,
        // @ts-ignore - Gemini 3 Pro requires thinking mode
        thinkingConfig: { thinkingBudget: 8192 }, // More thinking for complex analysis
      },
    });

    // Build content parts
    const parts: any[] = [{ text: BEHAVIOR_SCAN_PROMPT }];
    
    if (videoBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "video/mp4",
          data: videoBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Extract JSON from response
    let behaviorData: any;
    try {
      behaviorData = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        behaviorData = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          behaviorData = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Scan-Behavior] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      pass: "behavior-analysis",
      data: behaviorData,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[Scan-Behavior] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze behavior" },
      { status: 500 }
    );
  }
}
