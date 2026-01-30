/**
 * Agentic Vision Types
 * 
 * Types for the "Sandwich Architecture":
 * - Phase 1: Surveyor (measures before generation)
 * - Phase 2: QA Tester (verifies after render)
 */

// ============================================================================
// SURVEYOR TYPES (Phase 1 - Pre-generation measurement)
// ============================================================================

export interface SurveyorResult {
  success: boolean;
  measurements?: LayoutMeasurements;
  error?: string;
  executionTime?: number;
  codeExecuted?: string;
}

export interface LayoutMeasurements {
  /** Image dimensions for coordinate scaling */
  imageDimensions: {
    width: number;
    height: number;
  };
  
  /** Grid structure detection */
  grid: {
    columns: number;
    rows?: number;
    gap: string;
    gutters?: string;
  };
  
  /** Spacing measurements in pixels */
  spacing: {
    sidebarWidth: string;
    navHeight: string;
    cardPadding: string;
    sectionGap: string;
    containerPadding: string;
    cardGap?: string;
  };
  
  /** Colors sampled from actual pixels */
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary?: string;
    text: string;
    textMuted: string;
    border: string;
    accent?: string;
  };
  
  /** Typography measurements */
  typography: {
    h1: string;
    h2: string;
    h3?: string;
    body: string;
    small: string;
    fontFamily?: string;
  };
  
  /** Component boundaries (normalized 0-1 coordinates) */
  components: ComponentBoundary[];
  
  /** Confidence score 0-1 */
  confidence: number;
  
  /** Any warnings during measurement */
  warnings?: string[];
}

export interface ComponentBoundary {
  type: 'sidebar' | 'navbar' | 'main' | 'card' | 'table' | 'chart' | 'form' | 'footer' | 'header' | 'section';
  /** Normalized coordinates (0-1) */
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Absolute pixel coordinates (for reference) */
  pixelBbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label?: string;
  confidence: number;
}

// ============================================================================
// QA TESTER TYPES (Phase 2 - Post-render verification)
// ============================================================================

export interface QATestResult {
  success: boolean;
  verification?: VerificationReport;
  error?: string;
  executionTime?: number;
  codeExecuted?: string;
}

export interface VerificationReport {
  /** Structural Similarity Index (0-1) */
  ssimScore: number;
  
  /** Overall accuracy percentage */
  overallAccuracy: string;
  
  /** Detailed issues found */
  issues: VerificationIssue[];
  
  /** Auto-fix suggestions */
  autoFixSuggestions: AutoFixSuggestion[];
  
  /** Areas with significant differences */
  diffRegions?: DiffRegion[];
  
  /** Pass/Fail verdict */
  verdict: 'pass' | 'needs_fixes' | 'major_issues';
}

export interface VerificationIssue {
  type: 'color' | 'spacing' | 'layout' | 'typography' | 'missing' | 'extra' | 'size';
  severity: 'low' | 'medium' | 'high';
  location: string;
  description: string;
  expected?: string;
  actual?: string;
}

export interface AutoFixSuggestion {
  selector: string;
  property: string;
  currentValue?: string;
  suggestedValue: string;
  confidence: number;
}

export interface DiffRegion {
  /** Normalized coordinates (0-1) */
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  diffPercentage: number;
  category: string;
}

// ============================================================================
// CODE EXECUTION TYPES
// ============================================================================

export interface CodeExecutionPart {
  executableCode?: {
    language: string;
    code: string;
  };
  codeExecutionResult?: {
    outcome: 'OUTCOME_OK' | 'OUTCOME_FAILED';
    output: string;
  };
  text?: string;
}

export interface AgenticVisionConfig {
  /** Model to use (default: gemini-3-flash) */
  model?: string;
  /** Temperature (default: 0.1 for precise measurements) */
  temperature?: number;
  /** Timeout in ms (default: 60000) */
  timeout?: number;
  /** Whether to return raw code execution output */
  includeRawOutput?: boolean;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface NormalizedCoordinate {
  /** X position (0-1 relative to image width) */
  x: number;
  /** Y position (0-1 relative to image height) */
  y: number;
}

export interface PixelCoordinate {
  x: number;
  y: number;
}

/** Convert normalized coordinates to pixel coordinates */
export function normalizedToPixel(
  normalized: NormalizedCoordinate,
  imageWidth: number,
  imageHeight: number
): PixelCoordinate {
  return {
    x: Math.round(normalized.x * imageWidth),
    y: Math.round(normalized.y * imageHeight),
  };
}

/** Convert pixel coordinates to normalized */
export function pixelToNormalized(
  pixel: PixelCoordinate,
  imageWidth: number,
  imageHeight: number
): NormalizedCoordinate {
  return {
    x: pixel.x / imageWidth,
    y: pixel.y / imageHeight,
  };
}
