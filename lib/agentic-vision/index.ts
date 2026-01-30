/**
 * Agentic Vision - The Sandwich Architecture
 * 
 * Phase 1: THE SURVEYOR - Measures before generation
 * Phase 2: THE QA TESTER - Verifies after render
 * 
 * "Measure twice, cut once"
 */

// Types
export * from './types';

// Surveyor (Phase 1)
export { 
  runSurveyor, 
  runParallelSurveyor,
  validateMeasurements 
} from './surveyor';

// QA Tester (Phase 2)
export { 
  runQATester, 
  quickSSIMCheck,
  formatQAReport 
} from './qa-tester';

// Prompts
export { 
  SURVEYOR_PROMPT,
  SURVEYOR_COLORS_PROMPT,
  SURVEYOR_SPACING_PROMPT,
  QA_TESTER_PROMPT,
  formatSurveyorDataForPrompt 
} from './prompts';
