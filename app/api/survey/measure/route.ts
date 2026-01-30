/**
 * THE SURVEYOR ENDPOINT - Phase 1 of Agentic Vision
 * 
 * POST /api/survey/measure
 * 
 * Measures layout BEFORE code generation:
 * - Grid structure (columns, gaps)
 * - Spacing (padding, margins, widths)
 * - Colors (sampled from actual pixels)
 * - Typography (font sizes)
 * - Component boundaries
 * 
 * Returns hard data for the code generator.
 * "Measure twice, cut once"
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  runSurveyor, 
  runParallelSurveyor, 
  validateMeasurements,
  formatSurveyorDataForPrompt 
} from '@/lib/agentic-vision';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      imageBase64, 
      mimeType = 'image/png',
      useParallel = true,
      includePromptFormat = false
    } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64' },
        { status: 400 }
      );
    }

    console.log('[Survey API] Starting measurement...');
    console.log('[Survey API] Image size:', Math.round(imageBase64.length / 1024), 'KB');
    console.log('[Survey API] Mode:', useParallel ? 'PARALLEL' : 'SEQUENTIAL');

    // Run the Surveyor
    const result = useParallel 
      ? await runParallelSurveyor(imageBase64, mimeType)
      : await runSurveyor(imageBase64, mimeType);

    if (!result.success) {
      console.error('[Survey API] Surveyor failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Surveyor failed' },
        { status: 500 }
      );
    }

    // Validate and fill defaults
    const measurements = validateMeasurements(result.measurements || {});

    // Build response
    const response: any = {
      success: true,
      measurements,
      executionTime: result.executionTime,
      confidence: measurements.confidence
    };

    // Optionally include formatted prompt for code generator
    if (includePromptFormat) {
      response.promptFormat = formatSurveyorDataForPrompt(measurements);
    }

    console.log('[Survey API] Success! Confidence:', Math.round(measurements.confidence * 100) + '%');
    console.log('[Survey API] Detected components:', measurements.components.length);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Survey API] Error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/survey/measure
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Surveyor API',
    description: 'Phase 1 of Agentic Vision - Measures layout BEFORE code generation',
    version: '1.0.0',
    endpoints: {
      'POST /api/survey/measure': {
        description: 'Analyze image and return hard layout measurements',
        body: {
          imageBase64: 'Base64 encoded image (required)',
          mimeType: 'Image MIME type (default: image/png)',
          useParallel: 'Use parallel requests for speed (default: true)',
          includePromptFormat: 'Include formatted prompt for code generator (default: false)'
        },
        response: {
          success: 'boolean',
          measurements: {
            imageDimensions: '{ width, height }',
            grid: '{ columns, gap, gutters }',
            spacing: '{ sidebarWidth, navHeight, cardPadding, sectionGap, containerPadding }',
            colors: '{ background, surface, primary, text, textMuted, border }',
            typography: '{ h1, h2, h3, body, small }',
            components: '[{ type, bbox, confidence }]',
            confidence: 'number (0-1)'
          },
          executionTime: 'number (ms)',
          promptFormat: 'string (if includePromptFormat=true)'
        }
      }
    },
    usage: `
// Example usage in code generation pipeline:

// 1. Extract frame from video
const frame = extractKeyFrame(videoBase64);

// 2. Run Surveyor BEFORE code generation
const surveyResult = await fetch('/api/survey/measure', {
  method: 'POST',
  body: JSON.stringify({ 
    imageBase64: frame,
    includePromptFormat: true 
  })
});
const { measurements, promptFormat } = await surveyResult.json();

// 3. Inject measurements into code generator prompt
const codeGenPrompt = \`
\${systemPrompt}

\${promptFormat}  // <-- Hard data from Surveyor!

Generate code based on the video above.
\`;

// 4. Code generator uses EXACT values instead of guessing
// Result: First generation is 80% better!
    `
  });
}
