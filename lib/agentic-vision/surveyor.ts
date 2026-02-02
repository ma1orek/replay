/**
 * THE SURVEYOR - Phase 1 of Agentic Vision
 * 
 * Measures layout BEFORE code generation.
 * "Measure twice, cut once"
 * 
 * Uses Gemini 3 Flash with Code Execution to:
 * - Measure grids, spacing, padding in pixels
 * - Sample actual colors from pixels
 * - Detect component boundaries
 * - Return hard data for the code generator
 */

import { GoogleGenAI } from '@google/genai';
import { 
  SurveyorResult, 
  LayoutMeasurements, 
  AgenticVisionConfig,
  CodeExecutionPart 
} from './types';
import { SURVEYOR_PROMPT, SURVEYOR_COLORS_PROMPT, SURVEYOR_SPACING_PROMPT } from './prompts';

// Initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Run the Surveyor to measure layout from an image/video frame
 */
export async function runSurveyor(
  imageBase64: string,
  mimeType: string = 'image/png',
  config: AgenticVisionConfig = {}
): Promise<SurveyorResult> {
  const startTime = Date.now();
  
  try {
    const ai = getGeminiClient();
    
    const modelName = config.model || 'gemini-3-flash-preview';
    const timeout = config.timeout || 60000;
    
    console.log('[Surveyor] Starting measurement with', modelName);
    
    // Create the request with Code Execution enabled
    const response = await Promise.race([
      ai.models.generateContent({
        model: modelName,
        contents: [
          { 
            role: 'user',
            parts: [
              { text: SURVEYOR_PROMPT },
              { 
                inlineData: { 
                  data: imageBase64, 
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
        setTimeout(() => reject(new Error('Surveyor timed out')), timeout)
      )
    ]);

    // Parse the response
    const result = parseCodeExecutionResponse(response);
    
    const executionTime = Date.now() - startTime;
    console.log(`[Surveyor] Completed in ${executionTime}ms`);
    
    return {
      success: true,
      measurements: result.measurements || undefined,
      executionTime,
      codeExecuted: result.codeExecuted
    };
    
  } catch (error: any) {
    console.error('[Surveyor] Error:', error?.message);
    return {
      success: false,
      error: error?.message || 'Surveyor failed',
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Run parallel surveyor requests for faster results
 * - Request A: Colors and Typography (fast)
 * - Request B: Grid and Spacing (heavier CV)
 */
export async function runParallelSurveyor(
  imageBase64: string,
  mimeType: string = 'image/png',
  config: AgenticVisionConfig = {}
): Promise<SurveyorResult> {
  const startTime = Date.now();
  
  try {
    const ai = getGeminiClient();
    const modelName = config.model || 'gemini-3-flash-preview';
    
    console.log('[Surveyor] Starting PARALLEL measurement');
    
    // Run both requests in parallel
    const [colorsResult, spacingResult] = await Promise.all([
      // Request A: Colors (fast)
      ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: SURVEYOR_COLORS_PROMPT },
              { inlineData: { data: imageBase64, mimeType } }
            ]
          }
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          tools: [{ codeExecution: {} }]
        }
      }),
      // Request B: Spacing (heavier)
      ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: SURVEYOR_SPACING_PROMPT },
              { inlineData: { data: imageBase64, mimeType } }
            ]
          }
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          tools: [{ codeExecution: {} }]
        }
      })
    ]);
    
    // Parse both results
    const colors = parseCodeExecutionResponse(colorsResult);
    const spacing = parseCodeExecutionResponse(spacingResult);
    
    // Detect theme from colors if available
    const detectedTheme = colors.measurements?.theme || 
      (colors.measurements?.colors?.background ? 
        (parseInt(colors.measurements.colors.background.slice(1, 3), 16) * 299 +
         parseInt(colors.measurements.colors.background.slice(3, 5), 16) * 587 +
         parseInt(colors.measurements.colors.background.slice(5, 7), 16) * 114) / 1000 > 127 
        ? 'light' : 'dark'
      : 'dark');
    
    const isLight = detectedTheme === 'light';
    console.log(`[Surveyor] Detected theme: ${detectedTheme}`);
    
    // Merge measurements - use theme-aware defaults
    const measurements: LayoutMeasurements = {
      imageDimensions: spacing.measurements?.imageDimensions || { width: 0, height: 0 },
      grid: spacing.measurements?.grid || { columns: 12, gap: '24px' },
      spacing: spacing.measurements?.spacing || {
        sidebarWidth: '256px',
        navHeight: '64px',
        cardPadding: '24px',
        sectionGap: '48px',
        containerPadding: '32px'
      },
      // Theme-aware color defaults - light vs dark
      colors: colors.measurements?.colors || {
        background: isLight ? '#ffffff' : '#0f172a',
        surface: isLight ? '#f8fafc' : '#1e293b',
        primary: '#6366f1',
        text: isLight ? '#1e293b' : '#ffffff',
        textMuted: isLight ? '#64748b' : '#94a3b8',
        border: isLight ? '#e2e8f0' : '#334155'
      },
      typography: colors.measurements?.typography || {
        h1: '48px',
        h2: '32px',
        body: '16px',
        small: '14px'
      },
      components: spacing.measurements?.components || [],
      confidence: Math.min(
        colors.measurements?.confidence || 0.8,
        spacing.measurements?.confidence || 0.8
      ),
      // Add theme to measurements
      theme: detectedTheme,
      // Add layout structure detection
      layoutType: (spacing.measurements as any)?.layoutType,
      hasSidebar: (spacing.measurements as any)?.hasSidebar,
      hasTopNav: (spacing.measurements as any)?.hasTopNav
    } as LayoutMeasurements;
    
    const executionTime = Date.now() - startTime;
    console.log(`[Surveyor] Parallel completed in ${executionTime}ms (${Math.round(executionTime/2)}ms effective per request)`);
    
    return {
      success: true,
      measurements,
      executionTime
    };
    
  } catch (error: any) {
    console.error('[Surveyor] Parallel error:', error?.message);
    
    // Fallback to sequential
    console.log('[Surveyor] Falling back to sequential...');
    return runSurveyor(imageBase64, mimeType, config);
  }
}

/**
 * Parse the response from Gemini Code Execution
 */
function parseCodeExecutionResponse(response: any): {
  measurements: LayoutMeasurements | undefined;
  codeExecuted?: string;
} {
  try {
    const candidate = response.candidates?.[0];
    if (!candidate) {
      console.warn('[Surveyor] No candidates in response');
      return { measurements: undefined };
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
        } else {
          console.warn('[Surveyor] Code execution failed:', part.codeExecutionResult.output);
        }
      }
      if (part.text) {
        // Sometimes JSON is in text part
        const textContent = part.text.trim();
        if (textContent.startsWith('{') && textContent.endsWith('}')) {
          jsonOutput = textContent;
        }
      }
    }
    
    // Parse JSON output
    if (jsonOutput) {
      // Clean up the output - remove markdown if present
      let cleanJson = jsonOutput.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Find JSON object in output
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const measurements = JSON.parse(jsonMatch[0]) as LayoutMeasurements;
        return { measurements, codeExecuted };
      }
    }
    
    // Try to find JSON in any part
    for (const part of parts) {
      if (part.text) {
        const jsonMatch = part.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const measurements = JSON.parse(jsonMatch[0]) as LayoutMeasurements;
            return { measurements, codeExecuted };
          } catch {
            // Continue searching
          }
        }
      }
    }
    
    console.warn('[Surveyor] Could not parse measurements from response');
    return { measurements: undefined, codeExecuted };
    
  } catch (error: any) {
    console.error('[Surveyor] Parse error:', error?.message);
    return { measurements: undefined };
  }
}

/**
 * Validate measurements and fill in defaults for missing values
 * Theme-aware: uses light defaults for light theme, dark defaults for dark theme
 */
export function validateMeasurements(measurements: Partial<LayoutMeasurements>): LayoutMeasurements {
  // Detect theme from existing colors if not set
  let theme = measurements.theme;
  if (!theme && measurements.colors?.background) {
    const bg = measurements.colors.background;
    const r = parseInt(bg.slice(1, 3), 16) || 0;
    const g = parseInt(bg.slice(3, 5), 16) || 0;
    const b = parseInt(bg.slice(5, 7), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    theme = brightness > 127 ? 'light' : 'dark';
  }
  
  const isLight = theme === 'light';
  
  return {
    imageDimensions: measurements.imageDimensions || { width: 1920, height: 1080 },
    theme: theme || 'dark',
    grid: {
      columns: measurements.grid?.columns || 12,
      gap: measurements.grid?.gap || '24px',
      gutters: measurements.grid?.gutters
    },
    spacing: {
      sidebarWidth: measurements.spacing?.sidebarWidth || '256px',
      navHeight: measurements.spacing?.navHeight || '64px',
      cardPadding: measurements.spacing?.cardPadding || '24px',
      sectionGap: measurements.spacing?.sectionGap || '48px',
      containerPadding: measurements.spacing?.containerPadding || '32px',
      cardGap: measurements.spacing?.cardGap || '24px'
    },
    // Theme-aware color defaults
    colors: {
      background: measurements.colors?.background || (isLight ? '#ffffff' : '#0f172a'),
      surface: measurements.colors?.surface || (isLight ? '#f8fafc' : '#1e293b'),
      primary: measurements.colors?.primary || '#6366f1',
      secondary: measurements.colors?.secondary,
      text: measurements.colors?.text || (isLight ? '#1e293b' : '#ffffff'),
      textMuted: measurements.colors?.textMuted || (isLight ? '#64748b' : '#94a3b8'),
      border: measurements.colors?.border || (isLight ? '#e2e8f0' : '#334155'),
      accent: measurements.colors?.accent
    },
    typography: {
      h1: measurements.typography?.h1 || '48px',
      h2: measurements.typography?.h2 || '32px',
      h3: measurements.typography?.h3 || '24px',
      body: measurements.typography?.body || '16px',
      small: measurements.typography?.small || '14px',
      fontFamily: measurements.typography?.fontFamily
    },
    components: measurements.components || [],
    confidence: measurements.confidence || 0.5,
    warnings: measurements.warnings || []
  };
}
