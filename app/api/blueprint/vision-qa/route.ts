import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// For Next.js App Router - route segment config
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * QA TESTER - Agentic Vision Post-Generation Verification
 * 
 * Compares the generated component (screenshot) with the reference image.
 * Reports differences and suggests fixes.
 * 
 * Input: Reference image + Generated component screenshot (or HTML to render)
 * Output: Diff report with specific fixes
 */

const QA_TESTER_PROMPT = `
**ROLE: AGENTIC VISION QA TESTER**

You are an expert visual QA tester that compares a REFERENCE image with a GENERATED component.
Your job is to find differences and provide SPECIFIC, ACTIONABLE fixes.

**COMPARISON CRITERIA:**

1. **LAYOUT ACCURACY** (Critical)
   - Element positioning matches reference
   - Spacing between elements is correct
   - Alignment is correct (left, center, right)
   - Grid/flex layout structure matches

2. **COLOR ACCURACY** (Critical)
   - Background colors match
   - Text colors match
   - Accent/brand colors match
   - Border colors match
   - Gradient colors and direction match

3. **TYPOGRAPHY ACCURACY** (High)
   - Font sizes are proportionally correct
   - Font weights match (bold, medium, regular)
   - Text alignment matches
   - Line spacing looks similar

4. **CONTENT ACCURACY** (Critical)
   - All text content present
   - Text content is identical (no typos, no changes)
   - Icons present where they should be
   - Images present where they should be

5. **VISUAL EFFECTS** (Medium)
   - Shadows match (presence, intensity)
   - Border radius matches
   - Blur effects match
   - Opacity/transparency matches

6. **PROPORTIONS** (High)
   - Overall component aspect ratio
   - Element sizes relative to each other
   - Padding proportions

**SCORING:**
- PERFECT (95-100%): Visually identical, production ready
- GOOD (80-94%): Minor differences, acceptable
- NEEDS_WORK (60-79%): Noticeable differences, needs fixes
- POOR (0-59%): Major differences, regenerate

**OUTPUT JSON SCHEMA:**
{
  "score": 0-100,
  "verdict": "PERFECT|GOOD|NEEDS_WORK|POOR",
  "summary": "One sentence summary of comparison",
  "differences": [
    {
      "category": "layout|color|typography|content|effects|proportions",
      "severity": "critical|high|medium|low",
      "description": "What is different",
      "expected": "What it should be (from reference)",
      "actual": "What it is (in generated)",
      "fix": {
        "type": "css_change|content_change|structure_change",
        "target": "CSS selector or element description",
        "change": "Specific Tailwind class change or content fix",
        "before": "current classes/content",
        "after": "corrected classes/content"
      }
    }
  ],
  "autoFixable": true|false,
  "autoFixCode": "If autoFixable, provide the corrected JSX code here" | null,
  "recommendations": [
    "General recommendation 1",
    "General recommendation 2"
  ]
}

**CRITICAL RULES:**
1. Output ONLY valid JSON - no markdown, no explanations
2. Be SPECIFIC with fixes - provide exact Tailwind classes
3. Focus on VISIBLE differences, not theoretical ones
4. If images are identical, score 100 and say so
5. Prioritize critical differences over minor ones

**IMAGES PROVIDED:**
- Image 1: REFERENCE (the target design)
- Image 2: GENERATED (the component to verify)

**NOW COMPARE THE TWO IMAGES AND OUTPUT JSON:**
`;

export async function POST(request: NextRequest) {
  try {
    const { 
      referenceImageBase64,
      referenceImageUrl,
      generatedImageBase64,
      generatedImageUrl,
      generatedHtml // Optional: if provided, we could render and screenshot it
    } = await request.json();
    
    // Need at least reference image
    if (!referenceImageBase64 && !referenceImageUrl) {
      return NextResponse.json({ error: "No reference image provided" }, { status: 400 });
    }
    
    // Need generated image or HTML
    if (!generatedImageBase64 && !generatedImageUrl && !generatedHtml) {
      return NextResponse.json({ error: "No generated component image or HTML provided" }, { status: 400 });
    }

    // Use Gemini 3 Flash for Agentic Vision QA
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      }
    });

    // Helper to prepare image part
    const prepareImagePart = async (base64?: string, url?: string) => {
      if (base64) {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = base64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        };
      } else if (url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/png';
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        };
      }
      return null;
    };

    // Prepare both images
    const referenceImage = await prepareImagePart(referenceImageBase64, referenceImageUrl);
    const generatedImage = await prepareImagePart(generatedImageBase64, generatedImageUrl);

    if (!referenceImage || !generatedImage) {
      return NextResponse.json({ error: "Failed to prepare images" }, { status: 400 });
    }

    const result = await model.generateContent([
      { text: QA_TESTER_PROMPT },
      { text: "REFERENCE IMAGE:" },
      referenceImage,
      { text: "GENERATED IMAGE:" },
      generatedImage
    ]);

    const responseText = result.response.text();
    
    // Parse JSON from response
    let qaReport;
    try {
      let jsonStr = responseText
        .replace(/^```(?:json)?\s*\n?/gim, '')
        .replace(/```\s*$/gim, '')
        .trim();
      
      qaReport = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse QA JSON:", responseText);
      return NextResponse.json({ 
        error: "Failed to parse QA report",
        rawResponse: responseText 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      qaReport: qaReport,
      message: `QA Complete: ${qaReport.verdict} (${qaReport.score}%)`
    });

  } catch (error: any) {
    console.error("Vision QA error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to compare images" 
    }, { status: 500 });
  }
}
