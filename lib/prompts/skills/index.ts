// ============================================================================
// REPLAY.BUILD - SKILLS INDEX
// Centralized exports for all skills from skills.sh ecosystem
// ============================================================================

// Design Skills
export {
  FRONTEND_DESIGN_SKILL,
  WEB_DESIGN_GUIDELINES_SKILL,
  DESIGN_SYSTEM_PATTERNS_SKILL,
  TAILWIND_DESIGN_SYSTEM_SKILL,
  COMBINED_DESIGN_SKILLS,
} from './design-skills';

// SEO Skills
export {
  SEO_AUDIT_SKILL,
  COPYWRITING_SKILL,
  PROGRAMMATIC_SEO_SKILL,
  SCHEMA_MARKUP_SKILL,
  COMBINED_SEO_SKILLS,
  REPLAY_SEO_CONTEXT,
} from './seo-skills';

// Code Quality Skills
export {
  TYPESCRIPT_ADVANCED_TYPES_SKILL,
  API_DESIGN_PRINCIPLES_SKILL,
  E2E_TESTING_PATTERNS_SKILL,
  ERROR_HANDLING_PATTERNS_SKILL,
  COMBINED_CODE_SKILLS,
} from './code-skills';

/**
 * Get all skills combined for comprehensive prompts
 */
export function getAllSkills(): string {
  return `
═══════════════════════════════════════════════════════════════════════════════
🚀 REPLAY SKILLS LIBRARY (from skills.sh ecosystem)
═══════════════════════════════════════════════════════════════════════════════

The following skills are integrated from the open-source skills.sh ecosystem
to enhance code generation quality and follow industry best practices.

Sources:
- frontend-design (anthropics/skills) - 21.8K installs
- web-design-guidelines (vercel-labs/agent-skills) - 47.7K installs
- vercel-react-best-practices (vercel-labs/agent-skills) - 63K installs
- seo-audit (coreyhaines31/marketingskills) - 6.6K installs
- typescript-advanced-types (wshobson/agents)
- api-design-principles (wshobson/agents)

═══════════════════════════════════════════════════════════════════════════════
`;
}

/**
 * Get skills for UI generation (design + code)
 */
export function getUIGenerationSkills(): string {
  const { COMBINED_DESIGN_SKILLS } = require('./design-skills');
  const { TYPESCRIPT_ADVANCED_TYPES_SKILL } = require('./code-skills');
  
  return `${COMBINED_DESIGN_SKILLS}\n\n${TYPESCRIPT_ADVANCED_TYPES_SKILL}`;
}

/**
 * Get skills for content/SEO generation
 */
export function getContentGenerationSkills(): string {
  const { COMBINED_SEO_SKILLS, REPLAY_SEO_CONTEXT } = require('./seo-skills');
  
  return `${COMBINED_SEO_SKILLS}\n\n${REPLAY_SEO_CONTEXT}`;
}

/**
 * Get skills for API/backend generation
 */
export function getAPIGenerationSkills(): string {
  const { API_DESIGN_PRINCIPLES_SKILL, ERROR_HANDLING_PATTERNS_SKILL, TYPESCRIPT_ADVANCED_TYPES_SKILL } = require('./code-skills');
  
  return `${TYPESCRIPT_ADVANCED_TYPES_SKILL}\n\n${API_DESIGN_PRINCIPLES_SKILL}\n\n${ERROR_HANDLING_PATTERNS_SKILL}`;
}

/**
 * Get skills for testing generation
 */
export function getTestingSkills(): string {
  const { E2E_TESTING_PATTERNS_SKILL } = require('./code-skills');
  
  return E2E_TESTING_PATTERNS_SKILL;
}
