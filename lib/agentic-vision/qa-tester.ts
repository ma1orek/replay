/**
 * THE QA TESTER - Phase 2 of Agentic Vision
 * 
 * Verifies generated UI AFTER render.
 * "Spot the Difference" with SSIM and auto-fix suggestions
 * 
 * Uses Gemini 3 Flash with Code Execution to:
 * - Compare original vs generated screenshots
 * - Calculate SSIM (Structural Similarity Index)
 * - Identify difference regions
 * - Generate auto-fix CSS suggestions
 */

import { GoogleGenAI } from '@google/genai';
import { 
  QATestResult, 
  VerificationReport, 
  AgenticVisionConfig 
} from './types';
import { QA_TESTER_PROMPT } from './prompts';

// Initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Run the QA Tester to compare original vs generated UI
 */
export async function runQATester(
  originalImageBase64: string,
  generatedImageBase64: string,
  mimeType: string = 'image/png',
  config: AgenticVisionConfig = {}
): Promise<QATestResult> {
  const startTime = Date.now();
  
  try {
    const ai = getGeminiClient();
    
    const modelName = config.model || 'gemini-3-flash';
    const timeout = config.timeout || 90000; // QA may take longer
    
    console.log('[QA Tester] Starting verification with', modelName);
    
    // Create the request with both images
    const response = await Promise.race([
      ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: QA_TESTER_PROMPT },
              { 
                text: '\n\nIMAGE 1 - ORIGINAL (Source of Truth):' 
              },
              { 
                inlineData: { 
                  data: originalImageBase64, 
                  mimeType 
                } 
              },
              { 
                text: '\n\nIMAGE 2 - GENERATED (What we produced):' 
              },
              { 
                inlineData: { 
                  data: generatedImageBase64, 
                  mimeType 
                } 
              }
            ]
          }
        ],
        config: {
          temperature: config.temperature || 0.1,
          maxOutputTokens: 8192,
          tools: [{ codeExecution: {} }]
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('QA Tester timed out')), timeout)
      )
    ]);
    
    // Parse the response
    const result = parseQAResponse(response);
    
    const executionTime = Date.now() - startTime;
    console.log(`[QA Tester] Completed in ${executionTime}ms - SSIM: ${result.verification?.ssimScore || 'N/A'}`);
    
    return {
      success: true,
      verification: result.verification || undefined,
      executionTime,
      codeExecuted: result.codeExecuted
    };
    
  } catch (error: any) {
    console.error('[QA Tester] Error:', error?.message);
    return {
      success: false,
      error: error?.message || 'QA Tester failed',
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Quick SSIM check without full analysis
 */
export async function quickSSIMCheck(
  originalImageBase64: string,
  generatedImageBase64: string,
  mimeType: string = 'image/png'
): Promise<{ ssimScore: number; verdict: string } | null> {
  try {
    const ai = getGeminiClient();
    
    const quickPrompt = `Calculate SSIM between these two images using Python.

Use skimage.metrics.structural_similarity:
\`\`\`python
from skimage.metrics import structural_similarity as ssim
from PIL import Image
import numpy as np
import io

# Images are provided as image1 and image2
img1_gray = np.array(image1.convert('L'))
img2_gray = np.array(image2.convert('L'))

# Resize if needed
if img1_gray.shape != img2_gray.shape:
    from skimage.transform import resize
    img2_gray = (resize(img2_gray, img1_gray.shape) * 255).astype(np.uint8)

score = ssim(img1_gray, img2_gray)
print(f"SSIM: {score:.4f}")
\`\`\`

Return ONLY: { "ssimScore": 0.XX, "verdict": "pass|needs_fixes|major_issues" }
- pass: >= 0.95
- needs_fixes: >= 0.85
- major_issues: < 0.85`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: quickPrompt },
            { inlineData: { data: originalImageBase64, mimeType } },
            { inlineData: { data: generatedImageBase64, mimeType } }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        tools: [{ codeExecution: {} }]
      }
    });
    
    // Parse quick result
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      const text = part.codeExecutionResult?.output || part.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    return null;
  } catch (error) {
    console.error('[QA Tester] Quick SSIM check failed:', error);
    return null;
  }
}

/**
 * Parse the QA Tester response
 */
function parseQAResponse(response: any): {
  verification: VerificationReport | undefined;
  codeExecuted?: string;
} {
  try {
    const candidate = response.candidates?.[0];
    if (!candidate) {
      console.warn('[QA Tester] No candidates in response');
      return { verification: undefined };
    }
    
    const parts = candidate.content?.parts || [];
    let codeExecuted = '';
    let jsonOutput = '';
    
    // Extract code and results from parts
    for (const part of parts) {
      if (part.executableCode) {
        codeExecuted += part.executableCode.code + '\n';
      }
      if (part.codeExecutionResult) {
        if (part.codeExecutionResult.outcome === 'OUTCOME_OK') {
          jsonOutput = part.codeExecutionResult.output;
        }
      }
      if (part.text) {
        const textContent = part.text.trim();
        if (textContent.startsWith('{') && textContent.endsWith('}')) {
          jsonOutput = textContent;
        }
      }
    }
    
    // Parse JSON output
    if (jsonOutput) {
      let cleanJson = jsonOutput.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const verification = JSON.parse(jsonMatch[0]) as VerificationReport;
        return { verification, codeExecuted };
      }
    }
    
    // Try to find JSON in any part
    for (const part of parts) {
      if (part.text) {
        const jsonMatch = part.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const verification = JSON.parse(jsonMatch[0]) as VerificationReport;
            return { verification, codeExecuted };
          } catch {
            // Continue
          }
        }
      }
    }
    
    console.warn('[QA Tester] Could not parse verification from response');
    return { verification: undefined, codeExecuted };
    
  } catch (error: any) {
    console.error('[QA Tester] Parse error:', error?.message);
    return { verification: null };
  }
}

/**
 * Format QA results for display
 */
export function formatQAReport(verification: VerificationReport): string {
  const emoji = verification.verdict === 'pass' ? '✅' : 
                verification.verdict === 'needs_fixes' ? '⚠️' : '❌';
  
  let report = `
${emoji} QA VERIFICATION REPORT
═══════════════════════════════════════════════════════════════

**SSIM Score:** ${verification.ssimScore.toFixed(4)} (${verification.overallAccuracy})
**Verdict:** ${verification.verdict.toUpperCase()}

`;

  if (verification.issues.length > 0) {
    report += `**Issues Found (${verification.issues.length}):**\n`;
    for (const issue of verification.issues) {
      const icon = issue.severity === 'high' ? '🔴' : 
                   issue.severity === 'medium' ? '🟡' : '🟢';
      report += `${icon} [${issue.type}] ${issue.location}: ${issue.description}\n`;
      if (issue.expected && issue.actual) {
        report += `   Expected: ${issue.expected} | Actual: ${issue.actual}\n`;
      }
    }
    report += '\n';
  }

  if (verification.autoFixSuggestions.length > 0) {
    report += `**Auto-Fix Suggestions (${verification.autoFixSuggestions.length}):**\n`;
    for (const fix of verification.autoFixSuggestions) {
      report += `- ${fix.selector} { ${fix.property}: ${fix.suggestedValue} }\n`;
    }
  }

  return report;
}
