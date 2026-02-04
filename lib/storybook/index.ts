/**
 * Storybook Factory Module
 * 
 * Multi-tenant Storybook generation system for per-project design systems.
 * 
 * @example
 * import { extractComponentsFromCode, generateStoryFile } from "@/lib/storybook";
 * 
 * const components = extractComponentsFromCode(generatedCode);
 * const stories = components.map(c => generateStoryFile(c));
 */

// Types
export type {
  ComponentData,
  PropDefinition,
  StorybookBuildRequest,
  StorybookBuildResponse,
  GeneratedFile,
} from "./types";

// Story Generator
export {
  generateStoryFile,
  generateComponentFile,
  generateBarrelExport,
  generateStylesFile,
} from "./story-generator";

// Component Extractor
export {
  extractComponentsFromCode,
  extractComponentsFromFileStructure,
  extractPropsFromElement,
  extractVariantsFromElement,
} from "./component-extractor";
