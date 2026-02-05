// ============================================
// Design System Types
// ============================================

/**
 * Source type for where a Design System originated
 */
export type DesignSystemSourceType = 'video' | 'storybook' | 'manual' | 'figma';

/**
 * Layer classification for components (Atomic Design + Product)
 */
export type ComponentLayer = 
  | 'foundations'  // Design tokens, colors, typography
  | 'primitives'   // Basic building blocks (Icon, Text, Box)
  | 'elements'     // Simple components (Button, Input, Badge)
  | 'components'   // Composite components (Card, Modal, Dropdown)
  | 'patterns'     // Complex patterns (DataTable, Form, Navigation)
  | 'product';     // Product-specific components

/**
 * Category for component organization
 */
export type ComponentCategory = 
  | 'layout' 
  | 'navigation' 
  | 'form' 
  | 'feedback' 
  | 'data-display' 
  | 'overlay' 
  | 'media'
  | 'typography'
  | 'utility';

// ============================================
// Design Tokens
// ============================================

export interface DesignTokens {
  colors: Record<string, string>;
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

// ============================================
// Component Types
// ============================================

export interface ComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'function' | 'ReactNode';
  required: boolean;
  defaultValue: any;
  description: string;
  options?: string[];  // For enums
  control: 'input' | 'select' | 'toggle' | 'range' | 'color' | 'object' | 'action';
}

export interface ComponentVariant {
  name: string;           // "Default", "Primary", "Disabled"
  props: Record<string, any>;
  screenshot?: string;
}

export interface ComponentDocs {
  description: string;
  usage: string;
  accessibility: string;
  bestPractices: string[];
}

// ============================================
// Design System (Database Entity)
// ============================================

export interface DesignSystem {
  id: string;
  user_id: string;
  name: string;
  source_type: DesignSystemSourceType | null;
  source_url?: string | null;
  tokens: DesignTokens;
  is_default: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields (from joins/aggregates)
  component_count?: number;
}

export interface DesignSystemWithComponents extends DesignSystem {
  components: DesignSystemComponent[];
}

// ============================================
// Design System Component (Database Entity)
// ============================================

export interface DesignSystemComponent {
  id: string;
  design_system_id: string;
  name: string;
  layer: ComponentLayer;
  category?: ComponentCategory | string;
  code: string;
  variants: ComponentVariant[];
  props: ComponentProp[];
  docs: ComponentDocs;
  source_generation_id?: string | null;
  is_approved: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Local Component (Project-specific, not saved to DS)
// ============================================

export interface LocalComponent {
  id: string;
  name: string;
  code: string;
  layer: ComponentLayer | string;
  category?: ComponentCategory | string;
  variants?: ComponentVariant[];
  props?: ComponentProp[];
  docs?: Partial<ComponentDocs>;
  isNew: boolean;           // Was created in this generation (not from DS)
  savedToLibrary: boolean;  // Has been promoted to Design System
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateDesignSystemRequest {
  name: string;
  source_type?: DesignSystemSourceType;
  source_url?: string;
  tokens?: Partial<DesignTokens>;
  is_default?: boolean;
}

export interface UpdateDesignSystemRequest {
  name?: string;
  tokens?: DesignTokens;
  is_default?: boolean;
  is_public?: boolean;
}

export interface CreateComponentRequest {
  name: string;
  layer: ComponentLayer;
  category?: string;
  code: string;
  variants?: ComponentVariant[];
  props?: ComponentProp[];
  docs?: ComponentDocs;
  source_generation_id?: string;
}

export interface UpdateComponentRequest {
  name?: string;
  layer?: ComponentLayer;
  category?: string;
  code?: string;
  variants?: ComponentVariant[];
  props?: ComponentProp[];
  docs?: ComponentDocs;
  is_approved?: boolean;
}

export interface PromoteComponentRequest {
  generationId: string;
  componentId: string;  // Local component ID
  name: string;
  code: string;
  layer: ComponentLayer;
  category?: string;
  variants?: ComponentVariant[];
  props?: ComponentProp[];
  docs?: ComponentDocs;
}

// ============================================
// Design System List Item (for dropdowns/lists)
// ============================================

export interface DesignSystemListItem {
  id: string;
  name: string;
  component_count: number;
  is_default: boolean;
  source_type: DesignSystemSourceType | null;
  updated_at: string;
}

// ============================================
// Generation with Design System
// ============================================

export interface GenerationWithDesignSystem {
  id: string;
  design_system_id: string | null;
  local_components: LocalComponent[];
  // ... other generation fields
}

// ============================================
// Utility Types
// ============================================

export const DEFAULT_TOKENS: DesignTokens = {
  colors: {},
  typography: {
    fontFamily: {},
    fontSize: {},
    fontWeight: {},
    lineHeight: {},
  },
  spacing: {},
  borderRadius: {},
  shadows: {},
};

export const LAYER_ORDER: ComponentLayer[] = [
  'foundations',
  'primitives',
  'elements',
  'components',
  'patterns',
  'product',
];

export const LAYER_LABELS: Record<ComponentLayer, string> = {
  foundations: 'Foundations',
  primitives: 'Primitives',
  elements: 'Elements',
  components: 'Components',
  patterns: 'Patterns',
  product: 'Product',
};

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  layout: 'Layout',
  navigation: 'Navigation',
  form: 'Form',
  feedback: 'Feedback',
  'data-display': 'Data Display',
  overlay: 'Overlay',
  media: 'Media',
  typography: 'Typography',
  utility: 'Utility',
};
