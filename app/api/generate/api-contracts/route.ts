import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-flash-preview"; // Flash to save API quota

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API CONTRACTS GENERATOR
// Purpose: Generate Swagger/OpenAPI specs and TypeScript interfaces from UI scan
// Value: Backend team gets ready-to-implement API specifications
// ═══════════════════════════════════════════════════════════════════════════════

const API_CONTRACTS_PROMPT = `You are a Senior API Architect analyzing a reconstructed UI to infer backend API contracts.

**YOUR MISSION:** Generate production-ready API specifications that a backend team can implement immediately.

From the UI analysis, you can infer:
- Tables → GET endpoints with pagination/filtering
- Forms → POST/PUT endpoints with payloads
- Delete buttons → DELETE endpoints
- Charts → Aggregation endpoints
- Filters → Query parameters
- Validation errors → Request validation rules

**OUTPUT JSON:**
{
  "openapi": "3.0.3",
  "info": {
    "title": "API Specification (Inferred from UI)",
    "version": "1.0.0",
    "description": "API contracts reverse-engineered from legacy UI reconstruction"
  },
  "servers": [
    {
      "url": "https://api.example.com/v1",
      "description": "Production API"
    }
  ],
  "paths": {
    "/api/resource": {
      "get": {
        "operationId": "listResources",
        "summary": "List Resources",
        "description": "Inferred from: [DataTable showing resources at specific location]",
        "tags": ["Resources"],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": { "type": "integer", "default": 1 },
            "description": "Page number for pagination"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 10 },
            "description": "Items per page"
          },
          {
            "name": "status",
            "in": "query",
            "schema": { "type": "string", "enum": ["all", "active", "pending"] },
            "description": "Filter by status (inferred from filter options)"
          },
          {
            "name": "search",
            "in": "query",
            "schema": { "type": "string" },
            "description": "Search query (inferred from search input)"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResourceListResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "operationId": "createResource",
        "summary": "Create Resource",
        "description": "Inferred from: [Form with submit button]",
        "tags": ["Resources"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateResourceRequest"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Created successfully",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Resource" }
              }
            }
          },
          "400": {
            "description": "Validation error",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ValidationError" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Resource": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "field1": { "type": "string", "description": "From column header" },
          "field2": { "type": "number", "description": "Numeric field" },
          "status": { "type": "string", "enum": ["active", "pending", "completed"] },
          "createdAt": { "type": "string", "format": "date-time" }
        },
        "required": ["id", "field1"]
      },
      "ResourceListResponse": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": { "$ref": "#/components/schemas/Resource" }
          },
          "pagination": {
            "type": "object",
            "properties": {
              "page": { "type": "integer" },
              "limit": { "type": "integer" },
              "total": { "type": "integer" },
              "totalPages": { "type": "integer" }
            }
          }
        }
      },
      "CreateResourceRequest": {
        "type": "object",
        "properties": {},
        "required": []
      },
      "ValidationError": {
        "type": "object",
        "properties": {
          "error": { "type": "string" },
          "details": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "field": { "type": "string" },
                "message": { "type": "string" }
              }
            }
          }
        }
      }
    }
  },
  "typescript": {
    "interfaces": "// TypeScript interfaces\\n\\nexport interface Resource {\\n  id: string;\\n  // ... fields\\n}",
    "zodSchemas": "// Zod validation schemas\\n\\nimport { z } from 'zod';\\n\\nexport const ResourceSchema = z.object({\\n  id: z.string().uuid(),\\n  // ... validation\\n});"
  },
  "summary": {
    "totalEndpoints": 5,
    "getEndpoints": 3,
    "postEndpoints": 1,
    "putEndpoints": 1,
    "deleteEndpoints": 0,
    "totalSchemas": 4,
    "inferredFromUI": [
      "DataTable with columns [A, B, C] → GET /api/resource",
      "Create form with fields [X, Y] → POST /api/resource"
    ]
  }
}

**INFERENCE RULES:**
1. Table columns → Schema properties (infer types from sample data)
2. Filter dropdowns → Enum types in query params
3. Pagination → Standard page/limit parameters
4. Form fields → Request body schema (required from validation)
5. Numeric formatting ($, %, etc.) → Type hints
6. Date columns → ISO 8601 format

Generate REAL API contracts based on the actual UI scan data:`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { scanData, projectName, generatedCode } = body;

    if (!scanData) {
      return NextResponse.json({ error: "Scan data required" }, { status: 400 });
    }

    console.log("[API-Contracts] Generating API specifications...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 16384,
      },
    });

    const context = `
PROJECT: ${projectName || "Legacy Application"}

**SCAN DATA (Source of Truth):**
${JSON.stringify(scanData, null, 2)}

${generatedCode ? `
**GENERATED CODE REFERENCE (for additional context):**
${generatedCode.substring(0, 8000)}
` : ''}

Generate comprehensive API contracts based on this UI analysis:`;

    const result = await model.generateContent([
      { text: API_CONTRACTS_PROMPT },
      { text: context }
    ]);

    const responseText = result.response.text();
    
    // Extract JSON
    let contracts: any;
    try {
      contracts = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        contracts = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          contracts = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[API-Contracts] Generated in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: contracts,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API-Contracts] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate API contracts" },
      { status: 500 }
    );
  }
}
