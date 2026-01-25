import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-flash-preview"; // Flash to save API quota

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASS 2: DATA EXTRACTION SCANNER
// Purpose: Extract ALL visible data - tables, charts, metrics, forms
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_SCAN_PROMPT = `You are a DATA EXTRACTION SPECIALIST with perfect OCR vision.

**YOUR ONLY JOB:** Extract ALL visible data from the video. DO NOT generate code. Just extract RAW DATA.

**CRITICAL RULES:**
1. EVERY number must be transcribed EXACTLY. "$1,234.56" not "$1234" or "$1,235".
2. EVERY table row must be captured. If there are 10 rows, list all 10.
3. Chart data points should be estimated from the visual (read the axis labels and estimate values).
4. Form field types must be identified (text, email, number, select, etc.).
5. Currency symbols and formats must be preserved (USD, EUR, PLN, etc.).
6. Percentages must include the % symbol and +/- sign if present.

**OUTPUT JSON SCHEMA:**
{
  "timestamp": "ISO timestamp",
  "confidence": 0.0-1.0,
  
  "metrics": [
    {
      "id": "metric_001",
      "label": "EXACT label text (e.g., 'Total Revenue')",
      "value": "EXACT value with formatting (e.g., '$45,231.89')",
      "rawValue": 45231.89,
      "currency": "USD|EUR|PLN|null",
      "change": "+20.1%",
      "changeDirection": "up|down|neutral",
      "changeLabel": "from last month|vs yesterday|etc",
      "hasSparkline": true,
      "sparklineData": [10, 15, 12, 18, 22, 25],
      "iconShape": "dollar-sign|users|shopping-cart|etc",
      "position": "row-1-col-1"
    }
  ],
  
  "tables": [
    {
      "id": "table_001",
      "title": "EXACT table title",
      "columns": [
        {
          "key": "column_key",
          "header": "EXACT header text",
          "type": "string|number|currency|date|status|avatar|actions",
          "align": "left|center|right",
          "width": "auto|100px|etc"
        }
      ],
      "rows": [
        {
          "id": "row_001",
          "cells": {
            "column_key": "EXACT cell value"
          }
        }
      ],
      "pagination": {
        "hasPagination": true,
        "currentPage": 1,
        "totalPages": 10,
        "rowsPerPage": 10,
        "totalRows": 100
      },
      "filters": {
        "hasFilters": true,
        "filterOptions": ["All", "Pending", "Completed"],
        "currentFilter": "All"
      },
      "hasSearch": true,
      "hasSort": true,
      "hasCheckboxes": false,
      "hasActions": true,
      "actionButtons": ["View", "Edit", "Delete"]
    }
  ],
  
  "charts": [
    {
      "id": "chart_001",
      "title": "EXACT chart title",
      "type": "area|line|bar|pie|donut|composed",
      "xAxis": {
        "label": "X axis label",
        "type": "category|time|number",
        "values": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      },
      "yAxis": {
        "label": "Y axis label", 
        "type": "number|currency|percentage",
        "min": 0,
        "max": 50000,
        "unit": "$|%|null"
      },
      "series": [
        {
          "name": "Series name (from legend)",
          "color": "#hex sampled from chart",
          "data": [12000, 15000, 18000, 22000, 19000, 25000],
          "type": "area|line|bar"
        }
      ],
      "styling": {
        "hasGradientFill": true,
        "gradientFrom": "#hex",
        "gradientTo": "transparent",
        "strokeWidth": 2,
        "showDots": false,
        "showGrid": true,
        "gridStyle": "dashed|solid",
        "curveType": "monotone|linear|step"
      },
      "tooltip": {
        "hasTooltip": true,
        "format": "Value: $value on $label"
      },
      "legend": {
        "hasLegend": true,
        "position": "top|bottom|right",
        "items": ["2024", "2023"]
      }
    }
  ],
  
  "forms": [
    {
      "id": "form_001",
      "title": "Form title if visible",
      "fields": [
        {
          "name": "field_name",
          "label": "EXACT label text",
          "type": "text|email|password|number|tel|url|textarea|select|checkbox|radio|date|file",
          "placeholder": "placeholder text if visible",
          "value": "current value if visible",
          "required": true,
          "validation": "email format|min 8 chars|etc",
          "options": ["Option 1", "Option 2"],
          "helperText": "helper text below field"
        }
      ],
      "submitButton": {
        "label": "EXACT button text",
        "variant": "primary|secondary|outline",
        "isLoading": false,
        "isDisabled": false
      },
      "cancelButton": {
        "exists": true,
        "label": "Cancel"
      }
    }
  ],
  
  "lists": [
    {
      "id": "list_001",
      "title": "List title",
      "type": "simple|avatar|icon|action",
      "items": [
        {
          "primary": "Main text",
          "secondary": "Secondary text",
          "avatar": "URL or initials",
          "icon": "icon shape",
          "badge": "badge text",
          "action": "action button text"
        }
      ]
    }
  ],
  
  "statusIndicators": [
    {
      "type": "badge|dot|progress",
      "label": "Status label",
      "value": "Active|Pending|Error",
      "color": "green|yellow|red|blue"
    }
  ]
}

**IMPORTANT:**
- If data is partially visible (scrolled), note what you CAN see.
- Estimate chart values by reading axis scales carefully.
- For tables with many rows, capture at least the first 10 visible rows.
- This JSON will be injected into React components, so accuracy is critical.

Analyze the video and extract all visible data:`;

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

    console.log("[Scan-Data] Starting data extraction...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.1, // Low temperature for accuracy
        maxOutputTokens: 16384, // Larger for tables with many rows
      },
    });

    // Build content parts
    const parts: any[] = [{ text: DATA_SCAN_PROMPT }];
    
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
    let extractedData: any;
    try {
      extractedData = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          extractedData = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Scan-Data] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      pass: "data-extraction",
      data: extractedData,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[Scan-Data] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract data" },
      { status: 500 }
    );
  }
}
