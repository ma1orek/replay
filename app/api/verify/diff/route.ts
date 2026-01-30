/**
 * THE QA TESTER ENDPOINT - Phase 2 of Agentic Vision
 * 
 * POST /api/verify/diff
 * 
 * Compares original UI vs generated render:
 * - SSIM (Structural Similarity Index)
 * - Difference regions
 * - Issue categorization
 * - Auto-fix CSS suggestions
 * 
 * "Spot the Difference" with pixel-perfect precision
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  runQATester, 
  quickSSIMCheck,
  formatQAReport 
} from '@/lib/agentic-vision';

export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minutes max (comparing two images)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      originalImageBase64,
      generatedImageBase64,
      mimeType = 'image/png',
      quickCheck = false,
      includeReport = true
    } = body;

    if (!originalImageBase64 || !generatedImageBase64) {
      return NextResponse.json(
        { error: 'Missing originalImageBase64 or generatedImageBase64' },
        { status: 400 }
      );
    }

    console.log('[Verify API] Starting QA verification...');
    console.log('[Verify API] Original size:', Math.round(originalImageBase64.length / 1024), 'KB');
    console.log('[Verify API] Generated size:', Math.round(generatedImageBase64.length / 1024), 'KB');
    console.log('[Verify API] Mode:', quickCheck ? 'QUICK SSIM' : 'FULL ANALYSIS');

    // Quick SSIM check or full analysis
    if (quickCheck) {
      const result = await quickSSIMCheck(
        originalImageBase64, 
        generatedImageBase64, 
        mimeType
      );
      
      if (!result) {
        return NextResponse.json(
          { error: 'Quick SSIM check failed' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        ssimScore: result.ssimScore,
        verdict: result.verdict,
        quickCheck: true
      });
    }

    // Full QA analysis
    const result = await runQATester(
      originalImageBase64, 
      generatedImageBase64, 
      mimeType
    );

    if (!result.success) {
      console.error('[Verify API] QA failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'QA verification failed' },
        { status: 500 }
      );
    }

    // Build response
    const response: any = {
      success: true,
      verification: result.verification,
      executionTime: result.executionTime
    };

    // Optionally include formatted report
    if (includeReport && result.verification) {
      response.report = formatQAReport(result.verification);
    }

    const verdict = result.verification?.verdict || 'unknown';
    const ssim = result.verification?.ssimScore || 0;
    
    console.log(`[Verify API] Complete! SSIM: ${ssim.toFixed(4)}, Verdict: ${verdict}`);
    console.log(`[Verify API] Issues found: ${result.verification?.issues.length || 0}`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Verify API] Error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify/diff
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'QA Tester API',
    description: 'Phase 2 of Agentic Vision - Verifies generated UI against original',
    version: '1.0.0',
    endpoints: {
      'POST /api/verify/diff': {
        description: 'Compare original vs generated images and report differences',
        body: {
          originalImageBase64: 'Base64 encoded original image (required)',
          generatedImageBase64: 'Base64 encoded generated screenshot (required)',
          mimeType: 'Image MIME type (default: image/png)',
          quickCheck: 'Only calculate SSIM, skip full analysis (default: false)',
          includeReport: 'Include formatted text report (default: true)'
        },
        response: {
          success: 'boolean',
          verification: {
            ssimScore: 'number (0-1, higher is better)',
            overallAccuracy: 'string (e.g., "94%")',
            verdict: '"pass" | "needs_fixes" | "major_issues"',
            issues: '[{ type, severity, location, description, expected, actual }]',
            autoFixSuggestions: '[{ selector, property, suggestedValue, confidence }]',
            diffRegions: '[{ bbox, diffPercentage, category }]'
          },
          executionTime: 'number (ms)',
          report: 'string (formatted text report)'
        }
      }
    },
    verdictRules: {
      pass: 'SSIM >= 0.95 AND no high severity issues',
      needs_fixes: 'SSIM >= 0.85 AND <= 3 high severity issues',
      major_issues: 'SSIM < 0.85 OR > 3 high severity issues'
    },
    usage: `
// Example usage in generation pipeline:

// 1. Generate code from video
const codeResult = await generateCode(videoBase64);

// 2. Render generated code and take screenshot
const generatedScreenshot = await renderAndCapture(codeResult.code);

// 3. Extract original frame from video for comparison
const originalFrame = extractKeyFrame(videoBase64);

// 4. Run QA Tester
const qaResult = await fetch('/api/verify/diff', {
  method: 'POST',
  body: JSON.stringify({
    originalImageBase64: originalFrame,
    generatedImageBase64: generatedScreenshot
  })
});
const { verification } = await qaResult.json();

// 5. Check verdict
if (verification.verdict === 'pass') {
  console.log('✅ Pixel-perfect! SSIM:', verification.ssimScore);
} else if (verification.verdict === 'needs_fixes') {
  console.log('⚠️ Minor fixes needed:', verification.issues);
  // Apply auto-fix suggestions
  for (const fix of verification.autoFixSuggestions) {
    console.log(\`Fix: \${fix.selector} { \${fix.property}: \${fix.suggestedValue} }\`);
  }
} else {
  console.log('❌ Major issues - regenerate with more constraints');
}
    `
  });
}
