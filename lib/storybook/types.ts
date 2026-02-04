/**
 * Storybook Factory Types
 * 
 * Types for the multi-tenant Storybook generation system.
 */

/**
 * Property definition for a component
 */
export interface PropDefinition {
  /** Property name */
  name: string;
  /** TypeScript type */
  type: string;
  /** Default value (if any) */
  defaultValue?: string;
  /** Whether the prop is required */
  required?: boolean;
  /** Description for documentation */
  description?: string;
  /** Possible values for enum/union types */
  options?: string[];
}

/**
 * Component data extracted from generated code
 */
export interface ComponentData {
  /** Component name (PascalCase) */
  name: string;
  /** Raw HTML/JSX code of the component */
  code: string;
  /** Extracted props */
  props: PropDefinition[];
  /** Available variants (e.g., "primary", "secondary") */
  variants?: string[];
  /** Default props for the story */
  defaultProps?: Record<string, any>;
  /** Component description for documentation */
  description?: string;
  /** Component category for organization */
  category?: "layout" | "ui" | "section" | "form" | "display";
  /** CSS classes used by the component */
  cssClasses?: string[];
}

/**
 * Storybook build request payload
 */
export interface StorybookBuildRequest {
  /** Unique project ID */
  projectId: string;
  /** Array of components to include */
  components: ComponentData[];
  /** Project title for documentation */
  projectTitle?: string;
  /** Optional theme configuration */
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * Storybook build response
 */
export interface StorybookBuildResponse {
  /** Build status */
  status: "success" | "error" | "building";
  /** URL to the generated Storybook */
  url?: string;
  /** Error or success message */
  message?: string;
  /** Additional error details */
  details?: string;
}

/**
 * Generated file info
 */
export interface GeneratedFile {
  /** File path relative to project root */
  path: string;
  /** File name */
  name: string;
  /** File contents */
  content: string;
  /** File type */
  type: "component" | "story" | "config" | "style";
}
